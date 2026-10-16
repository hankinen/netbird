#!/bin/bash
# Docker-free check of docker/default.conf + nginx.conf: runs a host nginx
# binary with the image's config (paths rewritten into a temp prefix) against
# a built out/ directory and the generator output, then runs
# nginx_headers.test.sh. Usage:
#   NGINX_BIN=/usr/sbin/nginx docker/tests/run_local_nginx.sh [out_dir] [env_fixture]
# Needs: nginx (any 1.2x with gzip_static), bash, jq, curl.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../.." && pwd)
OUT=$(cd "${1:-$REPO/out}" && pwd)
FIXTURE=${2:-$HERE/fixtures/valid-embedded-idp.env}
NGINX_BIN=${NGINX_BIN:-nginx}
MIME_TYPES=${MIME_TYPES:-/etc/nginx/mime.types}
PORT=${PORT:-18080}
P=$(mktemp -d)
cleanup() { [[ -f "$P/nginx.pid" ]] && kill "$(cat "$P/nginx.pid")" 2>/dev/null; rm -rf "$P"; }
trap cleanup EXIT

mkdir -p "$P/etc/nginx/http.d" "$P/etc/nginx/snippets" "$P/run" "$P/tmp/nginx" "$P/usr/share/nginx"
ln -s "$OUT" "$P/usr/share/nginx/html"
cp "$MIME_TYPES" "$P/etc/nginx/mime.types"
cp "$REPO"/docker/snippets/*.conf "$P/etc/nginx/snippets/"
cp "$REPO/docker/default.conf" "$P/etc/nginx/http.d/default.conf"
sed -e '/^user nginx;$/d' -e 's/^daemon off;$/daemon on;/' -e '/modules\/\*\.conf/d' "$REPO/docker/nginx.conf" >"$P/etc/nginx/nginx.conf"
cp "$REPO/docker/rootless.conf" "$P/etc/nginx/http.d/rootless.conf"

# Generate runtime files exactly like the entrypoint does.
envs=()
while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    envs+=("$line")
done <"$FIXTURE"
env -i PATH="$PATH" "${envs[@]}" bash "$REPO/docker/gen_runtime_config.sh" "$P/run/netbird-dashboard" >/dev/null

# Rewrite absolute paths into the prefix; unprivileged port.
find "$P/etc/nginx" "$P/run" -name '*.conf' -print0 | xargs -0 sed -i \
    -e "s#/etc/nginx#$P/etc/nginx#g" \
    -e "s#/run/netbird-dashboard#$P/run/netbird-dashboard#g" \
    -e "s#/usr/share/nginx#$P/usr/share/nginx#g" \
    -e "s#/tmp/nginx#$P/tmp/nginx#g" \
    -e "s#/proc/self/fd/[12]#$P/nginx.log#g" \
    -e "s#listen 80 default_server;#listen 127.0.0.1:$PORT default_server;#" \
    -e "/listen \[::\]:80 default_server;/d"

"$NGINX_BIN" -p "$P" -c "$P/etc/nginx/nginx.conf" -e "$P/nginx.log" -g "pid $P/nginx.pid;" -t
"$NGINX_BIN" -p "$P" -c "$P/etc/nginx/nginx.conf" -e "$P/nginx.log" -g "pid $P/nginx.pid;"
for _ in $(seq 1 50); do curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 0.1; done
bash "$HERE/nginx_headers.test.sh" "http://127.0.0.1:$PORT"
