# Docker Compose Deployment

```powershell
npm install
docker compose build
docker compose up -d
docker compose ps
```

Scale critical services:

```powershell
docker compose up -d --scale order-service=3 --scale payment-service=3
```

Stop:

```powershell
docker compose down
```

