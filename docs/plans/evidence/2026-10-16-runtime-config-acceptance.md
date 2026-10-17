# Runtime config: acceptance (Task 12)

Status 2026-10-16: migrated and live (approved by ethan). Manual first
release (package from a clean checkout of 82eff251), then the GitHub Actions
deploy workflow (push of `dev` @ 82eff251) deployed the next release -
success. Compose file and v1 forced command were backed up on the server first.

## Live results

Timings: `/workspace/perf/live/authsim_cdp.py live 220 <locale>` (same mocked
API as authsim.py at RTT 220 ms, but intercepted through CDP so Chrome's HTTP
cache stays on; authsim.py's Playwright routing disables the cache, so it can
only measure cold loads). Box -> server, run0 = cold, run1-3 = warm reload.

| | before (perf report, every reload) | after cold | after warm reload |
|---|---|---|---|
| en-US workspace usable | 5.5-6.9 s | 5.6-6.4 s | 0.96-1.01 s |
| zh-CN workspace usable | 7.0-8.0 s | 7.2-7.5 s | 0.98 s |
| shell (loader) visible | - | 0.46 s | 0.24 s |
| page data ready (last API) | - | 6.1-7.4 s | 1.19-1.24 s |
| `/_next/static` transferred | 0.56-0.8 MB JS + 0.8 MB font | 1.13-1.22 MiB | 0 KiB (all from cache) |

Warm-reload API order: `/api/instance`, `/api/users/current`, `/oauth2/userinfo`,
`/api/accounts`, `/api/peers`, ... - no bare `/api/users`.

## Box-side results (dev @ 9f6b6845 + this file)

- `npx tsc --noEmit`: 0 errors. `npx vitest run`: 85 files, 976 tests pass.
- `npx eslint .`: 164 errors vs 165 on baseline `89619845`, none new.
- `npm run i18n:check`: 0 errors.
- `npm run build`: ok; postbuild `precompress: 742 .gz` and `IMMUTABLE OK (1942 files)`.
- `rg -l '\$(AUTH_|NETBIRD_|USE_AUTH0)' out/`: no matches (baseline: 2 files).
- Two configs (embedded IdP / Auth0 fixtures) generated against one build:
  `out/` sha256 identical (1942 files), configRevision differs.
- `docker/tests/gen_runtime_config.test.sh`: 44 checks pass.
- `docker/tests/run_local_nginx.sh` (Debian nginx 1.26.3, no Docker): 67 checks pass.
- `deploy/server/test-deploy-script.sh` (fake docker): 20 checks pass.
- shellcheck clean on all new shell scripts.

## Acceptance anchors

- [ ] 1. Two-config check in the real image (`docker/tests/smoke.sh`) — pending Docker (box: identical sha256 over 1942 files)
- [ ] 2. Config change without cache clear (`NETBIRD_ANNOUNCEMENT`, restart, warm reload) — pending deploy
- [ ] 3. Bad config: container refuses to start / corrupt JSON → error screen — pending Docker
- [x] 4. Warm reload bytes for `/_next/static/**` = 0, en-US + zh-CN ×3
- [x] 5. Request order: no bare `/api/users`; `/api/instance` and OIDC discovery start together (7.51 / 7.53 s in the login trace)
- [ ] 6. Blocked / pending / old-Management / logout-relogin — pending deploy (unit-tested)
- [x] 7. Previous-release chunk (`2bcwncibxdt0a.js`, pre-migration) 200 + immutable from the static pool
- [x] 8. Unknown chunk 404 `text/plain`, gzip, `font/woff2` (nginx_headers.test.sh against prod: 67/67)
- [x] 9. `/peers` 200, `/peers/` → 301 `/peers`, `/nb-auth` and `/nb-silent-auth` 200
- [x] 10. authorised-workspace-ready ≈ 1.0 s on warm reload at RTT 220 ms (baseline 5.5–8.0 s)

Note: the zh-CN i18n preload (~24 chunks) is unchanged and owned by the i18n agent.

Login: unauthenticated `/peers` -> runtime config -> OIDC discovery ->
`/oauth2/auth` -> embedded IdP login page (Chrome with the origin treated as
secure). Plain `http://<ip>` is not a secure context, so `crypto.subtle` (PKCE)
is missing and axa shows "Error: Unauthenticated"; this does not depend on this
change (same library, same origin). No real credentials were used.
