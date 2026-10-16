# Dashboard release on the server (203.0.113.10)

Prepared, **not applied**. Every server step below needs ethan's approval;
nothing here has been run on the server. Read-only findings from 2026-10-16
are in `docs/plans/evidence/2026-10-16-runtime-config-baseline.md`.

## Today (before migration)

- compose project `netbird`, `/opt/netbird/docker-compose.yml`, one
  `netbird-dashboard` container from `netbird-dashboard-zh:latest`
  (`FROM netbirdio/dashboard:latest`, official `init_react_envs.sh`).
- `/opt/netbird/dashboard-zh/html` is bind-mounted **read-write** over
  `/usr/share/nginx/html`; CI streams `out/` to the forced command
  `/usr/local/sbin/nb-dashboard-deploy`, which `rsync --delete`s it into
  `html/` and restarts the container. Old chunks vanish on every deploy and
  every file is `no-store`.
- Traefik v3.7 in front, no cache middleware (labels only).

## Target

| Piece | After migration |
|---|---|
| Image | `netbird-dashboard-zh:<release>` built on the server from the uploaded package with this repo's `docker/Dockerfile`; `:current` is the running one |
| Build files | inside the image, read-only; no html bind mount |
| Deployment config | generated at container start from `dashboard.env` into `/run/netbird-dashboard` (`/runtime-config.json`, CSP, callback routes); bad env = container does not start |
| Old assets | `/opt/netbird/dashboard-zh/static-pool` (read-only mount at `/usr/share/nginx/static-pool`); nginx falls back to it for `/_next/static/**` and `/assets/chunk.*.js` |
| Support window | an asset is removed only when **none of the last 5 releases** references it **and** it entered the pool **more than 14 days** ago (Q7) |
| Rollback | re-tag a previous image as `:current` + `compose up -d`; schema v1 runtime config is read by every image of this line |

`deploy` order (see the header of `nb-dashboard-deploy`): assets into the
pool (never deleting) → `docker build` → gate (`docker run --rm --network none
--env-file dashboard.env <img> true`: the entrypoint generates the config and
runs `nginx -t`) → tag `:current`, `compose up -d --no-deps --force-recreate
dashboard`, health check (`/runtime-config.json` and `/` inside the
container), automatic switch back on failure → `CURRENT`/`HISTORY` → prune.

Single replica: the recreate is a stop/start, so there is the same ~1–2 s gap
as today's `docker restart`. Pages already open keep working because their
chunks stay available from the pool.

Commands (forced command of the `<deploy-user>` key, unchanged wiring):

```
ssh <deploy-user>@<host> deploy < dashboard-release.tgz
ssh <deploy-user>@<host> status
ssh <deploy-user>@<host> rollback               # previous release in HISTORY
ssh <deploy-user>@<host> "rollback 20261020-101500"
ssh <deploy-user>@<host> prune
```

Local test without a server (fake docker): `deploy/server/test-deploy-script.sh`.

## Package (CI)

`.github/workflows/deploy.yml` currently has another agent's
uncommitted change (trigger branch `feature/theme-antd` → `dev`), so it was
not edited here. The change it needs, together with the server migration and
**not before** (the old forced command would put a build that needs
`/runtime-config.json` into the official image, which does not serve it, and
the dashboard would show the configuration error screen):

```diff
       - name: Build static export
         run: |
           npm ci
           npm run i18n:check
-          npm run build
-          test -f out/index.html
-          tar -czf dashboard.tgz -C out .
+          npm run build            # postbuild: precompress + verify-immutable
+          test -f out/index.html -a -f out/.asset-manifest.json
+          bash docker/tests/gen_runtime_config.test.sh
+          tar -czf dashboard.tgz out docker
           ls -lh dashboard.tgz
```

## Migration runbook (needs approval, run as ubuntu with sudo)

0. Backup: `sudo cp -a /opt/netbird/docker-compose.yml /opt/netbird/docker-compose.yml.bak-$(date +%F)`;
   `sudo cp -a /usr/local/sbin/nb-dashboard-deploy /usr/local/sbin/nb-dashboard-deploy.v1`.
   The running image stays as `netbird-dashboard-zh:latest` (pre-migration rollback target).
1. Install the script: copy `deploy/server/nb-dashboard-deploy` to the server,
   `sudo install -m 755 -o root -g root nb-dashboard-deploy /usr/local/sbin/nb-dashboard-deploy`.
   `jq`, `rsync`, `flock`, `curl`, Docker Compose v2.32 are present (checked read-only).
2. Seed the pool with the release that is live now, so tabs open during the
   switch keep loading chunks:
   `sudo install -d /opt/netbird/dashboard-zh/static-pool && sudo rsync -rlp --ignore-existing /opt/netbird/dashboard-zh/html/_next /opt/netbird/dashboard-zh/static-pool/ && sudo find /opt/netbird/dashboard-zh/html/assets -maxdepth 1 -name 'chunk.*.js' -exec cp -n {} /opt/netbird/dashboard-zh/static-pool/assets/ \;`
   (create `static-pool/assets` first).
3. Edit `/opt/netbird/docker-compose.yml`: replace the `dashboard` service with
   `deploy/server/docker-compose.dashboard.yml` (image `netbird-dashboard-zh:current`,
   **remove** `./dashboard-zh/html:/usr/share/nginx/html`, add the read-only
   `static-pool` mount). `dashboard.env` stays as it is; its empty
   `AUTH_CLIENT_SECRET=` is ignored with a warning in the log (Q5) and can be
   deleted later.
4. First release: run the workflow (or stream a locally built package) with
   `deploy`. The first `docker build` pulls `alpine:3.24` and its packages
   (dl-cdn answered in 7.5 s from the server, mirror.example.com in 0.2 s);
   later builds reuse the cached layer. Until step 3 is done `compose up`
   would still start the old image, so do 3 before 4.
5. Verify (from anywhere):
   `curl -sI http://203.0.113.10:8088/runtime-config.json` → `200`, `no-store`;
   a `/_next/static/chunks/*.js` from the page → `immutable`, `Content-Encoding: gzip`
   with `Accept-Encoding: gzip`; `/_next/static/chunks/nope.js` → `404 text/plain`;
   `/peers` and `/peers/` (301 → `/peers`) and `/nb-auth` → 200.
6. After the next deploy: a chunk of the previous release still returns 200.

Rollback of the migration: restore the compose backup and the v1 script,
`docker compose -p netbird -f /opt/netbird/docker-compose.yml up -d dashboard`
(back to `netbird-dashboard-zh:latest` + html/). Browsers hold no immutable copy
of anything config-specific, so no cache purge is needed either way: before
the migration everything was `no-store`, after it immutable files are
config-free.

## Not covered / to watch

- certbot (`LETSENCRYPT_DOMAIN`) is `none` here; the new `default.conf` with
  certbot `--nginx` is untested (needs Docker).
- `KEEP`/`MIN_AGE_DAYS` are constants at the top of the script.
- Release dirs keep the full package (~25 MB each); with the 14-day rule a
  busy fortnight keeps more than 5.
