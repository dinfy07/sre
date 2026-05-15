# SRE Evaluation Checklist

- React + Vite frontend container exists.
- Frontend has `/health`.
- Frontend uses API Gateway only for backend calls.
- Nginx API Gateway exposes `80` and `443`.
- Six independent services exist.
- Every service has `/health`, `/ready`, `/metrics`.
- Every service has a Dockerfile and Docker healthcheck.
- PostgreSQL primary and replicas are defined.
- Docker Compose works.
- Docker Swarm stack exists.
- Kubernetes Deployments and Services exist.
- Kubernetes readiness and liveness probes exist.
- HPA exists for order-service and payment-service.
- Prometheus and Grafana are configured.
- Incident simulations are scripted.
- Terraform and Ansible infrastructure automation exist.

