# 50 — Backup, Disaster Recovery, and Runbooks

## 1. Backup Strategy

### 1.1 Backup Types

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Full database backup | Daily | 30 days | S3 / Glacier |
| WAL archiving | Continuous | 7 days | S3 |
| Configuration backup | On change | 90 days | Git / S3 |
| Media files | Daily | 30 days | S3 / Glacier |

### 1.2 Database Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
S3_BUCKET="s3://vat-saas-backups"

# PostgreSQL backup
pg_dump -U vat -d vat_shared -F c -f "$BACKUP_DIR/vat_shared_$TIMESTAMP.dump"

# Compress
gzip "$BACKUP_DIR/vat_shared_$TIMESTAMP.dump"

# Upload to S3
aws s3 cp "$BACKUP_DIR/vat_shared_$TIMESTAMP.dump.gz" "$S3_BUCKET/database/"

# Cleanup local backups older than 7 days
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +7 -delete

# Cleanup S3 backups older than 30 days
aws s3 ls "$S3_BUCKET/database/" | while read line; do
  createDate=$(echo $line | awk '{print $1 " " $2}')
  createDate=$(date -d "$createDate" +%s)
  olderThan=$(date -d "30 days ago" +%s)
  if [ $createDate -lt $olderThan ]; then
    fileName=$(echo $line | awk '{print $4}')
    aws s3 rm "$S3_BUCKET/database/$fileName"
  fi
done

echo "Backup completed: vat_shared_$TIMESTAMP.dump.gz"
```

### 1.3 WAL Archiving

```sql
-- postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://vat-saas-backups/wal/%f'
archive_timeout = 300
```

## 2. Disaster Recovery Plan

### 2.1 RTO/RPO Targets

| Scenario | RTO | RPO |
|----------|-----|-----|
| Single node failure | 15 min | 0 |
| AZ failure | 1 hour | 5 min |
| Region failure | 4 hours | 1 hour |
| Data corruption | 2 hours | 1 hour |

### 2.2 Recovery Procedures

```bash
# scripts/restore-database.sh
#!/bin/bash
set -e

BACKUP_FILE=$1
TARGET_DB=$2

if [ -z "$BACKUP_FILE" ] || [ -z "$TARGET_DB" ]; then
  echo "Usage: $0 <backup_file> <target_db>"
  exit 1
fi

# Create target database
psql -U postgres -c "CREATE DATABASE $TARGET_DB;"

# Restore backup
pg_restore -U vat -d $TARGET_DB $BACKUP_FILE

# Run migrations
pnpm nx run api:prisma migrate deploy -- --schema=prisma/schema/tenant.prisma

echo "Database restored to $TARGET_DB"
```

### 2.3 Failover Procedure

```
1. Detect primary database failure
2. Promote read replica to primary
3. Update connection strings
4. Restart API pods
5. Verify health checks
6. Notify stakeholders
```

```bash
# Promote read replica
kubectl exec -it postgresql-0 -n vat-saas -- psql -U postgres -c "SELECT pg_promote();"

# Update connection strings
kubectl set env deployment/api DATABASE_URL=postgresql://replica:6432/vat_shared -n vat-saas

# Restart API
kubectl rollout restart deployment/api -n vat-saas
```

## 3. Monitoring and Alerting

### 3.1 Health Check Endpoints

```typescript
// health/health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
    };
  }

  @Get('ready')
  async readiness() {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      queue: await this.checkQueue(),
      storage: await this.checkStorage(),
    };

    const isReady = Object.values(checks).every((c) => c.status === 'up');
    return {
      status: isReady ? 'ready' : 'degraded',
      checks,
    };
  }

  @Get('live')
  async liveness() {
    return { status: 'alive' };
  }
}
```

### 3.2 Monitoring Stack

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail/config.yml:/etc/promtail/config.yml
```

## 4. Runbooks

### 4.1 API Down

```markdown
## API Down Runbook

### Symptoms
- Health check returning 503
- Load balancer reporting unhealthy
- Customer complaints

### Investigation
1. Check pod status: `kubectl get pods -l app=api -n vat-saas`
2. Check pod logs: `kubectl logs -l app=api -n vat-saas --tail=100`
3. Check database connectivity: `kubectl exec -it <pod> -- pg_isready -h postgres`
4. Check Redis connectivity: `kubectl exec -it <pod> -- redis-cli ping`
5. Check resource usage: `kubectl top pods -l app=api -n vat-saas`

### Resolution
1. If database down: Promote read replica
2. If Redis down: Restart Redis or failover
3. If OOM: Increase memory limit
4. If pod crash: Check logs, fix bug, redeploy
5. If deployment issue: Rollback deployment

### Verification
- Health check returns 200
- Pods are ready
- Error rate returns to normal
```

### 4.2 Database Performance Degradation

```markdown
## Database Performance Runbook

### Symptoms
- API latency increasing
- Database CPU > 80%
- Slow query log showing long queries

### Investigation
1. Check active queries: `SELECT * FROM pg_stat_activity WHERE state = 'active';`
2. Check slow queries: `SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;`
3. Check locks: `SELECT * FROM pg_locks WHERE NOT granted;`
4. Check connections: `SELECT count(*) FROM pg_stat_activity;`

### Resolution
1. Kill long-running queries if needed
2. Add missing indexes
3. Optimize slow queries
4. Scale read replicas
5. Enable connection pooling

### Prevention
- Regular index reviews
- Query performance monitoring
- Capacity planning
```

