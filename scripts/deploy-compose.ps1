Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Building Docker Compose images..."
docker compose build

Write-Host "Starting platform..."
docker compose up -d

Write-Host "Current service state:"
docker compose ps

