# Dashboard release on the server

Release flow for a self-hosted server that runs the dashboard next to
NetBird Management via Docker Compose. Placeholders: `<host>` is the server,
`<deploy-user>` the SSH account whose key has the forced command, `<base>` the
dashboard directory on the server (the script's `NB_DASHBOARD_BASE`), and
`<compose-dir>` the directory with the NetBird `docker-compose.yml` and
`dashboard.env`.

## Before migration

- one `netbird-dashboard` container built `FROM netbirdio/dashboard:latest`
  (official `init_react_envs.sh`).
- `<base>/html` is bind-mounted **read-write** over `/usr/share/nginx/html`;
  CI streams `out/` to the forced command `/usr/local/sbin/nb-dashboard-deploy`,
  which `rsync --delete`s it into `html/` and restarts the container. Old
  chunks vanish on every deploy and every file is `no-store`.
- A reverse proxy (Traefik) in front, no cache middleware.

## Target

| Piece | After migration |
|---|---|
| Image | `netbird-dashboard-zh:<release>` built on the server from the uploaded package with this repo's `docker/Dockerfile`; `:current` is the running one |
| Build files | inside the image, read-only; no html bind mount |
| Deployment config | generated at container start from `dashboard.env` into `/run/netbird-dashboard` (`/runtime-config.json`, CSP, callback routes); bad env = container does not start |
| Old assets | `<base>/static-pool` (read-only mount at `/usr/share/nginx/static-pool`); nginx falls back to it for `/_next/static/**` and `/assets/chunk.*.js` |
| Support window | an asset is removed only when **none of the last 5 releases** references it **and** it entered the pool **more than 14 days** ago (Q7) |
| Rollback | re-tag a previous image as `:current` + `compose up -d`; schema v1 runtime config is read by every image of this line |

`deploy` order (see the header of `nb-dashboard-deploy`): assets into the
pool (never deleting) → `docker build` → gate (`docker run --rm --network none
--env-file dashboard.env <img> true`: the entrypoint generates the config and
runs `nginx -t`) → tag `:current`, `compose up -d --no-deps --force-recreate
dashboard`, health check (`/runtime-config.json` and `/` inside the
container), automatic switch back on failure → `CURRENT`/`HISTORY` → prune.

Single replica: the recreate is a stop/start, so there is a ~1–2 s gap like a
`docker restart`. Pages already open keep working because their chunks stay
available from the pool.

Commands (forced command of the deploy key):

```
ssh <deploy-user>@<host> deploy < dashboard-release.tgz
ssh <deploy-user>@<host> status
ssh <deploy-user>@<host> rollback               # previous release in HISTORY
ssh <deploy-user>@<host> "rollback 20261020-101500"
ssh <deploy-user>@<host> prune
```

Local test without a server (fake docker): `deploy/server/test-deploy-script.sh`.

## Package (CI)

`.github/workflows/deploy.yml` (push to `dev`, or manual
`deploy`/`rollback`/`status`) packages `out` + `docker`. Secrets:
`DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_KNOWN_HOSTS`. It must only run
against a server with the v2 script and the new compose service: the v1 script
would put a build that needs `/runtime-config.json` into the official image,
which does not serve it.

## Migration runbook (on the server, with sudo)

0. Backup the compose file and the current forced command
   (`/usr/local/sbin/nb-dashboard-deploy` → `.v1`). The running image stays as
   the pre-migration rollback target.
1. Install the script: copy `deploy/server/nb-dashboard-deploy` to the server,
   `sudo install -m 755 -o root -g root nb-dashboard-deploy /usr/local/sbin/nb-dashboard-deploy`.
   Needs `jq`, `rsync`, `flock`, `curl`, Docker Compose v2. Set
   `NB_DASHBOARD_BASE` / `NB_COMPOSE_FILE` / `NB_DASHBOARD_ENV` if your layout
   differs from the script defaults.
2. Seed the pool with the release that is live now, so tabs open during the
   switch keep loading chunks: copy `<base>/html/_next` and
   `<base>/html/assets/chunk.*.js` into `<base>/static-pool/` without
   overwriting (`rsync --ignore-existing`, `cp -n`).
3. Edit `<compose-dir>/docker-compose.yml`: replace the `dashboard` service with
   `deploy/server/docker-compose.dashboard.yml` (image `netbird-dashboard-zh:current`,
   **remove** the `html` bind mount, add the read-only `static-pool` mount).
   `dashboard.env` stays as it is; an empty `AUTH_CLIENT_SECRET=` is ignored
   with a warning in the log (Q5).
4. First release: run the workflow (or stream a locally built package) with
   `deploy`. The first `docker build` pulls `alpine:3.24` and its packages;
   later builds reuse the cached layer. If `dl-cdn.alpinelinux.org` is slow
   from the server, optionally put a mirror into `<base>/apk-mirror` (one line,
   e.g. `https://mirror.example.com`); the script passes it as
   `--build-arg APK_MIRROR`. Without that file the default CDN is used. Until
   step 3 is done `compose up` would still start the old image, so do 3 before 4.
5. Verify:
   `curl -sI http://<host>/runtime-config.json` → `200`, `no-store`;
   a `/_next/static/chunks/*.js` from the page → `immutable`, `Content-Encoding: gzip`
   with `Accept-Encoding: gzip`; `/_next/static/chunks/nope.js` → `404 text/plain`;
   `/peers` and `/peers/` (301 → `/peers`) and `/nb-auth` → 200.
6. After the next deploy: a chunk of the previous release still returns 200.

Rollback of the migration: restore the compose backup and the v1 script, then
`docker compose up -d dashboard` (back to the old image + html/). Browsers hold
no immutable copy of anything config-specific, so no cache purge is needed
either way: before the migration everything was `no-store`, after it
immutable files are config-free.

## Not covered / to watch

- certbot (`LETSENCRYPT_DOMAIN`) may be `none`; the new `default.conf` with
  certbot `--nginx` is untested (needs Docker).
- `KEEP`/`MIN_AGE_DAYS` are constants at the top of the script.
- Release dirs keep the full package (~25 MB each); with the 14-day rule a
  busy fortnight keeps more than 5.
