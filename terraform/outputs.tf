output "namespace" {
  value       = kubernetes_namespace.endterm.metadata[0].name
  description = "Namespace provisioned for the platform."
}

output "gateway_service_name" {
  value       = "api-gateway"
  description = "Kubernetes Service that exposes the API Gateway on ports 80 and 443."
}

output "frontend_node_port" {
  value       = 30080
  description = "NodePort used by the frontend service in the Kubernetes manifests."
}

output "grafana_node_port" {
  value       = 30300
  description = "NodePort used by Grafana in the Kubernetes manifests."
}

output "postgres_topology" {
  value       = module.database.topology
  description = "PostgreSQL replication topology summary."
}

