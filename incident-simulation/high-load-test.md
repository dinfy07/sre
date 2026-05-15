# High Load Test

```powershell
.\scripts\load-test-orders.ps1 -Requests 100
```

Expected result:

- `order-service` request metrics increase.
- Compose scaled replicas share traffic through Nginx/Docker DNS.
- Kubernetes HPA scales order-service when CPU/RAM pressure crosses thresholds.

