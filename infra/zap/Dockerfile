FROM ghcr.io/zaproxy/zaproxy:stable

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl wget jq python3 \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /zap/wrk/.zap/contexts \
             /zap/wrk/.zap/policies \
             /zap/wrk/.zap/users \
             /zap/wrk/.zap/scripts \
             /zap/wrk/.zap/automation \
             /zap/wrk/reports

COPY .zap/ /zap/wrk/.zap/
COPY scripts/zap-*.ps1 /zap/scripts/
COPY scripts/zap-init-session.sh /zap/scripts/
COPY infra/zap/entrypoint.sh /zap/entrypoint.sh

RUN chmod +x /zap/entrypoint.sh /zap/scripts/zap-init-session.sh

USER zap
WORKDIR /zap/wrk

EXPOSE 8080 8090

ENTRYPOINT ["/zap/entrypoint.sh"]
