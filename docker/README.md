# NetBird Dashboard

NetBird Dashboard is NetBird's management server UI.

## Tags

Each published image tag also has a rootless variant with the `-rootless`
suffix. For example, `main` is also published as `main-rootless`.

Each tag also has a Red Hat UBI variant with the `-ubi` suffix (for example
`main-ubi`). Stable releases are also tagged `ubi-latest`.

## How to use this image

HTTP:

```shell
docker run -d --rm -p 80:80 netbirdio/dashboard:main
```

Using an SSL certificate from Let's Encrypt:

```shell
docker run -d --rm -p 80:80 -p 443:443 \
  -e LETSENCRYPT_DOMAIN=app.mydomain.com \
  -e LETSENCRYPT_EMAIL=hello@mydomain.com \
  netbirdio/dashboard:main
```

For certificate generation, the server needs a public IP and a domain name
pointing to it.

### Rootless and OpenShift

The rootless image listens on port `8080`, runs as UID `10001` by default, and
supports OpenShift's arbitrary UID when the container retains GID `0`:

```shell
docker run -d --rm \
  --user 12345:0 \
  -p 8080:8080 \
  -e AUTH_AUTHORITY=https://idp.example.com \
  -e AUTH_CLIENT_ID=netbird-dashboard \
  -e AUTH_AUDIENCE=netbird-dashboard \
  -e AUTH_SUPPORTED_SCOPES='openid profile email' \
  -e USE_AUTH0=false \
  -e NETBIRD_MGMT_API_ENDPOINT=https://api.example.com \
  netbirdio/dashboard:main-rootless
```

The rootless image does not include Certbot or expose HTTPS. Terminate TLS at
the OpenShift Route, Ingress, or another reverse proxy.

### Red Hat UBI

The `-ubi` image behaves like the rootless image (port `8080`, UID `10001`,
GID `0`, no HTTPS) but is built on Red Hat Universal Base Image 9 minimal with
nginx 1.26 from the RHEL AppStream, for Red Hat container certification. It is
published for `linux/amd64` and `linux/arm64` only. License terms are in
`/licenses`.

## Environment variables

- `NGINX_SSL_PORT` changes the port that Nginx listens to. Defaults to `443`.
- `LETSENCRYPT_DOMAIN` enables Certbot for the specified domain. Defaults to
  `none`.
- `LETSENCRYPT_EMAIL` is used to register the certificate request. Defaults to
  `example@local`.

These certificate variables apply only to the standard image.
## Runtime configuration and caching

The built files in `/usr/share/nginx/html` are never modified at runtime. At
start, `entrypoint.sh` runs `gen_runtime_config.sh`, which reads the
environment (`AUTH_*`, `NETBIRD_*`, `USE_AUTH0`, ...) and writes into
`/run/netbird-dashboard`:

- `runtime-config.json`, served at `/runtime-config.json` (`no-store`) and
  fetched by the dashboard before any login or API call;
- `nginx/csp.conf`, the `Content-Security-Policy` header;
- `nginx/redirects.conf`, explicit `200` routes for path-style OIDC callback
  URIs (`AUTH_REDIRECT_URI=/nb-auth`, ...);
- `robots.txt`, only with `NETBIRD_ALLOW_SEARCH_INDEXING=true`.

It then runs `nginx -t` and only starts nginx when both succeed, so a broken
environment fails the container instead of serving a half-configured app.
`gen_runtime_config.sh --check` validates an environment without writing.

`AUTH_CLIENT_SECRET` is ignored (with a warning): the dashboard is a public
OIDC client and nothing secret is ever served to browsers.

Cache policy: HTML, `*.txt` route payloads and `/runtime-config.json` are
`no-store`; content-hashed files under `/_next/static/` and
`/assets/chunk.<hash>.js` are `public, max-age=31536000, immutable` and a
missing one is a plain-text `404`; other public files are `no-cache` (ETag).
Hashed files of previous releases can be mounted read-only at
`/usr/share/nginx/static-pool` so already-open pages keep loading lazy chunks
after an upgrade.

Tests: `docker/tests/gen_runtime_config.test.sh` (bash + jq),
`docker/tests/run_local_nginx.sh` (host nginx, no Docker) and
`docker/tests/smoke.sh <image>` (Docker).
