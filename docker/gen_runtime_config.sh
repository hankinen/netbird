#!/bin/bash
# Generates the deployment-specific files the dashboard needs at runtime, from
# the container environment, into a writable directory (never the html dir):
#
#   $OUT_DIR/runtime-config.json      public client config, fetched by the app
#   $OUT_DIR/nginx/csp.conf           Content-Security-Policy add_header line
#   $OUT_DIR/nginx/redirects.conf     OIDC callback routes served as index.html
#   $OUT_DIR/robots.txt               only with NETBIRD_ALLOW_SEARCH_INDEXING=true
#
# Usage: gen_runtime_config.sh [--check] [OUT_DIR]   (default /run/netbird-dashboard)
#   --check  validate the environment and generate into a temp dir only.
#
# Replaces the old init_react_envs.sh, which substituted $VARS into the built
# JS and patched nginx config in place. Built assets are now never modified,
# so they can be cached as immutable.
set -euo pipefail
set -f # CSP sources such as *.example.com must never glob-expand
export LC_ALL=C

CHECK_ONLY=false
if [[ "${1:-}" == "--check" ]]; then
    CHECK_ONLY=true
    shift
fi
OUT_DIR=${1:-/run/netbird-dashboard}

fail() {
    echo "gen_runtime_config: $*" >&2
    exit 1
}
warn() {
    echo "gen_runtime_config: WARNING: $*" >&2
}

command -v jq >/dev/null || fail "jq is required"

# ---------------------------------------------------------------------------
# Validation and defaults (ported from init_react_envs.sh)
# ---------------------------------------------------------------------------
[[ -n "${AUTH_AUTHORITY:-}" || -n "${AUTH0_DOMAIN:-}" ]] ||
    fail "AUTH_AUTHORITY or AUTH0_DOMAIN environment variable must be set"
[[ -n "${AUTH_CLIENT_ID:-}" || -n "${AUTH0_CLIENT_ID:-}" ]] ||
    fail "AUTH_CLIENT_ID or AUTH0_CLIENT_ID environment variable must be set"
[[ -n "${AUTH_AUDIENCE:-}" || -n "${AUTH0_AUDIENCE:-}" ]] ||
    fail "AUTH_AUDIENCE or AUTH0_AUDIENCE environment variable must be set"
[[ -n "${AUTH_SUPPORTED_SCOPES:-}" || -n "${AUTH0_DOMAIN:-}" ]] ||
    fail "AUTH_SUPPORTED_SCOPES environment variable must be set"
[[ -n "${USE_AUTH0:-}" || -n "${AUTH0_DOMAIN:-}" ]] ||
    fail "USE_AUTH0 environment variable must be set"
[[ -n "${NETBIRD_MGMT_API_ENDPOINT:-}" ]] ||
    fail "NETBIRD_MGMT_API_ENDPOINT environment variable must be set"

