output "monitoring_contract" {
  value = kubernetes_config_map.monitoring_contract.metadata[0].name
}

