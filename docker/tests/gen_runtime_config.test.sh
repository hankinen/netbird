#!/bin/bash
# Tests docker/gen_runtime_config.sh on the host (needs bash + jq, no Docker).
# Env fixtures are read like `docker run --env-file` does: KEY=VALUE, literal.
# shellcheck disable=SC2015,SC2016 # pass/failt never fail; literal $ is intended
set -uo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
GEN="$HERE/../gen_runtime_config.sh"
FIX="$HERE/fixtures"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
FAILURES=0

pass() { echo "ok   - $*"; }
failt() { echo "FAIL - $*"; FAILURES=$((FAILURES + 1)); }

# run_gen <fixture> <out_dir> [extra args...]; stdout+stderr -> $TMP/log
run_gen() {
    local fixture=$1 out=$2
    shift 2
    local -a envs=()
    while IFS= read -r line || [[ -n "$line" ]]; do
        [[ -z "$line" || "$line" == \#* ]] && continue
        envs+=("$line")
    done <"$FIX/$fixture"
    env -i PATH="$PATH" "${envs[@]}" bash "$GEN" "$@" "$out" >"$TMP/log" 2>&1
}

json() { jq -r "$2" "$1/runtime-config.json"; }

# --- valid fixtures --------------------------------------------------------
for f in valid-embedded-idp.env valid-auth0.env weird-chars.env; do
    if run_gen "$f" "$TMP/$f"; then pass "$f: generator exits 0"; else failt "$f: generator failed: $(cat "$TMP/log")"; continue; fi
    jq -e '.schemaVersion == 1 and (.configRevision | length == 64)' "$TMP/$f/runtime-config.json" >/dev/null &&
        pass "$f: valid JSON with schemaVersion and revision" || failt "$f: bad JSON"
    if grep -qi 'secret' "$TMP/$f/runtime-config.json"; then
        failt "$f: runtime-config.json mentions a secret"
    else pass "$f: no client secret in output"; fi
    grep -q '^add_header Content-Security-Policy "[^"]*" always;$' "$TMP/$f/nginx/csp.conf" &&
        pass "$f: csp.conf is a single add_header line" || failt "$f: csp.conf malformed"
    [[ $(wc -l <"$TMP/$f/nginx/csp.conf") -eq 1 ]] || failt "$f: csp.conf has more than one line"
    # determinism: same input -> byte-identical output
    run_gen "$f" "$TMP/$f-again" && diff -r "$TMP/$f" "$TMP/$f-again" >/dev/null &&
        pass "$f: identical output for identical input" || failt "$f: output not deterministic"
    # --check writes nothing to the target
    run_gen "$f" "$TMP/$f-check" --check && [[ ! -e "$TMP/$f-check" ]] && grep -q 'configuration OK' "$TMP/log" &&
        pass "$f: --check validates without writing" || failt "$f: --check misbehaved"
done

# --- embedded IdP (production shape) ---------------------------------------
D="$TMP/valid-embedded-idp.env"
[[ $(json "$D" .authority) == "http://203.0.113.10:8088/oauth2" && $(json "$D" .auth0Auth) == false &&
   $(json "$D" .redirectURI) == "/nb-auth" && $(json "$D" .hotjarTrackID) == null ]] &&
    pass "embedded: values typed and passed through" || failt "embedded: unexpected values"
grep -q 'location = /nb-auth ' "$D/nginx/redirects.conf" && grep -q 'location = /nb-silent-auth ' "$D/nginx/redirects.conf" &&
    pass "embedded: explicit OIDC callback routes" || failt "embedded: callback routes missing"
grep -q 'upgrade-insecure-requests' "$D/nginx/csp.conf" && failt "embedded: http backend must not upgrade-insecure" || pass "embedded: no upgrade-insecure-requests on http"
grep -q 'ws://203.0.113.10 ' "$D/nginx/csp.conf" && pass "embedded: ws:// for http backend" || failt "embedded: ws:// missing"
grep -q '//none' "$D/nginx/csp.conf" && failt "embedded: LETSENCRYPT_DOMAIN=none leaked into CSP" || pass "embedded: LETSENCRYPT_DOMAIN=none ignored"
[[ ! -e "$D/robots.txt" ]] && pass "embedded: no robots.txt override" || failt "embedded: unexpected robots.txt"

# --- auth0 legacy variables -------------------------------------------------
D="$TMP/valid-auth0.env"
[[ $(json "$D" .authority) == "https://netbird.eu.auth0.com" && $(json "$D" .auth0Auth) == true &&
   $(json "$D" .clientId) == abc123 && $(json "$D" .apiOrigin) == "https://api.netbird.io" &&
   $(json "$D" .hotjarTrackID) == 123456 && $(json "$D" '.analyticsExcludedEmails|join(",")') == "a@example.com,b@example.com" &&
   $(json "$D" .cloud) == true && $(json "$D" .redirectURI) == "" ]] &&
    pass "auth0: fallbacks, port strip, typed number/array/boolean" || failt "auth0: unexpected values $(cat "$D/runtime-config.json")"
grep -q 'do-not-leak-me' -r "$D" && failt "auth0: client secret leaked" || pass "auth0: client secret not emitted"
run_gen valid-auth0.env "$TMP/x" && grep -q 'WARNING: AUTH_CLIENT_SECRET is set but ignored' "$TMP/log" &&
    pass "auth0: warns about ignored AUTH_CLIENT_SECRET" || failt "auth0: no secret warning"
grep -q 'upgrade-insecure-requests;" always;$' "$D/nginx/csp.conf" && pass "auth0: https gets upgrade-insecure-requests" || failt "auth0: upgrade-insecure missing"
for origin in https://api.hetzner.cloud https://api.digitalocean.com https://extra.example.com wss://api.netbird.io https://app.netbird.io/; do
    sed 's/.*connect-src \([^;]*\);.*/\1/' "$D/nginx/csp.conf" | grep -qF -- "$origin" && pass "auth0: connect-src has $origin" || failt "auth0: connect-src lacks $origin"
done
grep -q '^Disallow: /$' "$D/robots.txt" 2>/dev/null && pass "auth0: robots.txt written when indexing allowed" || failt "auth0: robots.txt missing"
[[ $(sed '/^#/d;/^$/d' "$D/nginx/redirects.conf" | wc -l) -eq 0 ]] && pass "auth0: hash redirect URIs get no route" || failt "auth0: unexpected routes"

# --- weird characters round-trip exactly ------------------------------------
D="$TMP/weird-chars.env"
[[ $(json "$D" .announcement) == 'Staging "blue" — costs $5 & more \n not a newline' ]] &&
    pass "weird: announcement with quotes/\$/& round-trips exactly" || failt "weird: announcement mangled: $(json "$D" .announcement)"
[[ $(json "$D" .clientId) == "client\"with'quotes\$HOME" ]] && pass "weird: clientId round-trips" || failt "weird: clientId mangled"
[[ $(json "$D" .audience) == "" ]] && pass "weird: AUTH_AUDIENCE=none -> empty" || failt "weird: audience not cleared"
[[ $(json "$D" .apiOrigin) == "https://api.example.com" ]] && pass "weird: trailing slash stripped" || failt "weird: apiOrigin $(json "$D" .apiOrigin)"
grep -q 'realms/a&b' "$D/nginx/csp.conf" && pass "weird: authority with & kept in CSP" || failt "weird: authority missing in CSP"

# --- invalid fixtures --------------------------------------------------------
if run_gen missing-authority.env "$TMP/missing"; then failt "missing-authority: should fail"; else
    grep -q 'AUTH_AUTHORITY or AUTH0_DOMAIN' "$TMP/log" && pass "missing-authority: exits non-zero with message" || failt "missing-authority: wrong message"
fi
[[ ! -e "$TMP/missing/runtime-config.json" ]] && pass "missing-authority: nothing written" || failt "missing-authority: partial output"
if run_gen csp-injection.env "$TMP/inject"; then failt "csp-injection: should fail"; else
    grep -q 'not allowed in the Content-Security-Policy' "$TMP/log" && pass "csp-injection: rejected" || failt "csp-injection: wrong message $(cat "$TMP/log")"
fi

# --- generator never touches the html dir / no templating tools ------------
# (pattern split so a repo-wide grep for the old tooling stays clean)
if grep -nE 'env''subst|sed -i|/usr/share/nginx/html' "$GEN" >/dev/null; then failt "generator templates built files or touches html dir"; else pass "generator does not template or touch html dir"; fi

if [[ $FAILURES -eq 0 ]]; then
    echo "ALL GENERATOR TESTS PASSED"
else
    echo "$FAILURES generator test(s) failed"
    exit 1
fi
