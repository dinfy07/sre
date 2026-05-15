# Rolling Update and Rollback Test

Kubernetes:

```powershell
kubectl -n endterm set image deployment/order-service order-service=endterm/order-service:broken
kubectl -n endterm rollout status deployment/order-service
kubectl -n endterm rollout undo deployment/order-service
```

Expected result:

- Readiness probes block bad pods from serving.
- Rollback restores the previous ReplicaSet.

