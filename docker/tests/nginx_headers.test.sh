#!/bin/bash
# Asserts the dashboard nginx cache/MIME/404/security-header policy against a
# running server. Usage: nginx_headers.test.sh http://127.0.0.1:8080
# Picks real file names from the served index.html, so it works for any build.
# shellcheck disable=SC2015 # pass/failt never fail
set -uo pipefail
BASE=${1:?usage: $0 BASE_URL}
BASE=${BASE%/}
FAILURES=0
pass() { echo "ok   - $*"; }
failt() { echo "FAIL - $*"; FAILURES=$((FAILURES + 1)); }

# fetch_headers <url> [curl args...] -> response headers (lower-cased names)
fetch_headers() { curl -s -o /dev/null -D - "$@" | tr -d '\r' | sed -E 's/^([A-Za-z-]+):/\L\1:/'; }
status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
hdr() { grep -i "^$2:" <<<"$1" | head -1 | cut -d' ' -f2-; }

expect_header() { # <name> <headers> <header> <regex>
    local v
    v=$(hdr "$2" "$3")
    [[ "$v" =~ $4 ]] && pass "$1: $3 = $v" || failt "$1: $3 is '$v', expected /$4/"
}
expect_status() { # <name> <code> <url> [curl args]
    local name=$1 want=$2 url=$3 got
    shift 3
    got=$(status "$@" "$url")
    [[ "$got" == "$want" ]] && pass "$name: status $got" || failt "$name: status $got, expected $want"
}

INDEX=$(curl -s "$BASE/")
CHUNK=$(grep -oE '/_next/static/chunks/[A-Za-z0-9._~-]+\.js' <<<"$INDEX" | head -1)
CSS=$(grep -oE '/_next/static/chunks/[A-Za-z0-9._~-]+\.css' <<<"$INDEX" | head -1)
INLINE=$(grep -oE '/assets/chunk\.[0-9a-f]{8}\.js' <<<"$INDEX" | head -1)
FONT=$(grep -oE '/_next/static/media/[A-Za-z0-9._~-]+\.woff2' <<<"$INDEX" | head -1)
[[ -n "$CHUNK" && -n "$INLINE" ]] || failt "could not find chunk names in index.html"

NO_STORE='no-store'
IMMUTABLE='^public, max-age=31536000, immutable$'

for path in / /index.html /peers /runtime-config.json /404-does-not-exist; do
    H=$(fetch_headers "$BASE$path")
    expect_header "html $path" "$H" cache-control "$NO_STORE"
    expect_header "html $path" "$H" content-security-policy "default-src 'none'"
    expect_header "html $path" "$H" x-frame-options "SAMEORIGIN"
done
expect_status "deep link /peers" 200 "$BASE/peers"
H=$(fetch_headers "$BASE/peers/")
[[ $(grep -c '^HTTP/1.1 301' <<<"$H") -eq 1 && $(hdr "$H" location) == "/peers" ]] &&
    pass "trailing slash /peers/ -> 301 /peers (relative)" || failt "trailing slash: $(head -1 <<<"$H") $(hdr "$H" location)"
expect_status "oidc callback /nb-auth" 200 "$BASE/nb-auth?code=x&state=y"
expect_status "oidc silent callback /nb-silent-auth" 200 "$BASE/nb-silent-auth"
H=$(fetch_headers "$BASE/nb-auth")
expect_header "/nb-auth" "$H" cache-control "$NO_STORE"
expect_header "/nb-auth" "$H" content-type "text/html"

H=$(fetch_headers "$BASE/runtime-config.json")
expect_header "/runtime-config.json" "$H" content-type "^application/json"
curl -s "$BASE/runtime-config.json" | jq -e '.schemaVersion == 1' >/dev/null &&
    pass "/runtime-config.json is schema v1 JSON" || failt "/runtime-config.json not valid"

for path in "$CHUNK" "$CSS" "$INLINE" "$FONT"; do
    [[ -z "$path" ]] && continue
    H=$(fetch_headers "$BASE$path")
    expect_status "asset $path" 200 "$BASE$path"
    expect_header "asset $path" "$H" cache-control "$IMMUTABLE"
    expect_header "asset $path" "$H" x-content-type-options "nosniff"
    expect_header "asset $path" "$H" content-security-policy "default-src 'none'"
done
[[ -n "$FONT" ]] && expect_header "font" "$(fetch_headers "$BASE$FONT")" content-type "^font/woff2$"

for path in "$CHUNK" "$CSS"; do
    [[ -z "$path" ]] && continue
    expect_header "gzip $path" "$(fetch_headers "$BASE$path" -H 'Accept-Encoding: gzip')" content-encoding "^gzip$"
done

for path in /_next/static/chunks/does-not-exist.js /assets/chunk.00000000.js /does-not-exist.js; do
    H=$(fetch_headers "$BASE$path")
    expect_status "missing $path" 404 "$BASE$path"
    expect_header "missing $path" "$H" content-type "^text/plain"
    expect_header "missing $path" "$H" cache-control "$NO_STORE"
done

for path in /favicon.ico /theme/idp.css /wasm_exec.js /robots.txt; do
    H=$(fetch_headers "$BASE$path")
    expect_status "public $path" 200 "$BASE$path"
    expect_header "public $path" "$H" cache-control "^no-cache$"
    expect_header "public $path" "$H" etag "."
    expect_header "public $path" "$H" x-content-type-options "nosniff"
done

if [[ $FAILURES -eq 0 ]]; then
    echo "ALL HEADER TESTS PASSED"
else
    echo "$FAILURES header test(s) failed"
    exit 1
fi
