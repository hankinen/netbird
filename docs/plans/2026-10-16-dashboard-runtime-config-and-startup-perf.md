# Dashboard Runtime Config, Asset Caching and Startup Chain Implementation Plan

WORK_ITEM: none
STEERING: none (docs/steering/README.md does not exist in this repo)

**Goal:** Remove the 2–3 s full-screen loader on reload by making built assets immutable and long-cached (runtime config moved to a separately served `/runtime-config.json`), removing the `/api/users` startup gate, and shipping a smaller font, without breaking auth, blocked/pending-approval handling or rollback.

**Inputs:**
- User target (ethan, Route B approved, upstream components may be modified), 2026-10-16.
- Perf report `/workspace/perf/dashboard-loading-report.md` and scripts in `/workspace/perf/live/` (`authsim.py`, `spin.py`, `cached.py`, `zh.py`).
- Code evidence on branch `dev` @ `89619845` (same commit the perf report analysed as `feature/theme-antd`):
  - Config: `src/utils/config.ts` (`loadConfig()` reads `require("@/config/production")` = `config.json` with `$ENV` placeholders; `tsconfig.json` paths map `@/config/{production,local,test}` to `config.json`, `.local-config.json`, `.test-config.json`); `.storybook/main.ts` has a `netbird-mock-config` Vite plugin rewriting `src/utils/config.ts`.
  - 28 module-top-level / render-time `loadConfig()` call sites (see Task 6 list) including `src/auth/OIDCProvider.tsx:19`, `src/utils/api.tsx:26`, `src/utils/netbird.ts:3`, `src/utils/unauthenticatedApi.ts:10`, `src/contexts/UsersProvider.tsx:12`, `src/contexts/AnalyticsProvider.tsx:40`.
  - Container: `docker/Dockerfile` (alpine:3.24, supervisord), `docker/Dockerfile.rootless` (entrypoint runs init then `exec nginx`), `docker/Dockerfile.ubi`, `docker/supervisord.conf` (nginx priority 100 starts BEFORE `init_react_envs` priority 201, then script does `nginx -s reload`), `docker/init_react_envs.sh` (envsubst over every file in `/usr/share/nginx/html` containing `AUTH_SUPPORTED_SCOPES`, sed-patches CSP into `/etc/nginx/http.d/default.conf`, writes `robots.txt` and `OidcTrustedDomains.js` into the html dir), `docker/default.conf` (single `location /` with `no-store` + security headers; `error_page 404 /404.html`), `docker/nginx.conf` (gzip level 9, `font/ttf`/`font/woff2` not in `gzip_types`).
  - Build: `next.config.js` (`output: "export"`), `postbuild.js` (moves inline scripts into `/assets/chunk.<md5-8>.js`), font `src/assets/fonts/Inter.ttf` (804,612 B) loaded via `localFont` in `src/layouts/AppLayout.tsx:28`.
  - Startup gates: `src/layouts/AppLayout.tsx` (Suspense → I18nProvider → AnalyticsProvider → … → InstanceSetupProvider → OIDCProvider), `src/layouts/DashboardLayout.tsx` (ApplicationProvider → … → UsersProvider), `src/app/(remote-access)/layout.tsx` (UsersProvider), `src/contexts/ApplicationProvider.tsx` (`populateCache` GET `/users`, 3 tries, blocks render; introduced upstream by 80ce7d21 "Fix issue where the first users cache is not populated (#366)"), `src/contexts/UsersProvider.tsx` (`/users?service_user=false|true`, `/users/current` keyed `["/users/current","user-profile"]`, fallback `users.find(u => u.is_current)`, `resolveRefusedUser`), `src/contexts/InstanceSetupProvider.tsx` (`/api/instance`), `src/auth/SecureProvider.tsx` (1500 ms delayed `login()`).
  - Deploy: `.github/workflows/deploy.yml` (builds `out/`, tars it, `ssh <deploy-user>@<host> deploy < dashboard.tgz`), server forced command `/workspace/nbci/nb-dashboard-deploy` (extract to `releases/<ts>`, `rsync -a --delete` into `html/`, `docker restart netbird-dashboard`, keep 5 releases), `/workspace/deploy-notes/Dockerfile` (`FROM netbirdio/dashboard:latest`, only `out/` replaced), `/workspace/deploy-notes/docker-compose.yml`, `/workspace/deploy-notes/install.sh` (dashboard.env: `AUTH_CLIENT_SECRET=` empty, redirect URIs `/nb-auth`, `/nb-silent-auth`).
  - Tests: Vitest `npm run test:unit` (`vitest.config.mts`, jsdom, `src/**/*.test.{ts,tsx}`; existing `src/contexts/UsersProvider.test.ts` and 10 tests that `vi.mock("@utils/config")`), Playwright `npm run test` (`e2e/`, test env writes `.test-config.json` from `e2e/environment/create-test-env.sh:587`), Storybook visual `npm run test:visual`, lint `npm run lint`, types `npx tsc --noEmit`; CI `.github/workflows/unit-tests.yml`.
