FROM alpine:3.24

RUN apk add --no-cache bash curl less ca-certificates git tzdata zip jq \
    nginx curl supervisor certbot-nginx && \
    rm -rf /var/cache/apk/* && mkdir -p /run/nginx /run/netbird-dashboard

STOPSIGNAL SIGINT
EXPOSE 80
EXPOSE 443
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord","-c","/etc/supervisord.conf"]

WORKDIR /usr/share/nginx/html
# copy configuration files
COPY docker/default.conf /etc/nginx/http.d/default.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/snippets/ /etc/nginx/snippets/
COPY docker/init_cert.sh /usr/local/init_cert.sh
COPY docker/gen_runtime_config.sh /usr/local/bin/gen_runtime_config.sh
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/init_cert.sh /usr/local/bin/gen_runtime_config.sh /usr/local/bin/entrypoint.sh && \
    rm /etc/crontabs/root

# configure supervisor
COPY docker/supervisord.conf /etc/supervisord.conf
# copy build files; read-only: deployment config lives in /run/netbird-dashboard
COPY out/ /usr/share/nginx/html/
RUN chmod -R a-w /usr/share/nginx/html