### 4.3 Queue Backlog

```markdown
## Queue Backlog Runbook

### Symptoms
- Jobs waiting in queue
- DLQ size increasing
- Processing delays

### Investigation
1. Check queue depths: `redis-cli LLEN bull:default:waiting`
2. Check worker status: `kubectl get pods -l app=worker -n vat-saas`
3. Check job types: `redis-cli LRANGE bull:default:waiting 0 -1 | jq -r '.name' | sort | uniq -c`
4. Check error rate: `redis-cli LLEN bull:default:failed`

### Resolution
1. Scale workers: `kubectl scale deployment/worker --replicas=10 -n vat-saas`
2. Fix failing jobs if identifiable
3. Retry DLQ jobs if safe
4. Clear queue if non-critical

### Prevention
- Monitor queue depth
- Auto-scaling based on queue length
- Job priority configuration
```

## 5. Backup Verification

```bash
#!/bin/bash
# scripts/verify-backup.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# Create test database
TEST_DB="vat_backup_test_$(date +%s)"
psql -U postgres -c "CREATE DATABASE $TEST_DB;"

# Restore backup
pg_restore -U vat -d $TEST_DB $BACKUP_FILE

# Verify tables
TABLE_COUNT=$(psql -U vat -d $TEST_DB -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$TABLE_COUNT" -lt 10 ]; then
  echo "ERROR: Backup verification failed - only $TABLE_COUNT tables found"
  exit 1
fi

# Verify data
ROW_COUNT=$(psql -U vat -d $TEST_DB -t -c "SELECT count(*) FROM vat_returns;")

echo "Backup verified: $TABLE_COUNT tables, $ROW_COUNT vat_returns"

# Cleanup
psql -U postgres -c "DROP DATABASE $TEST_DB;"
```

## 6. Automated Health Checks

```typescript
// monitoring/health-check.service.ts
@Injectable()
export class HealthCheckService {
  private readonly checks = new Map<string, HealthCheck>();

  registerCheck(name: string, check: HealthCheck): void {
    this.checks.set(name, check);
  }

  async runChecks(): Promise<HealthCheckResult> {
    const results: Record<string, any> = {};

    for (const [name, check] of this.checks) {
      try {
        results[name] = await check.run();
      } catch (error) {
        results[name] = {
          status: 'down',
          error: error.message,
        };
      }
    }

    const isHealthy = Object.values(results).every((r) => r.status === 'up');

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: results,
    };
  }
}
```

## 7. Incident Post-Mortem Template

```markdown
# Incident Post-Mortem: [Title]

## Summary
[Brief description of the incident]

## Timeline
- [Time] - [Event]
- [Time] - [Event]

## Impact
- Duration: [X minutes/hours]
- Users affected: [X]
- Revenue impact: [X]

## Root Cause
[Detailed explanation]

## Resolution
[What was done to fix]

## Action Items
1. [Action] - Owner - Due date
2. [Action] - Owner - Due date

## Lessons Learned
[What we learned]
```

## 8. On-Call Rotation

```yaml
# .pagerduty.yaml
schedules:
  - name: Primary On-Call
    time_zone: America/New_York
    layers:
      - name: Layer 1
        rotation_turn_length_seconds: 604800
        start_time: 2024-01-01T00:00:00Z
        users:
          - user_id: USER1
          - user_id: USER2
          - user_id: USER3

  - name: Secondary On-Call
    time_zone: America/New_York
    layers:
      - name: Layer 1
        rotation_turn_length_seconds: 604800
        start_time: 2024-01-01T00:00:00Z
        users:
          - user_id: USER4
          - user_id: USER5
          - user_id: USER6
```

## 9. Communication Plan

| Incident Level | Notification | Channels |
|---------------|-------------|----------|
| P0 | Immediate | PagerDuty, Slack #incidents, phone |
| P1 | Within 15 min | Slack #incidents, email |
| P2 | Within 1 hour | Slack #incidents |
| P3 | Within 4 hours | Slack #engineering |

## 10. Disaster Recovery Testing

```bash
#!/bin/bash
# scripts/dr-test.sh

echo "Starting DR test..."

# 1. Verify backup exists
LATEST_BACKUP=$(aws s3 ls s3://vat-saas-backups/database/ | sort | tail -n 1 | awk '{print $4}')
echo "Testing backup: $LATEST_BACKUP"

# 2. Download backup
aws s3 cp "s3://vat-saas-backups/database/$LATEST_BACKUP" /tmp/

# 3. Create test database
TEST_DB="dr_test_$(date +%s)"
psql -U postgres -c "CREATE DATABASE $TEST_DB;"

# 4. Restore backup
pg_restore -U vat -d $TEST_DB /tmp/$LATEST_BACKUP

# 5. Run health checks
echo "Running health checks..."
pnpm nx run api:test:e2e -- --env=dr_test

# 6. Cleanup
psql -U postgres -c "DROP DATABASE $TEST_DB;"
rm /tmp/$LATEST_BACKUP

echo "DR test completed successfully"
```
