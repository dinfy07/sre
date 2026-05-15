# Docker Swarm Deployment

Build local images first:

```powershell
docker compose build
docker swarm init
docker stack deploy -c docker/docker-stack.yml endterm
docker stack services endterm
```

Scale:

```powershell
docker service scale endterm_order-service=5
docker service scale endterm_payment-service=5
```

Rollback:

```powershell
docker service rollback endterm_order-service
```