- Upstream: remote `origin` = netbirdio/dashboard; merge-base `0d0304d2` (2026-10-12); `origin/main` = `0d020d44` (2026-10-14, `v2.94.0-25`). `docker/`, `src/utils/config.ts`, `src/utils/api.tsx`, all startup providers are byte-identical to upstream; fork-only diffs touch `AppLayout.tsx`, `OIDCError.tsx`, `SessionLost.tsx`, `package.json`, workflows.
- Live probes (read-only GET, 2026-10-16): `/_next/static/chunks/2bcwncibxdt0a.js` contains the substituted origin `203.0.113.10` (mutable hashed chunk confirmed); `/assets/chunk.956f46f0.js` contains no config; missing JS → `404 text/html` (404.html body); `/nb-auth` → `404 text/html` (OIDC callback currently works through the 404 page); `/peers/` → 403; `/OidcTrustedDomains.js` → 200 (generated, unused); `/runtime-config.json` → 404.

**Scope Boundaries:**
- In scope: runtime config contract + generator + client loader; removal of all module-top-level `loadConfig()`; auth-state namespacing on config change; dead Service-Worker artefacts; nginx cache/MIME/404/security-header policy; container start ordering and read-only build dir; build-time immutability check, precompression and WOFF2 font; startup-chain changes (`/api/users` gate removal, `/users/current` as gate, parallel instance check, SWR scoping, logout cancellation); server release flow with asset support window and rollback; measurement against the real prod chain.
- Out of scope: framework change, data-library migration, config centre, SSR, PWA/offline cache, Management permission rework, HTTPS/HTTP2 (separate backend plan), i18n chunk merging / `I18nProvider` preload changes (owned by the i18n agent; only noted, not touched), Traefik-label quick fix (superseded by this plan), any server change before ethan approves the release task.

**Assumptions:**
- Execution happens on a feature branch off `dev`; other agents keep committing to `dev`, so every task rebases and re-runs its `rg` checks before editing.
- A Docker-capable runner (GitHub Actions `ubuntu-latest` or a local Docker host) is available for container tasks; the box has no `docker` binary (verified), but has `node`, `npm`, `bash`, `jq`, `python3`.
- `node_modules` is not installed in `/workspace/netbird-dashboard-theme`; every Node verification starts with `npm ci`.
- The production dashboard is a single container (`netbird-dashboard`) behind Traefik with no shared HTTP cache in between (compose shows one replica, Traefik has no cache middleware) — to be confirmed in Task 0.

### Open Questions (verify at execution time, answers recorded in Task 0 output)

1. Upstream baseline: re-run `git fetch origin && git merge-base origin/main HEAD`; check netbirdio/dashboard for an in-flight runtime-config / cache-header change so the fork does not diverge needlessly (search upstream PRs/issues for "runtime config", "no-store", "Cache-Control").
2. Management compatibility range: which oldest Management version must the dashboard support? Does it serve `/api/users/current`, and with which status/message for pending vs blocked users (UsersProvider comment says older Management reports pending as "blocked" on `/users/current`)? Does `/users/current` trigger the same first-login account/user provisioning and IdP-cache warm-up that #366's `/users` gate was added for (check `management/server/http/handlers/users` + `GetAccountIDFromUserAuth` in the netbird-server v0.80.0 fork, and the non-embedded IdP path)?
3. Service Worker: confirmed unused in this branch (`service_worker_relative_url` commented out in `src/auth/OIDCProvider.tsx:63`, `OidcServiceWorker.js` never copied into `public/`, nothing loads `OidcTrustedDomains.js`). Confirm no deployment overrides this (e.g. upstream image variant) before deleting generation.
4. Single replica / deploy topology: confirm the server's real compose (`/opt/netbird/docker-compose.yml`) — the deploy script says `html/` is bind-mounted into the container, but `/workspace/deploy-notes/docker-compose.yml` has no such volume and the image is `netbird-dashboard-zh:latest` built `FROM netbirdio/dashboard:latest`. So production currently runs the **official upstream** nginx config and init script, not this repo's `docker/`.
5. `AUTH_CLIENT_SECRET`: empty in prod, but upstream supports it (`token_request_extras.client_secret`). Route B forbids secrets in public config → decide: drop with a loud start-up warning (recommended) or fail start when set.
6. `gzip_static` / brotli: verify `nginx -V` of `alpine:3.24` nginx includes `--with-http_gzip_static_module`; check whether `nginx-mod-http-brotli` exists for 3.24.
7. Support window length for old hashed assets (proposal: keep assets of the last 5 releases AND at least 14 days).

## Task List

### Task 0: Baseline, open-question answers and asset-mutation inventory

**Files:**
- Create: `docs/plans/evidence/2026-10-16-runtime-config-baseline.md`

**Steps:**
1. Record `git rev-parse HEAD`, `git merge-base origin/main HEAD`, `git log -1 --format=%H origin/main` and upstream PR search result (Open Question 1).
2. `npm ci && npm run build`, then list every file under `out/` that contains a `$AUTH_`/`$NETBIRD_`/`$USE_AUTH0` placeholder (expected: one `_next/static/chunks/*.js`, possibly HTML/`/assets/chunk.*.js` if GTM inline script renders).
3. Record `sha256sum` of all files under `out/_next/static` and `out/assets` as the pre-change manifest.
4. Answer Open Questions 2–7 (Management source reading, `docker run --rm alpine:3.24 sh -c 'apk add -q nginx && nginx -V'`, ask ethan for server compose output / Q5 / Q7) and write them into the evidence file.
5. Capture a live baseline with `/workspace/perf/live/authsim.py live 220 en-US` and `spin.py 5` (shell-visible, workspace-ready, page-data-ready timestamps).

