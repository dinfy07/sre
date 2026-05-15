#!/bin/sh
set -eu

echo "Replica container is configured through Bitnami POSTGRESQL_REPLICATION_MODE=slave."
exec /opt/bitnami/scripts/postgresql/entrypoint.sh /opt/bitnami/scripts/postgresql/run.sh

