# Kill Service Simulation

Docker Compose:

```powershell
.\scripts\incident-kill-order.ps1
```

Expected result:

- One order-service container is killed.
- Docker restart policy restores capacity.
- Gateway keeps routing to remaining healthy replicas when scaled.
- Prometheus captures temporary impact and restart evidence.

