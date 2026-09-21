# 47 — Troubleshooting and Operational Runbooks

## 1. Incident Response

### 1.1 Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|---------|
| P0 - Critical | Complete outage | 15 min | API down, database unreachable |
| P1 - High | Major degradation | 1 hour | Submissions failing, integrations down |
| P2 - Medium | Partial degradation | 4 hours | Slow queries, UI bugs |
| P3 - Low | Minor issues | 24 hours | Typo, non-critical bug |

### 1.2 Incident Response Checklist

```
□ Acknowledge alert
□ Assess impact and severity
□ Create incident channel
□ Assign incident commander
□ Begin investigation
□ Implement fix or workaround
□ Verify fix in production
□ Post incident within 24h
```

## 2. Common Issues and Solutions

### 2.1 API Issues

| Issue | Symptoms | Diagnosis | Solution |
|-------|----------|-----------|----------|
| High latency | P95 > 1000ms | Check slow query log, connection pool | Add index, optimize query, scale DB |
| 500 errors | 5xx responses | Check logs, Sentry | Fix bug, rollback if needed |
| 429 errors | Rate limited | Check rate limiter | Increase limits, optimize calls |
| Auth failures | 401/403 | Check JWT, permissions | Verify token, check RBAC |

### 2.2 Database Issues

| Issue | Symptoms | Diagnosis | Solution |
|-------|----------|-----------|----------|
| Connection pool exhausted | Connection refused | Check pool size, long queries | Increase pool, optimize queries |
| Slow queries | High DB time | Check `pg_stat_statements` | Add index, rewrite query |
| Deadlocks | Transaction failures | Check lock waits | Fix transaction order |
| Disk full | Write failures | Check disk usage | Clean up, expand disk |

### 2.3 Queue Issues

| Issue | Symptoms | Diagnosis | Solution |
|-------|----------|-----------|----------|
| Queue backlog | Jobs waiting | Check worker count | Scale workers, fix failures |
| Job failures | DLQ growing | Check logs | Fix bug, increase retries |
| Redis down | Queue unavailable | Check Redis | Restart Redis, failover |
| Memory leak | OOM kills | Check heap | Fix leak, increase memory |

### 2.4 Frontend Issues

| Issue | Symptoms | Diagnosis | Solution |
|-------|----------|-----------|----------|
| Slow load | LCP > 2.5s | Check bundle size | Code split, lazy load |
| Hydration errors | Console warnings | Check SSR mismatch | Fix server/client diff |
| Memory leak | Tab crash | Check heap | Fix unmount, memoize |
| CORS errors | Blocked requests | Check CORS config | Update origin whitelist |

## 3. Diagnostic Commands

```bash
# Check API health
curl http://localhost:3001/health
curl http://localhost:3001/health/ready

# Check database connection
pnpm nx run api:prisma migrate status

# Check queue status
redis-cli LLEN bull:default:waiting
redis-cli LLEN bull:default:active
redis-cli LLEN bull:default:failed

# Check Redis memory
redis-cli INFO memory

# Check PostgreSQL connections
psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'vat_shared';"

# Check slow queries
psql -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker resources
docker stats

# Tail API logs
docker compose logs -f api

# Tail worker logs
docker compose logs -f worker
```

## 4. Recovery Procedures

### 4.1 Database Recovery

```bash
# Restore from backup
docker compose exec postgres psql -U vat -d vat_shared < backups/vat_shared_20240101.sql

# Point-in-time recovery
pg_ctl stop -D /var/lib/postgresql/data
pg_basebackup -D /var/lib/postgresql/data -X stream -P
pg_wal_replay /var/lib/postgresql/data
pg_ctl start -D /var/lib/postgresql/data
```

### 4.2 Queue Recovery

```bash
# Retry failed jobs
redis-cli LRANGE bull:default:failed 0 -1 | while read job; do
  redis-cli LREM bull:default:failed 1 "$job"
  redis-cli LPUSH bull:default:waiting "$job"
done

# Clear queue (use with caution)
redis-cli DEL bull:default:waiting
redis-cli DEL bull:default:active
redis-cli DEL bull:default:completed
```

### 4.3 Application Recovery

```bash
# Rolling restart
kubectl rollout restart deployment/api -n vat-saas
kubectl rollout status deployment/api -n vat-saas

# Scale up
kubectl scale deployment/api --replicas=5 -n vat-saas

# Rollback deployment
kubectl rollout undo deployment/api -n vat-saas
```

## 5. Monitoring Dashboards

### 5.1 Key Metrics to Watch

| Metric | Warning | Critical |
|--------|---------|----------|
| API P95 latency | > 500ms | > 1000ms |
| API error rate | > 1% | > 5% |
| Database connections | > 80% | > 95% |
| Queue backlog | > 1000 | > 5000 |
| Disk usage | > 80% | > 90% |
| Memory usage | > 80% | > 90% |

### 5.2 Alert Rules

```yaml
# prometheus/alerts.yaml
groups:
  - name: vat_saas_alerts
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_request_total{status_code=~"5.."}[5m])) / sum(rate(http_request_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical

      - alert: HighLatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
        for: 5m
        labels:
          severity: warning

      - alert: QueueBacklog
        expr: sum(queue_job_total{status="waiting"}) > 1000
        for: 10m
        labels:
          severity: warning

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
```

## 6. Log Analysis

```bash
# Search logs for errors
kubectl logs -l app=api --tail=1000 | grep ERROR

# Count errors by type
kubectl logs -l app=api --tail=1000 | grep ERROR | awk '{print $NF}' | sort | uniq -c | sort -nr

# Find slow requests
kubectl logs -l app=api --tail=1000 | grep "took.*ms" | sort -t= -k2 -nr | head -20

# Search for specific error
kubectl logs -l app=api --tail=1000 | grep "VatReturnNotFoundException"
```

## 7. Performance Troubleshooting

```bash
# Profile API endpoints
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/v1/vat-returns

# Profile database queries
psql -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Profile frontend bundle
pnpm nx run web:build --analyze

# Check memory usage
node --inspect dist/main.js
# Then use Chrome DevTools
```

## 8. Security Incident Response

```bash
# Check for suspicious logins
psql -c "SELECT * FROM audit_logs WHERE action = 'auth.login' AND ip_address NOT IN (SELECT DISTINCT ip_address FROM audit_logs WHERE action = 'auth.login' AND created_at > NOW() - INTERVAL '30 days') ORDER BY created_at DESC LIMIT 10;"

# Check for privilege escalation
psql -c "SELECT * FROM audit_logs WHERE action LIKE '%permission%' AND changes::text LIKE '%admin%' ORDER BY created_at DESC LIMIT 10;"

# Revoke suspicious sessions
psql -c "DELETE FROM sessions WHERE id = '<session_id>';"
```

## 9. Backup Verification

```bash
# Verify backup integrity
gunzip -c backups/vat_shared_20240101.sql.gz | psql -U vat -d vat_shared_test -c "SELECT count(*) FROM vat_returns;"

# Check backup size
ls -lh backups/

# Test restore procedure
docker compose exec postgres psql -U vat -d vat_shared_test < backups/vat_shared_20240101.sql
```

## 10. Escalation Procedures

| Issue | First Responder | Escalation |
|-------|-----------------|------------|
| API down | On-call engineer | Engineering lead |
| Database down | DBA / On-call | VP Engineering |
| Security incident | Security team | CISO |
| Data loss | DBA / On-call | VP Engineering |
| Integration failure | Integration team | Engineering lead |
