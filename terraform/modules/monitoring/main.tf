resource "kubernetes_config_map" "monitoring_contract" {
  metadata {
    name      = "monitoring-contract"
    namespace = var.namespace
  }

  data = {
    prometheus      = "enabled"
    grafana         = "enabled"
    uptime          = "blackbox-exporter"
    cpu_memory      = "cadvisor"
    postgres        = "postgres-exporter"
    gateway         = "nginx-exporter"
    service_metrics = "/metrics"
  }
}

