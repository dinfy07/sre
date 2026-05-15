# Kubernetes Deployment

Apply manifests recursively:

```powershell
kubectl apply -R -f kubernetes
kubectl -n endterm get pods,svc,hpa
```

Watch rollouts:

```powershell
kubectl -n endterm rollout status deployment/frontend
kubectl -n endterm rollout status deployment/api-gateway
kubectl -n endterm rollout status deployment/order-service
kubectl -n endterm rollout status deployment/payment-service
```

Scaling is defined through `kubernetes/hpa/order-service-hpa.yaml` and `kubernetes/hpa/payment-service-hpa.yaml`. The cluster must have metrics-server installed for HPA CPU/RAM metrics.