AUTH_AUTHORITY=${AUTH_AUTHORITY:-https://${AUTH0_DOMAIN:-}}
AUTH_CLIENT_ID=${AUTH_CLIENT_ID:-${AUTH0_CLIENT_ID:-}}
AUTH_AUDIENCE=${AUTH_AUDIENCE:-${AUTH0_AUDIENCE:-}}
[[ "$AUTH_AUDIENCE" == "none" ]] && AUTH_AUDIENCE=""
USE_AUTH0=${USE_AUTH0:-true}
AUTH_SUPPORTED_SCOPES=${AUTH_SUPPORTED_SCOPES:-openid profile email api offline_access email_verified}
NETBIRD_MGMT_API_ENDPOINT=$(printf '%s' "$NETBIRD_MGMT_API_ENDPOINT" | sed -E 's#/+$##; s/(:80|:443)$//')
NETBIRD_TOKEN_SOURCE=${NETBIRD_TOKEN_SOURCE:-accessToken}
LETSENCRYPT_DOMAIN=${LETSENCRYPT_DOMAIN:-}
[[ "$LETSENCRYPT_DOMAIN" == "none" ]] && LETSENCRYPT_DOMAIN=""

# The client secret must never reach the browser. Public clients (PKCE) do
# not need it; the old build-time config leaked it into a public JS chunk.
if [[ -n "${AUTH_CLIENT_SECRET:-}" ]]; then
    warn "AUTH_CLIENT_SECRET is set but ignored: the dashboard is a public OIDC client (PKCE) and secrets are not served to browsers. Configure the IdP client as public / without a secret."
fi

RE_URL='^https?://[^[:space:]"'"'"';$\]+$'
is_http_url() { [[ "$1" =~ $RE_URL ]]; }
is_http_url "$AUTH_AUTHORITY" || fail "AUTH_AUTHORITY must be an http(s) URL, got '$AUTH_AUTHORITY'"
is_http_url "$NETBIRD_MGMT_API_ENDPOINT" || fail "NETBIRD_MGMT_API_ENDPOINT must be an http(s) URL, got '$NETBIRD_MGMT_API_ENDPOINT'"
[[ -z "${NETBIRD_MGMT_GRPC_API_ENDPOINT:-}" ]] || is_http_url "$NETBIRD_MGMT_GRPC_API_ENDPOINT" ||
    fail "NETBIRD_MGMT_GRPC_API_ENDPOINT must be an http(s) URL"
[[ -z "${NETBIRD_AUTH_SERVICE_URL:-}" ]] || is_http_url "$NETBIRD_AUTH_SERVICE_URL" ||
    fail "NETBIRD_AUTH_SERVICE_URL must be an http(s) URL"
[[ -z "${NETBIRD_HOTJAR_TRACK_ID:-}" || "${NETBIRD_HOTJAR_TRACK_ID}" =~ ^[0-9]+$ ]] ||
    fail "NETBIRD_HOTJAR_TRACK_ID must be numeric"

# Values that end up inside the nginx CSP header must not be able to break
# out of the quoted header value or inject nginx variables.
RE_CSP_TOKEN='^[][A-Za-z0-9*._:/%?=&+~@!,-]+$'
is_csp_token() { [[ "$1" =~ $RE_CSP_TOKEN ]]; }

# ---------------------------------------------------------------------------
# runtime-config.json
# ---------------------------------------------------------------------------
BODY=$(jq -n -S \
    --arg authority "$AUTH_AUTHORITY" \
    --arg clientId "$AUTH_CLIENT_ID" \
    --arg scopesSupported "$AUTH_SUPPORTED_SCOPES" \
    --arg audience "$AUTH_AUDIENCE" \
    --arg apiOrigin "$NETBIRD_MGMT_API_ENDPOINT" \
    --arg grpcApiOrigin "${NETBIRD_MGMT_GRPC_API_ENDPOINT:-}" \
    --arg redirectURI "${AUTH_REDIRECT_URI:-}" \
    --arg silentRedirectURI "${AUTH_SILENT_REDIRECT_URI:-}" \
    --arg tokenSource "$NETBIRD_TOKEN_SOURCE" \
    --arg auth0Auth "$USE_AUTH0" \
    --arg dragQueryParams "${NETBIRD_DRAG_QUERY_PARAMS:-false}" \
    --arg hotjarTrackID "${NETBIRD_HOTJAR_TRACK_ID:-}" \
    --arg googleAnalyticsID "${NETBIRD_GOOGLE_ANALYTICS_ID:-}" \
    --arg googleTagManagerID "${NETBIRD_GOOGLE_TAG_MANAGER_ID:-}" \
    --arg authServiceUrl "${NETBIRD_AUTH_SERVICE_URL:-}" \
    --arg wasmPath "${NETBIRD_WASM_PATH:-}" \
    --arg licensed "${NETBIRD_LICENSED:-false}" \
    --arg cloud "${NETBIRD_CLOUD:-false}" \
    --arg agentNetworkOnly "${NETBIRD_AGENT_NETWORK_ONLY:-false}" \
    --arg agentNetworkEnabled "${NETBIRD_AGENT_NETWORK_ENABLED:-false}" \
    --arg hubspotPortalId "${NETBIRD_HUBSPOT_PORTAL_ID:-}" \
    --arg hubspotSignupFormId "${NETBIRD_HUBSPOT_SIGNUP_FORM_ID:-}" \
    --arg hubspotOnboardingFormId "${NETBIRD_HUBSPOT_ONBOARDING_FORM_ID:-}" \
    --arg hubspotSurveyFormId "${NETBIRD_HUBSPOT_SURVEY_FORM_ID:-}" \
    --arg analyticsExcludedEmails "${NETBIRD_ANALYTICS_EXCLUDED_EMAILS:-}" \
    --arg announcement "${NETBIRD_ANNOUNCEMENT:-}" \
    '{
      schemaVersion: 1,
      authority: $authority,
      clientId: $clientId,
      scopesSupported: $scopesSupported,
      audience: $audience,
      apiOrigin: $apiOrigin,
      grpcApiOrigin: $grpcApiOrigin,
      redirectURI: $redirectURI,
      silentRedirectURI: $silentRedirectURI,
      tokenSource: $tokenSource,
      auth0Auth: ($auth0Auth == "true"),
      dragQueryParams: ($dragQueryParams == "true"),
      hotjarTrackID: (if $hotjarTrackID == "" then null else ($hotjarTrackID | tonumber) end),
      googleAnalyticsID: $googleAnalyticsID,
      googleTagManagerID: $googleTagManagerID,
      authServiceUrl: $authServiceUrl,
      wasmPath: $wasmPath,
      licensed: ($licensed == "true"),
      cloud: ($cloud == "true"),
      agentNetworkOnly: ($agentNetworkOnly == "true"),
      agentNetworkEnabled: ($agentNetworkEnabled == "true"),
      hubspotPortalId: $hubspotPortalId,
      hubspotSignupFormId: $hubspotSignupFormId,
      hubspotOnboardingFormId: $hubspotOnboardingFormId,
      hubspotSurveyFormId: $hubspotSurveyFormId,
      analyticsExcludedEmails: ($analyticsExcludedEmails | split(",") | map(gsub("^\\s+|\\s+$"; "")) | map(select(. != ""))),
      announcement: $announcement
    }')
REVISION=$(printf '%s' "$(jq -c -S . <<<"$BODY")" | sha256sum | cut -d' ' -f1)
CONFIG_JSON=$(jq -S --arg rev "$REVISION" '. + {configRevision: $rev}' <<<"$BODY")

# ---------------------------------------------------------------------------
# CSP (ported from init_react_envs.sh)
# ---------------------------------------------------------------------------
FIRST_PARTY_CSP="pkgs.netbird.io"
FIRST_PARTY_CSP_CONNECT_SRC="wss://*.netbird.io"
THIRD_PARTY_CSP="*.licdn.com *.linkedin.com *.vector.co *.sibforms.com *.hotjar.com *.hotjar.io *.redditstatic.com pixel-config.reddit.com *.clarity.ms c.bing.com *.microsoft.com googleads.g.doubleclick.net pagead2.googlesyndication.com www.google.com www.googleadservices.com *.google-analytics.com *.googletagmanager.com analytics.google.com *.hubapi.com *.hs-banner.com *.hubspot.com *.hubspot.net js.hs-analytics.com *.hsforms.net *.hscollectedforms.net *.hs-analytics.net *.hsforms.com track.hubspot.com *.hsadspixel.net static.hsappstatic.net"
THIRD_PARTY_CSP_CONNECT_SRC="https://api.github.com/repos/netbirdio/netbird/releases/latest https://raw.githubusercontent.com/netbirdio/dashboard/ wss://ws.hotjar.com https://api.hetzner.cloud https://api.digitalocean.com"
# shellcheck disable=SC2089,SC2090 # the single quotes are literal CSP syntax
THIRD_PARTY_CSP_SCRIPT_SRC="'sha256-7knV6EIjKUvCpYWE2rCYx8dYV2WCNb2bpTuitFXzBcA=' *.hs-scripts.com"

CSP_DOMAINS=""
CSP_DOMAINS_CONNECT_SRC=""
add_domain() {
    is_csp_token "$1" || fail "value '$1' is not allowed in the Content-Security-Policy"
    CSP_DOMAINS="$CSP_DOMAINS $1"
}
add_connect() {
    is_csp_token "$1" || fail "value '$1' is not allowed in the Content-Security-Policy"
    CSP_DOMAINS_CONNECT_SRC="$CSP_DOMAINS_CONNECT_SRC $1"
}

for token in ${NETBIRD_CSP:-}; do add_domain "$token"; done

add_domain "$AUTH_AUTHORITY"
add_domain "$(printf '%s' "$AUTH_AUTHORITY" | sed -E 's|^(https?://[^/]+).*|\1|')"

if [[ "$AUTH_AUDIENCE" == *"http://"* || "$AUTH_AUDIENCE" == *"https://"* ]]; then
    add_domain "$AUTH_AUDIENCE"
fi

[[ -n "${NETBIRD_AUTH_SERVICE_URL:-}" ]] && add_domain "$NETBIRD_AUTH_SERVICE_URL"

MGMT_DOMAIN=$(printf '%s' "$NETBIRD_MGMT_API_ENDPOINT" | sed -E 's|https?://||' | cut -d'/' -f1 | cut -d':' -f1)
if [[ -n "$MGMT_DOMAIN" ]]; then
    add_domain "$NETBIRD_MGMT_API_ENDPOINT"
    if [[ "$NETBIRD_MGMT_API_ENDPOINT" == https://* ]]; then
        add_connect "wss://$MGMT_DOMAIN"
    else
        add_connect "ws://$MGMT_DOMAIN"
    fi
fi

if [[ -n "$LETSENCRYPT_DOMAIN" ]]; then
    if [[ "$LETSENCRYPT_DOMAIN" == *"localhost"* ]]; then
        add_domain "http://$LETSENCRYPT_DOMAIN"
        add_connect "ws://$LETSENCRYPT_DOMAIN"
    else
        add_domain "https://$LETSENCRYPT_DOMAIN"
        add_connect "wss://$LETSENCRYPT_DOMAIN"
    fi
fi

uniq_words() { tr ' ' '\n' | sed '/^$/d' | sort -u | tr '\n' ' ' | sed 's/ $//'; }
# shellcheck disable=SC2086 # word splitting is the point here
CSP_CONNECT_SRC=$(echo $CSP_DOMAINS $CSP_DOMAINS_CONNECT_SRC $FIRST_PARTY_CSP $FIRST_PARTY_CSP_CONNECT_SRC $THIRD_PARTY_CSP $THIRD_PARTY_CSP_CONNECT_SRC | uniq_words)
# shellcheck disable=SC2086
CSP_FRAME_SRC=$(echo $CSP_DOMAINS $FIRST_PARTY_CSP $THIRD_PARTY_CSP | uniq_words)
# shellcheck disable=SC2086,SC2090
CSP_SCRIPT_SRC=$(echo $CSP_DOMAINS $FIRST_PARTY_CSP $THIRD_PARTY_CSP $THIRD_PARTY_CSP_SCRIPT_SRC | uniq_words)

# upgrade-insecure-requests breaks plain-http deployments (it rewrites the
# working http/ws endpoints to https/wss); emit it only for https backends.
CSP_UPGRADE_INSECURE=" upgrade-insecure-requests;"
if [[ "$NETBIRD_MGMT_API_ENDPOINT" == http://* || "$AUTH_AUTHORITY" == http://* ]]; then
    CSP_UPGRADE_INSECURE=""
fi

CSP_POLICY="default-src 'none'; connect-src 'self' $CSP_CONNECT_SRC; frame-src 'self' $CSP_FRAME_SRC; script-src 'self' 'wasm-unsafe-eval' $CSP_SCRIPT_SRC; font-src 'self'; img-src * data:; manifest-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';$CSP_UPGRADE_INSECURE"
CSP_CONF="add_header Content-Security-Policy \"$CSP_POLICY\" always;"

# ---------------------------------------------------------------------------
# OIDC callback routes: path-style redirect URIs (e.g. /nb-auth) get an
# explicit 200 route instead of depending on the 404 page.
# ---------------------------------------------------------------------------
REDIRECTS_CONF="# generated by gen_runtime_config.sh"
RE_ROUTE='^/[A-Za-z0-9._~/-]+$'
declare -A seen_routes=()
for uri in "${AUTH_REDIRECT_URI:-}" "${AUTH_SILENT_REDIRECT_URI:-}"; do
    path=${uri%%\?*}
    [[ -z "$path" || "$path" == "/" || "$path" == *"#"* ]] && continue
    if [[ ! "$path" =~ $RE_ROUTE ]]; then
        warn "redirect URI path '$path' has unexpected characters; no explicit route generated"
        continue
    fi
    [[ -n "${seen_routes[$path]:-}" ]] && continue
    seen_routes[$path]=1
    REDIRECTS_CONF+=$'\n'"location = $path { include /etc/nginx/snippets/html.conf; try_files /index.html =404; }"
done

ROBOTS=""
if [[ "${NETBIRD_ALLOW_SEARCH_INDEXING:-}" == "true" ]]; then
    ROBOTS=$'User-agent: *\nAllow: /$\nAllow: /install$\nAllow: /install/$\nDisallow: /'
fi

# ---------------------------------------------------------------------------
# Write (atomically: temp file + rename in the same directory)
# ---------------------------------------------------------------------------
if $CHECK_ONLY; then
    OUT_DIR=$(mktemp -d)
    trap 'rm -rf "$OUT_DIR"' EXIT
fi
mkdir -p "$OUT_DIR/nginx"

write_atomic() {
    local dest=$1 tmp
    tmp=$(mktemp "$dest.XXXXXX")
    cat >"$tmp"
    chmod 0644 "$tmp"
    mv -f "$tmp" "$dest"
}

printf '%s\n' "$CONFIG_JSON" | write_atomic "$OUT_DIR/runtime-config.json"
printf '%s\n' "$CSP_CONF" | write_atomic "$OUT_DIR/nginx/csp.conf"
printf '%s\n' "$REDIRECTS_CONF" | write_atomic "$OUT_DIR/nginx/redirects.conf"
if [[ -n "$ROBOTS" ]]; then
    printf '%s\n' "$ROBOTS" | write_atomic "$OUT_DIR/robots.txt"
else
    rm -f "$OUT_DIR/robots.txt"
fi

if $CHECK_ONLY; then
    echo "gen_runtime_config: configuration OK (revision $REVISION)"
else
    echo "gen_runtime_config: wrote $OUT_DIR/runtime-config.json (revision $REVISION)"
    echo "gen_runtime_config: CSP: $CSP_POLICY"
fi
