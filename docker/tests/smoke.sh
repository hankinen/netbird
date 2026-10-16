#!/bin/bash
# Container smoke test (needs Docker). Usage: docker/tests/smoke.sh <image> [port]
#  1. the same image started with two different env files serves byte-identical
#     immutable assets (/_next/static, /assets) and different /runtime-config.json;
#  2. the header policy holds (nginx_headers.test.sh) for the first container;
#  3. a broken env (missing AUTH_AUTHORITY) makes the container exit non-zero.
set -euo pipefail
IMAGE=${1:?usage: $0 <image> [port]}
PORT=${2:-18081}
HERE=$(cd "$(dirname "$0")" && pwd)
FIX="$HERE/fixtures"
NAMES=()
cleanup() { for n in "${NAMES[@]}"; do docker rm -f "$n" >/dev/null 2>&1 || true; done; }
trap cleanup EXIT

# Internal port: 80 for the standard image, 8080 for rootless/ubi.
INTERNAL=80
if docker image inspect -f '{{json .Config.ExposedPorts}}' "$IMAGE" | grep -q '"8080/tcp"'; then INTERNAL=8080; fi

start() { # <name> <envfile> <hostport>
    NAMES+=("$1")
    docker run -d --name "$1" --env-file "$2" -p "127.0.0.1:$3:$INTERNAL" "$IMAGE" >/dev/null
    for _ in $(seq 1 60); do
        curl -sf -o /dev/null "http://127.0.0.1:$3/runtime-config.json" && return 0
        sleep 1
    done
    docker logs "$1" >&2
    echo "SMOKE FAIL: $1 did not come up" >&2
    exit 1
}
hashes() { docker exec "$1" sh -c 'cd /usr/share/nginx/html && find _next/static assets -type f -exec sha256sum {} + | sort -k2'; }

start nbdash-smoke-a "$FIX/valid-embedded-idp.env" "$PORT"
start nbdash-smoke-b "$FIX/valid-auth0.env" "$((PORT + 1))"

diff <(hashes nbdash-smoke-a) <(hashes nbdash-smoke-b) >/dev/null ||
    { echo "SMOKE FAIL: immutable assets differ between configs"; exit 1; }
A=$(curl -s "http://127.0.0.1:$PORT/runtime-config.json" | jq -r .configRevision)
B=$(curl -s "http://127.0.0.1:$((PORT + 1))/runtime-config.json" | jq -r .configRevision)
[[ -n "$A" && "$A" != "$B" ]] || { echo "SMOKE FAIL: runtime-config.json does not differ"; exit 1; }
if docker exec nbdash-smoke-a sh -c 'grep -rlE "\\\$(AUTH_|NETBIRD_|USE_AUTH0)" /usr/share/nginx/html' | grep -q .; then
    echo "SMOKE FAIL: placeholders in the html dir"; exit 1
fi
docker logs nbdash-smoke-b 2>&1 | grep -q 'AUTH_CLIENT_SECRET is set but ignored' ||
    { echo "SMOKE FAIL: no warning for AUTH_CLIENT_SECRET"; exit 1; }

bash "$HERE/nginx_headers.test.sh" "http://127.0.0.1:$PORT"

set +e
docker run --rm --env-file "$FIX/missing-authority.env" "$IMAGE" >/tmp/nbdash-smoke-bad.log 2>&1
CODE=$?
set -e
if [[ $CODE -eq 0 ]] || ! grep -q 'AUTH_AUTHORITY or AUTH0_DOMAIN' /tmp/nbdash-smoke-bad.log; then
    echo "SMOKE FAIL: bad config exited $CODE"; cat /tmp/nbdash-smoke-bad.log; exit 1
fi
echo "SMOKE OK: immutable assets identical across configs; bad config exits $CODE"
