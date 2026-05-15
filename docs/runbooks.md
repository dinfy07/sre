# Runbooks

## Service Restart

Docker Compose:

```powershell
docker compose restart order-service
docker compose ps order-service
```

Kubernetes:

```powershell
kubectl -n endterm rollout restart deployment/order-service
kubectl -n endterm rollout status deployment/order-service
```

## PostgreSQL Replica Failure

1. Confirm primary is healthy.
2. Confirm at least one replica remains healthy.
3. Restart or recreate the failed replica.
4. Check Prometheus/Grafana for replication and availability signals.

## PostgreSQL Primary Failure

This project documents manual promotion in `database/scripts/failover.md`. Production should use Patroni, CloudNativePG, repmgr, or managed database failover.

