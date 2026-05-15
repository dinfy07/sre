Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$container = docker compose ps -q order-service | Select-Object -First 1
if (-not $container) {
  throw "No order-service container found. Start the platform first."
}

Write-Host "Killing one order-service container: $container"
docker kill $container
Write-Host "Waiting for restart policy / replica recovery..."
Start-Sleep -Seconds 10
docker compose ps order-service

