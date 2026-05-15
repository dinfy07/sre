# Observability

Prometheus scrapes:

- All Node microservices on `/metrics`
- Blackbox uptime probes on `/health`
- PostgreSQL exporter
- Nginx exporter
- cAdvisor container CPU/RAM metrics

Grafana dashboards are provisioned from `monitoring/grafana/dashboards`.

Core signals:

- Uptime
- Request rate
- Error rate
- CPU
- RAM
- PostgreSQL health
- Container restart behavior

