#!/bin/bash
# Container entrypoint: generate the runtime config, verify nginx accepts the
# resulting configuration, then start the real command (supervisord or nginx).
# Any failure exits non-zero before nginx serves a half-configured app, so a
# bad environment shows up as a failed/restarting container, not as a broken
# dashboard. The built files in /usr/share/nginx/html are never modified.
set -euo pipefail

RUNTIME_DIR=${NETBIRD_RUNTIME_DIR:-/run/netbird-dashboard}
NGINX_CONF=${NGINX_CONF:-/etc/nginx/nginx.conf}

/usr/local/bin/gen_runtime_config.sh "$RUNTIME_DIR"
nginx -q -t -e /dev/stderr -c "$NGINX_CONF"

exec "$@"
