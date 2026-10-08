#!/usr/bin/env bash
set -e
echo "🐳 Bootstrapping Ovds Mesh Stack..."
docker network create ovds-core-mesh || true
docker compose -f docker-compose.cloud.yml up -d cloud-db test-redis
docker compose -f docker-compose.shards.yml up -d shard-node-01 shard-node-02
docker compose -f docker-compose.kafka.yml up -d zookeeper kafka-broker
sleep 10
export DATABASE_URL="postgresql://cloud_user:secure_pwd@localhost:5432/ovds_production"
pnpm exec prisma db push --schema=./packages/database/prisma/schema.base.prisma --accept-data-loss
docker compose -f docker-compose.cloud.yml up -d frontend reverse-proxy
echo "✅ System initialized!"
