Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

param(
  [int]$OrderReplicas = 3,
  [int]$PaymentReplicas = 3
)

Write-Host "Scaling order-service to $OrderReplicas replicas and payment-service to $PaymentReplicas replicas..."
docker compose up -d --scale order-service=$OrderReplicas --scale payment-service=$PaymentReplicas
docker compose ps order-service payment-service

