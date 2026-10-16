# Runtime config: acceptance (Task 12)

Status 2026-10-16: box-side checks done, everything that needs Docker or the
new production deployment is **pending** (T11 not applied; no server change).

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

- [ ] 1. Two-config check in the real image (`docker/tests/smoke.sh`) — pending Docker
- [ ] 2. Config change without cache clear (`NETBIRD_ANNOUNCEMENT`, restart, warm reload) — pending deploy
- [ ] 3. Bad config: container refuses to start / corrupt JSON → error screen — pending Docker
- [ ] 4. Warm reload bytes for `/_next/static/**` ≈ 0, authsim en-US + zh-CN ×3 — pending deploy
- [ ] 5. Request order: no bare `/api/users`, `/api/instance` overlaps OIDC init — pending deploy (unit-tested)
- [ ] 6. Blocked / pending / old-Management / logout-relogin — pending deploy (unit-tested)
- [ ] 7. Previous-release chunk 200 + immutable during the window — pending deploy (fake-docker tested)
- [ ] 8. Unknown chunk 404 `text/plain`, gzip, `font/woff2` — pending prod (passes on local nginx)
- [ ] 9. `/peers`, `/peers/` → 301, `/nb-auth` 200 — pending prod (passes on local nginx)
- [ ] 10. authorised-workspace-ready ≤ ~1.0 s at RTT 220 ms (baseline 5.5–8.0 s) — pending deploy

Note: the zh-CN i18n preload (~24 chunks) is unchanged and owned by the i18n agent.
