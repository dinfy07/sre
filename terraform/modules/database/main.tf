resource "kubernetes_config_map" "database_topology" {
  metadata {
    name      = "database-topology"
    namespace = var.namespace
  }

  data = {
    engine             = "postgresql"
    primary            = "postgres-primary"
    replicas           = tostring(var.postgres_replica_count)
    replication        = "streaming"
    failover_runbook   = "database/scripts/failover.md"
    persistent_storage = "statefulset-volumeclaimtemplates"
  }
}

