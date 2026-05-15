Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Building images for Swarm..."
docker compose build

$swarmState = docker info --format '{{.Swarm.LocalNodeState}}'
if ($swarmState -ne "active") {
  Write-Host "Initializing local Docker Swarm..."
  docker swarm init
}

Write-Host "Deploying stack..."
docker stack deploy -c docker/docker-stack.yml endterm
docker stack services endterm

