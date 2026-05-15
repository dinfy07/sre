output "limit_range" {
  value = kubernetes_limit_range.platform_defaults.metadata[0].name
}