**Verification:**
- Run: `rg -l '\$(AUTH_|NETBIRD_|USE_AUTH0)' out/`
- Expect: non-empty list (documents today's mutable files; the same command must return nothing after Task 6).
- Run: `test -f docs/plans/evidence/2026-10-16-runtime-config-baseline.md && rg -n "^## Open Question" docs/plans/evidence/2026-10-16-runtime-config-baseline.md`
- Expect: 7 answered sections.

**Dependencies:**
- none
**Output:**
- Baseline evidence file (versions, placeholder inventory, sha256 manifest, live timings, answered open questions).

### Task 1: Runtime config contract (pure TypeScript, no wiring yet)

**Files:**
- Create: `src/config/runtime/schema.ts` (public `RuntimeConfig` type, `RUNTIME_CONFIG_SCHEMA_VERSION = 1`, allowlist of fields)
- Create: `src/config/runtime/parse.ts` (`parseRuntimeConfig(json): {ok, config} | {ok:false, kind:"missing"|"invalid"|"incompatible", details}`)
- Create: `src/config/runtime/fingerprint.ts` (`authContextId(config)` = stable short hash of normalised `authority|clientId|apiOrigin|audience|tokenSource`)
- Test: `src/config/runtime/parse.test.ts`, `src/config/runtime/fingerprint.test.ts`

**Steps:**
1. Define fields mirroring today's `Config` in `src/utils/config.ts` with real types (booleans, string arrays) plus `schemaVersion` (int) and `configRevision` (string); exclude `clientSecret`.
2. Implement `parseRuntimeConfig`: reject unknown major `schemaVersion` as `incompatible`, missing required fields (`authority`, `clientId`, `apiOrigin`, `scopesSupported`) as `invalid`, normalise trailing slashes exactly like `loadConfig()` (authority `replace(/\/+$/,"")`, apiOrigin strip `:80|:443`), keep defaults (`redirectURI "/#callback"`, `silentRedirectURI "/#silent-callback"`, `tokenSource "accessToken"`, `wasmPath` default).
3. Ignore unknown fields (forward compatibility for rollback: older client + newer file) and accept missing optional fields (newer client + older file).
4. Write unit tests: valid file, each missing required field, string-boolean legacy values rejected, unknown schemaVersion 2 → incompatible, unknown extra field ignored, fingerprint stable/changes on issuer/client/API change.

**Verification:**
- Run: `npx vitest run src/config/runtime`
- Expect: all tests pass.
- Run: `rg -n "clientSecret" src/config/runtime/`
- Expect: no matches.

**Dependencies:**
- Task 0
**Output:**
- Typed, tested config contract shared by loader and generator test fixtures.

### Task 2: Container runtime-config generator (bash + jq), CSP and trusted-domain derivation

**Files:**
- Create: `docker/gen_runtime_config.sh`
- Create: `docker/tests/gen_runtime_config.test.sh`
- Create: `docker/tests/fixtures/` (env files: valid-embedded-idp.env, valid-auth0.env, missing-authority.env, weird-chars.env)
- Modify: `docker/Dockerfile`, `docker/Dockerfile.rootless`, `docker/Dockerfile.ubi` (add `jq` to `apk add`/`microdnf install`)

**Steps:**
1. Port the env validation and defaults from `docker/init_react_envs.sh:1-80` (AUTH0_* fallbacks, `AUTH_AUDIENCE=none`, default scopes, `NETBIRD_MGMT_API_ENDPOINT` port strip) into one normalisation block.
2. Emit `$OUT_DIR/runtime-config.json` with `jq -n --arg … '{…}'` (no string templating), typed booleans, `analyticsExcludedEmails` as array, `schemaVersion:1`, `configRevision` = sha256 of the canonical JSON body; write atomically (`tmp` + `mv`).
3. If `AUTH_CLIENT_SECRET` is non-empty, print a warning and do not emit it (behaviour per Open Question 5).
4. Derive CSP from the same normalised variables (port of `init_react_envs.sh:93-170`) into `$OUT_DIR/nginx/csp.conf` containing one `add_header Content-Security-Policy "…" always;` line; add `connect-src` for the authority origin and apiOrigin.
5. Move `robots.txt` override (`NETBIRD_ALLOW_SEARCH_INDEXING`) to `$OUT_DIR/robots.txt`.
6. Exit non-zero with a clear message on invalid input; never touch the html dir.
7. Write the test script: runs the generator for each fixture into a temp dir, validates JSON with `jq -e`, asserts no `clientSecret`, asserts identical output for identical input, asserts failure for invalid fixtures, asserts a value containing quotes/`$`/`&` round-trips exactly.

**Verification:**
- Run: `bash docker/tests/gen_runtime_config.test.sh`
- Expect: `ALL GENERATOR TESTS PASSED`, exit 0 (runs on the box: bash + jq present).
- Run: `rg -n "envsubst|sed -i" docker/gen_runtime_config.sh`
- Expect: no matches.

**Dependencies:**
- Task 1
**Output:**
- Deterministic generator producing runtime-config.json, csp.conf and optional robots.txt into a writable dir.

### Task 3: nginx cache, MIME, 404 and security-header policy

**Files:**
- Modify: `docker/default.conf`
- Modify: `docker/nginx.conf` (add `font/ttf` to `gzip_types` (woff2 is already compressed); ensure `mime.types` maps `woff2`→`font/woff2`, `ttf`→`font/ttf`; `gzip_static on` only if Task 0 confirmed the module)
- Create: `docker/snippets/security-headers.conf` (X-Frame-Options, nosniff, HSTS, Referrer-Policy, `include /run/netbird-dashboard/nginx/csp.conf`)
- Create: `docker/snippets/no-store.conf`, `docker/snippets/immutable.conf`
- Create: `docker/tests/nginx_headers.test.sh` (curl assertions against a running container)
- Modify: `docker/rootless.conf` (keep temp paths; no header changes)

**Steps:**
1. Replace inline headers by `include snippets/security-headers.conf;` in every `location` that has its own `add_header` (nginx does not inherit `add_header` into a block that defines any).
2. `location = /runtime-config.json { alias /run/netbird-dashboard/runtime-config.json; include no-store; include security-headers; default_type application/json; }`; same pattern for `= /robots.txt` with `try_files` fallback to the build copy.
3. `location ^~ /_next/static/` and `location ~ ^/assets/chunk\.[0-9a-f]{8}\.js$`: `try_files $uri =404;` with no `error_page` HTML fallback (`error_page 404 = @plain404` returning `text/plain`), `include immutable` (`public, max-age=31536000, immutable`), security headers.
4. `location ~* \.(woff2|ttf|png|svg|ico|wasm)$` under `/_next/static/media/` covered by step 3; non-hashed public files (`/assets/*.svg`, `/theme/*.css`, `wasm_exec.js`, `/netbird.wasm`, `/ironrdp-pkg/*`) audited one by one in Task 0 inventory and default to `no-cache` (revalidate with ETag) — never `immutable` unless hashed.
5. HTML and route data (`/`, `*.html`, `*.txt` RSC payloads in `out/`, `404.html`) stay `no-store`; add explicit `location = /nb-auth` / `= /nb-silent-auth` (and any `AUTH_REDIRECT_URI` path from the generator via an included `redirects.conf`) serving `/index.html` with status 200, so OIDC callbacks no longer depend on the 404 page.
6. Fix trailing-slash deep links (`/peers/` → 301 `/peers` or `try_files $uri $uri.html $uri/index.html` with `index index.html`).
7. Write `nginx_headers.test.sh`: asserts Cache-Control per class, `Content-Type: font/woff2`, gzip on JS/CSS/TTF, 404 + `text/plain` for a missing chunk, 200 for `/nb-auth`, CSP present on every class, `X-Content-Type-Options` on immutable responses.

**Verification:**
- Run: `docker build -f docker/Dockerfile -t nbdash:test . && docker run --rm --env-file docker/tests/fixtures/valid-embedded-idp.env nbdash:test nginx -t` (on Docker host/CI; needs Task 4 entrypoint to have generated csp.conf — run after Task 4 if include path is missing)
- Expect: `syntax is ok` / `test is successful`.
- Run: `bash docker/tests/nginx_headers.test.sh http://127.0.0.1:8080`
- Expect: `ALL HEADER TESTS PASSED`.

**Dependencies:**
- Task 2
**Output:**
- nginx policy implementing no-store/immutable split, real 404 for assets, preserved security headers, correct font MIME, explicit OIDC callback routes.

### Task 4: Container start ordering and read-only build directory

**Files:**
- Create: `docker/entrypoint.sh` (generate → `nginx -t` → `exec "$@"`)
- Modify: `docker/Dockerfile` (ENTRYPOINT `entrypoint.sh`, CMD supervisord; `chmod -R a-w /usr/share/nginx/html`; create `/run/netbird-dashboard`)
- Modify: `docker/Dockerfile.rootless`, `docker/Dockerfile.ubi`
- Modify: `docker/supervisord.conf` (drop `[program:init_react_envs]`; nginx keeps priority 100)
- Delete: `docker/init_react_envs.sh` (logic now in `gen_runtime_config.sh`), `public/OidcTrustedDomains.js.tmpl`, `public/local/OidcTrustedDomains.js`, `package.json` scripts `copy`/`copytrusted` (per Open Question 3)
- Create: `docker/tests/smoke.sh`

**Steps:**
1. Entrypoint runs `gen_runtime_config.sh /run/netbird-dashboard`, then `nginx -t`; on any failure exits non-zero so Docker restart policy surfaces it (no nginx serving a half-configured app).
2. Keep `init_cert.sh` under supervisord unchanged (certbot path), it only needs the CSP include to exist.
3. Make the build dir read-only at image build time; rootless image keeps `/run/netbird-dashboard` group-writable for arbitrary UID.
4. Smoke script: start the same image twice with two different env fixtures, `docker exec … sha256sum` over `/usr/share/nginx/html/_next/static` and `/assets` → identical; `/runtime-config.json` differs; start with `missing-authority.env` → container exits ≠0 with message.

**Verification:**
- Run: `docker build -f docker/Dockerfile -t nbdash:test . && bash docker/tests/smoke.sh nbdash:test`
- Expect: `SMOKE OK: immutable assets identical across configs; bad config exits 1`.
- Run: `rg -n "init_react_envs|envsubst|OidcTrustedDomains" docker/ public/ package.json`
- Expect: no matches.

**Dependencies:**
- Task 3
**Output:**
- Image whose assets are never modified at runtime; config generated before nginx starts.

### Task 5: Client config loader, bootstrap gate and error UI

**Files:**
- Create: `src/config/runtime/loader.ts` (`loadRuntimeConfig({timeoutMs})`: single in-flight promise, `fetch("/runtime-config.json",{cache:"no-store"})`, AbortController timeout 10 s, `parseRuntimeConfig`)
- Create: `src/config/runtime/RuntimeConfigProvider.tsx` (context + `useRuntimeConfig()`; renders `FullScreenLoading` only while pending, `ConfigErrorScreen` on error)
- Create: `src/config/runtime/ConfigErrorScreen.tsx` (kinds: missing / invalid / incompatible / timeout / network; retry button; i18n keys in en + zh-CN)
- Create: `src/config/runtime/store.ts` (`setRuntimeConfig` once, `getRuntimeConfig()` throws if unset — for non-React utilities during migration)
- Create: `scripts/runtime-config/write-dev-config.mjs` (reads `.local-config.json` / `.test-config.json`, writes `public/runtime-config.json`; add `public/runtime-config.json` to `.gitignore`)
- Modify: `src/layouts/AppLayout.tsx` (wrap everything below `<Suspense>` except `I18nProvider` in `RuntimeConfigProvider`; coordinate with i18n agent — do not change `I18nProvider`)
- Modify: `package.json` (`predev`, `pretest:dev` run the dev-config writer)
- Modify: `src/i18n/locales/en/*.json`, `src/i18n/locales/zh-CN/*.json` (new error-screen keys, per `src/i18n/I18N.md`)
- Test: `src/config/runtime/loader.test.ts`, `src/config/runtime/RuntimeConfigProvider.test.tsx`, `src/config/runtime/ConfigErrorScreen.stories.tsx`

**Steps:**
1. Implement loader with dedupe (module-level promise) so a `<link rel="preload" as="fetch" crossorigin href="/runtime-config.json">` in the static shell is reused instead of double-fetched; add the preload tag only if the browser reuses it (check DevTools: one request).
2. Provider resolves config → `setRuntimeConfig` → renders children; static export HTML still renders the deterministic `FullScreenLoading` shell (no config at build time).
3. Error screen distinguishes 404 (missing), parse/validation (invalid), schemaVersion (incompatible), timeout, network; never spins forever.
4. Dev/test: writer converts legacy `.local-config.json`/`.test-config.json` (string booleans) into the typed schema so `npm run dev`, `test:dev`, e2e keep working.
5. Unit tests with mocked `fetch`: success, 404, invalid JSON, schema 2, timeout (fake timers), two concurrent callers → one fetch.

**Verification:**
- Run: `npx vitest run src/config/runtime && npx tsc --noEmit`
- Expect: pass, 0 type errors.
- Run: `npm run i18n:check`
- Expect: exit 0.

**Dependencies:**
- Task 1
**Output:**
- Config is loaded once before any auth/API client exists; explicit error UI.

### Task 6: Migrate all `loadConfig()` call sites; remove build-time config

**Files:**
- Modify (auth/API core, part A): `src/auth/OIDCProvider.tsx`, `src/utils/api.tsx`, `src/utils/unauthenticatedApi.ts`, `src/utils/netbird.ts` (`GRPC_API_ORIGIN` constant → function/param), `src/utils/config.ts` (`buildExtras(config)`), `src/contexts/UsersProvider.tsx`, `src/hooks/useRedirect.tsx`, `src/hooks/useIsLicensed.tsx`, `src/auth/OIDCError.tsx`, `src/auth/SessionLost.tsx`, `src/app/error/page.tsx`, `src/contexts/AnalyticsProvider.tsx` (`GoogleTagManagerHeadScript` becomes client-injected after config), `src/contexts/AnnouncementProvider.tsx`, `src/modules/control-center/utils/changeset-request.ts`
- Modify (feature modules, part B): `src/cloud/analytics/Hubspot.tsx`, `src/cloud/cloud-hooks/useAuthService.ts`, `src/cloud/cloud-hooks/useDomainCategory.tsx`, `src/cloud/contexts/NetBirdCloudProvider.tsx`, `src/cloud/mfa/AccountMFACard.tsx`, `src/cloud/mfa/AccountMFASettings.tsx`, `src/cloud/mfa/UserMFAListItem.tsx`, `src/cloud/msp/MSPTrialExpiredModal.tsx`, `src/cloud/sign-in-domains/useSignInDomains.ts`, `src/cloud/survey/HowDidYouHearAboutUs.tsx`, `src/modules/integrations/sso/useEnterpriseConnections.tsx`, `src/modules/integrations/sso/useSSOConnections.tsx`, `src/modules/remote-access/useNetBirdClient.ts`, `src/modules/settings/DangerZoneTab.tsx`, `src/modules/settings/IdentityProviderModal.tsx`
- Modify (tests/tooling): the 10 tests mocking `@utils/config` (`src/contexts/UsersProvider.test.ts`, `src/components/PeerGroupSelector.test.ts`, `src/modules/groups/PeerOwnerSearch.test.tsx`, `src/modules/control-center/utils/changeset-request.test.ts`, `src/modules/control-center/panels/DestinationGroupPanel.test.tsx`, `src/modules/activity/ActivityDescription.test.tsx`, `src/modules/control-center/hooks/useNodeRemoval.test.tsx`, `src/modules/control-center/draft/PeersToolbar.test.tsx`, `src/modules/control-center/hooks/useDraftGroupActions.test.tsx`, `src/modules/control-center/draft/modals/ReviewDeployModal.test.tsx`), `.storybook/main.ts` (`netbird-mock-config` plugin → provide a `RuntimeConfigProvider` decorator in `.storybook/preview.tsx`)
- Delete: `config.json`; `tsconfig.json` paths `@/config/production|local|test`; default-export `loadConfig` from `src/utils/config.ts`

**Steps:**
1. Part A: components read `useRuntimeConfig()`; hooks pass config into utilities as parameters (`apiRequest(origin, …)`, `unauthenticatedRequest(config.apiOrigin, …)`); `OIDCProvider` builds `auth0AuthorityConfig` and `OidcConfiguration` from context inside the component (memoised), no `useEffect`/`mounted` round-trip.
2. Part A: replace `GoogleTagManagerHeadScript` in `<head>` with a client component injected by `AnalyticsProvider` after config (keeps `afterInteractive` semantics; CSP sha256 in Task 2 updated if the inline body changes).
3. Part B: mechanical migration of each listed module to `useRuntimeConfig()`; module-level constants become lazy getters.
4. Update tests to wrap in a `RuntimeConfigProvider` test helper (`src/config/runtime/testing.tsx`) instead of mocking `@utils/config`; update Storybook decorator.
5. Remove `config.json` and tsconfig aliases; rebuild and confirm no placeholders remain in `out/`.

**Verification:**
- Run: `rg -n "loadConfig\(" src .storybook`
- Expect: no matches.
- Run: `rg -n "^const \w+ = (loadConfig|getRuntimeConfig)\(\)" src`
- Expect: no matches (no module-top-level config reads).
- Run: `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build && ! rg -l '\$(AUTH_|NETBIRD_|USE_AUTH0)' out/`
- Expect: all green; final `rg` finds nothing.
- Run: `npm run test:visual`
- Expect: no unintended diffs.

**Dependencies:**
- Task 5
**Output:**
- Built JS contains no deployment config; same build works for any config.

### Task 7: Auth-state namespacing and stale-state cleanup on config change

**Files:**
- Create: `src/config/runtime/authContextCleanup.ts`
- Modify: `src/auth/OIDCProvider.tsx` (`configurationName` = `authContextId(config)` so axa keys in sessionStorage are namespaced)
- Modify: `src/contexts/ApplicationProvider.tsx` (`netbird-api-params` key namespaced), `src/hooks/useIsLicensed.tsx` (already keyed by apiOrigin; switch to `authContextId`), `src/auth/SecureProvider.tsx` (`netbird-query-params` namespaced)
- Test: `src/config/runtime/authContextCleanup.test.ts`

**Steps:**
1. On boot, compare stored `netbird-auth-context` (localStorage) to `authContextId(config)`; on mismatch remove only known keys belonging to the old context (axa `oidc.*`/`default` entries in sessionStorage, `netbird-api-params*`, license cache, query-params), then store the new id.
2. Pass `configurationName` to `OidcProvider`/`useOidc*` hooks consistently (check axa 7.x API for hooks taking `configurationName`; wrap in a small `useAuth()` helper if needed).
3. Unit test: change of issuer/client/API clears old keys and keeps unrelated keys (theme, language, nav-collapsed).

**Verification:**
- Run: `npx vitest run src/config/runtime/authContextCleanup.test.ts`
- Expect: pass.
- Run: `rg -n "\"netbird-api-params\"|\"netbird-query-params\"" src`
- Expect: only inside namespaced key builders.

**Dependencies:**
- Task 6
**Output:**
- Changing issuer/client/API never reuses stale tokens or tenant params.

### Task 8: Startup chain — drop `/api/users` gate, `/users/current` as the single user gate, SWR scoping, logout cancellation

**Files:**
- Modify: `src/contexts/ApplicationProvider.tsx` (remove `populateCache`, `userRequest`, `show` gate)
- Modify: `src/contexts/UsersProvider.tsx` (extract pure `resolveLoggedInUser`; list queries `/users?service_user=…` start only after `/users/current` settles; fallback to `users.find(u=>u.is_current)` only when `/users/current` returns the confirmed old-Management signal from Task 0 (e.g. 404/405), never for 401/403/blocked/pending)
- Modify: `src/utils/api.tsx` (SWR `use` middleware or key prefix with `authContextId` + user `sub`; per-auth-context `AbortController` aborted on logout)
- Modify: `src/components/ui/UserDropdown.tsx`, `src/modules/settings/DangerZoneTab.tsx` (logout path calls shared `logoutAndReset()`: abort in-flight, `mutate(() => true, undefined, {revalidate:false})`, clear namespaced storage)
- Test: `src/contexts/UsersProvider.test.ts` (extend), `src/contexts/ApplicationProvider.test.tsx` (new)
- Test (e2e): `e2e/tests/login.spec.ts` (assert `/api/users` without query is not requested before workspace render; blocked/pending flows unchanged)

**Steps:**
1. Keep transient-error retry (network / 5xx, max 3, 500 ms backoff) on `/users/current` to preserve #366 provisioning semantics as answered in Task 0.
2. Table-driven unit tests for `resolveLoggedInUser` + `resolveRefusedUser`: success; 401 → no fallback (login); 403 blocked → error page; 403 pending → PendingApproval; old-Management signal → list fallback; list also failing → error UI, not spinner.
3. Ensure logout and account switch leave no SWR data (test: render, logout, re-login as another user → no previous user's data in first render).

**Verification:**
- Run: `npx vitest run src/contexts`
- Expect: pass.
- Run: `rg -n "useApiCall<User\[\]>\(\`/users\`" src/contexts/ApplicationProvider.tsx`
- Expect: no matches.
- Run: `npm run test:setup && npx playwright test --config=e2e/playwright.config.ts e2e/tests/login.spec.ts`
- Expect: pass (or explicitly report not run if Docker env unavailable).

**Dependencies:**
- Task 7
**Output:**
- Authorised workspace renders after `/users/current` only; no global `/users` gate; clean logout.

### Task 9: Parallelise the instance-setup check with OIDC init (keep the dependency)

**Files:**
- Modify: `src/contexts/InstanceSetupProvider.tsx` (start `fetchInstanceStatus(config.apiOrigin)` as soon as config resolves; render gate still waits for the result before protected routes)
- Modify: `src/layouts/AppLayout.tsx` (OIDCProvider subtree may initialise while the instance check is in flight; protected children mount only when both resolved)
- Test: `src/contexts/InstanceSetupProvider.test.tsx`

**Steps:**
1. Kick off the request in the config bootstrap (shared promise) instead of after mount.
2. Keep current semantics: `setup_required` → redirect `/setup`; endpoint error on old Management → continue; cloud/bypass routes skip.
3. Test: setup_required true redirects; error continues; request issued exactly once.

**Verification:**
- Run: `npx vitest run src/contexts/InstanceSetupProvider.test.tsx`
- Expect: pass.

**Dependencies:**
- Task 8
**Output:**
- `/api/instance` no longer adds a serial RTT before the user gate.

### Task 10: Inter WOFF2, build-time precompression and immutability guard

**Files:**
- Create: `src/assets/fonts/Inter.woff2` (variable, from the same Inter version as `Inter.ttf`; license `OFL.txt` kept)
- Delete: `src/assets/fonts/Inter.ttf`
- Modify: `src/layouts/AppLayout.tsx` (`localFont({ src: "../assets/fonts/Inter.woff2", display: "swap" })`)
- Create: `scripts/build/precompress.mjs` (`.gz` siblings for js/css/svg/json/woff2-skip; only if Task 0 confirmed `gzip_static`)
- Create: `scripts/build/verify-immutable.mjs` (fails if any `out/` file contains config placeholders, if any file under `_next/static` or `/assets/chunk.*` lacks a content hash in its name, or if `/assets/chunk.<h>.js` hash ≠ md5 prefix of its content; writes `out/.asset-manifest.json` with sha256 per file — served no-store, not referenced by the app)
- Modify: `package.json` (`postbuild`: `node postbuild.js && node scripts/build/precompress.mjs && node scripts/build/verify-immutable.mjs`)

**Steps:**
1. Convert with `pip install fonttools brotli && fonttools ttLib.woff2 compress -o src/assets/fonts/Inter.woff2 src/assets/fonts/Inter.ttf`; do not subset (zh UI falls back to system CJK; keep Latin-Ext glyphs).
2. Add precompression and guard to postbuild.
3. Visual regression check for font rendering.

**Verification:**
- Run: `npm run build && ls -l out/_next/static/media/*.woff2 && node scripts/build/verify-immutable.mjs`
- Expect: woff2 ≈ 300–350 KB; guard prints `IMMUTABLE OK`.
- Run: `rg -n "Inter\.ttf" src`
- Expect: no matches.
- Run: `npm run test:visual`
- Expect: no unintended diffs.

**Dependencies:**
- Task 6
**Output:**
- Smaller font, precompressed assets, build fails if any asset would be mutable.

### Task 11: Release pipeline with asset support window and rollback (server)

**Files:**
- Modify: `.github/workflows/deploy.yml` (package `out/` + `docker/` + `.asset-manifest.json`; optionally run `docker/tests/smoke.sh` in the job)
- Create: `deploy/server/nb-dashboard-deploy` (versioned copy of the server forced command, replacing `/workspace/nbci/nb-dashboard-deploy` after ethan approves the server change)
- Create: `deploy/server/README.md` (topology, support window, rollback, migration runbook)
- Create: `deploy/server/docker-compose.dashboard.yml` (dashboard service fragment: image built from this repo's `docker/Dockerfile`, read-only bind of `static-pool/`, env_file unchanged)

**Steps:**
1. Switch production from `FROM netbirdio/dashboard:latest` + replaced `out/` to this repo's image (so Tasks 2–4 actually reach prod); server script builds `netbird-dashboard-zh:<ts>` from the uploaded package, no Node needed.
2. Publish order: (a) `rsync` new hashed files into `static-pool/` without `--delete`; (b) build new image; (c) `docker compose up -d dashboard` (entrypoint fails fast on bad config → old container keeps running if `up` is gated by a pre-run `docker run --rm <img> /usr/local/bin/gen_runtime_config.sh --check`); (d) record `CURRENT`.
3. nginx `/_next/static/` and `/assets/chunk.*` use `try_files $uri /static-pool$uri =404` (read-only bind) so pages from the previous release keep loading lazy chunks during the support window.
4. Prune `static-pool/` files not referenced by the last 5 release manifests AND older than 14 days (Open Question 7).
5. Rollback = re-tag previous image + `up -d`; runtime-config schema v1 is readable by both (Task 1 forward/backward rules); rolling back to a pre-migration image is allowed because those builds served everything `no-store` and their chunk names differ.
6. Migration note: browsers never stored the old mutable chunks (they were `no-store`), so the first migration needs no purge; the only cached immutable copies will be config-free new chunks. Verify Traefik has no cache middleware.

**Verification:**
- Run: `bash -n deploy/server/nb-dashboard-deploy && shellcheck deploy/server/nb-dashboard-deploy`
- Expect: no errors.
- Run (staging/server, after approval): `ssh <deploy-user>@<host> status` before and after two consecutive deploys; then `curl -sI http://203.0.113.10:8088/_next/static/chunks/<chunk-from-previous-release>.js`
- Expect: `200` with `immutable` during the window; `404 text/plain` for an unknown chunk.

**Dependencies:**
- Task 4, Task 10
**Output:**
- Reviewed deploy script + workflow; zero-downtime asset-first releases with rollback (server change applied only with ethan's approval).

### Task 12: Acceptance measurement through the real prod chain

**Files:**
- Create: `docs/plans/evidence/2026-10-16-runtime-config-acceptance.md`
- Modify (outside repo, scratch): `/workspace/perf/live/authsim.py` (add milestones: shell-visible, authorised-workspace-ready, page-data-ready; record bytes per reload)

**Steps:**
1. Two-config check: `docker/tests/smoke.sh` output (identical sha256 of immutable assets).
2. Config change without cache clearing: change `NETBIRD_ANNOUNCEMENT` in `dashboard.env`, restart, warm reload shows new value.
3. Bad config: unset `AUTH_AUTHORITY` → container fails start (old one keeps serving); corrupt served JSON in a staging copy → error screen, not spinner.
4. Warm reload: `authsim.py live 220 en-US` and `zh-CN` ×3 → transferred bytes for `/_next/static/**` ≈ 0; compare milestones with Task 0 baseline.
5. Request order: `/api/users` (no query) absent; `/api/instance` overlaps OIDC init; workspace ready after `/users/current`.
6. Behaviour: blocked user, pending-approval user, old-Management fallback (if a test Management is available), logout → login as another user with no stale data.
7. Window/404/compression/deep links: previous-release chunk 200, unknown chunk 404 `text/plain`, `Content-Encoding: gzip` on JS/CSS, `font/woff2`, `/peers` and `/peers/` refresh OK, `/nb-auth` 200.
8. Note i18n zh-CN preload (~24 chunks) remains and is tracked by the i18n agent.

**Verification:**
- Run: `python3 /workspace/perf/live/authsim.py live 220 en-US`
- Expect: authorised-workspace-ready ≤ ~1.0 s at RTT 220 ms (vs 5.5–8.0 s baseline), static bytes on warm reload ≈ 0.
- Run: `rg -n "^- \[x\]" docs/plans/evidence/2026-10-16-runtime-config-acceptance.md | wc -l`
- Expect: equals the number of acceptance anchors (10).

**Dependencies:**
- Task 9, Task 11
**Output:**
- Acceptance evidence with before/after timings and checklist.

## Execution Handoff

Plan-only output was explicitly requested by ethan, so execution stops at `artifact-ready` (`PLAN_READY`); no code, commit, push or server change is made in this session. When execution is approved it continues in a session chosen by the user (current-session execution by default for plan-route work), task by task in the order above; Tasks 1, 2 and 5 may run in parallel after Task 0, Task 10 after Task 6. Server-affecting steps in Task 11/12 require ethan's explicit approval at that time. The i18n agent must be told about the `AppLayout.tsx` edits (Tasks 5, 6, 10) to avoid conflicts.

## Status Sync Suggestion

No work item is bound (`WORK_ITEM: none`). If one is created: `ARTIFACT=docs/plans/2026-10-16-dashboard-runtime-config-and-startup-perf.md`, `STATUS=artifact-ready` (plan-only request). Nothing is implemented, reviewed or accepted yet.
