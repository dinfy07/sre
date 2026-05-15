# Architecture

The platform is designed as a true microservice deployment with a separate frontend, centralized API Gateway, independently deployable services, replicated PostgreSQL, and a monitoring stack.

```mermaid
flowchart TD
  Client["Client"] --> Frontend["React + Vite frontend"]
  Frontend --> Gateway["Nginx API Gateway"]
  Gateway --> Auth["auth-service"]
  Gateway --> Product["product-service"]
  Gateway --> Order["order-service"]
  Gateway --> Payment["payment-service"]
  Gateway --> Notification["notification-service"]
  Gateway --> Profile["profile-service"]
  Auth --> Primary["PostgreSQL primary"]
  Product --> Primary
  Order --> Primary
  Payment --> Primary
  Notification --> Primary
  Profile --> Primary
  Primary --> Replica1["PostgreSQL replica 1"]
  Primary --> Replica2["PostgreSQL replica 2"]
  Prometheus["Prometheus"] --> Gateway
  Prometheus --> Auth
  Prometheus --> Order
  Grafana["Grafana"] --> Prometheus
```

Availability is handled through service replicas, Docker restart policies, Kubernetes Deployments, readiness probes, liveness probes, rolling updates, and PostgreSQL replicas.

