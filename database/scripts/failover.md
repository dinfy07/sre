# PostgreSQL Failover Runbook

This local project uses one PostgreSQL primary and two streaming replicas.

## Manual promotion concept

1. Confirm the primary is unavailable.
2. Select the healthiest replica with the lowest replication lag.
3. Promote the selected replica.
4. Repoint service configuration from `postgres-primary` to the promoted node.
5. Rebuild the failed old primary as a new replica.

For production, use a PostgreSQL operator or a failover manager such as Patroni, CloudNativePG, or repmgr.

