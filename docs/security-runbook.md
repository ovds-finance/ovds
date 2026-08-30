# OVDS Security Runbook

## Overview

This runbook provides step-by-step procedures for common security operations in the OVDS application.

## 1. Daily Security Checks

### 1.1 Review Security Logs

```bash
# Check application logs for suspicious activity
bash scripts/audit-log-review.sh

# Check for failed login attempts
grep -c "login failed" logs/app.log

# Check for unauthorized access
grep -c "unauthorized" logs/app.log
```

### 1.2 Verify Security Scans

```bash
# Run ZAP baseline scan
npm run security:zap:baseline

# Review scan results
cat security-reports/zap-report.json
```

### 1.3 Check Dependency Vulnerabilities

```bash
# Run npm audit
npm run security:scan:deps

# Check for outdated packages
npm outdated
```

## 2. Incident Response

### 2.1 Security Alert Response

1. **Acknowledge alert** within 15 minutes
2. **Assess severity** (P1-P4)
3. **Follow escalation matrix** from incident-response-plan.md
4. **Document** all actions taken
5. **Remediate** and verify
6. **Post-mortem** within 48 hours

### 2.2 Common Incidents

#### Failed Login Spike

```bash
# Check rate limiting logs
grep "too many requests" logs/app.log | tail -20

# Identify source IPs
grep "login failed" logs/app.log | awk '{print $NF}' | sort | uniq -c | sort -nr

# Block IP if needed (iptables/cloud firewall)
# Document in incident log
```

#### Data Breach

1. **Isolate** affected systems
2. **Preserve** evidence (logs, database snapshots)
3. **Notify** security team immediately
4. **Assess** scope of data exposure
5. **Notify** affected users within 72 hours
6. **Report** to regulators as required

#### Malware Detection

1. **Isolate** infected systems
2. **Scan** with antivirus
3. **Remove** malicious files
4. **Rotate** all credentials
5. **Patch** vulnerability
6. **Review** access logs

## 3. User Management

### 3.1 Account Lockout

```bash
# Check locked accounts
grep "account locked" logs/app.log | tail -10

# Unlock user account (via admin panel or API)
curl -X POST http://localhost:3001/api/admin/users/{userId}/unlock \
  -H "Authorization: Bearer {admin_token}"
```

### 3.2 Password Reset

```bash
# Generate OTP for password reset
npm run security:zap:seed  # Seeds test users

# Manual reset via database (emergency only)
mysql -u root -p ovds -e "UPDATE user SET password = '{bcrypt_hash}' WHERE email = '{email}'"
```

### 3.3 API Key Rotation

1. **Generate** new API key
2. **Update** client applications
3. **Revoke** old key after grace period
4. **Verify** new key works
5. **Document** rotation in audit log

## 4. System Hardening

### 4.1 Security Headers Verification

```bash
# Check security headers
curl -I https://ovds.com.et/api/health | grep -E "X-Frame-Options|X-Content-Type|Strict-Transport|Content-Security"

# Expected headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: default-src 'self'
```

### 4.2 CORS Configuration Check

```bash
# Test CORS with allowed origin
curl -H "Origin: https://ovds.com.et" https://ovds.com.et/api/health -I | grep -i "access-control"

# Test CORS with disallowed origin (should fail)
curl -H "Origin: https://evil.com" https://ovds.com.et/api/health -I | grep -i "access-control"
```

### 4.3 Rate Limiting Verification

```bash
# Test rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' &
done
wait

# Should see "Too many requests" after threshold
```

## 5. Backup and Recovery

### 5.1 Database Backup

```bash
# Create encrypted backup
bash scripts/backup-db.sh

# Verify backup integrity
bash scripts/verify-backup.sh

# Test restore
bash scripts/restore-db.sh backup_20240101.sql.gz
```

### 5.2 Recovery Procedures

1. **Assess** damage and data loss
2. **Restore** from last known good backup
3. **Verify** data integrity
4. **Rotate** all credentials
5. **Update** security controls
6. **Document** incident

## 6. Compliance Checks

### 6.1 Monthly Security Review

- [ ] Review audit logs for anomalies
- [ ] Verify backup completion and integrity
- [ ] Check dependency vulnerabilities
- [ ] Review access control lists
- [ ] Update security documentation
- [ ] Conduct security awareness reminder

### 6.2 Quarterly Security Assessment

- [ ] Run full ZAP scan
- [ ] Review and update threat model
- [ ] Conduct tabletop exercise
- [ ] Review incident response plan
- [ ] Update security policies
- [ ] Assess compliance with regulations

### 6.3 Annual Security Audit

- [ ] External penetration testing
- [ ] Compliance audit (EIMS, MoR, etc.)
- [ ] Security architecture review
- [ ] Update business continuity plan
- [ ] Board security briefing

## 7. Emergency Procedures

### 7.1 System Compromise

1. **Disconnect** from network (if warranted)
2. **Preserve** evidence
3. **Notify** security team and management
4. **Assess** damage scope
5. **Eradicate** threat
6. **Recover** systems
7. **Document** lessons learned

### 7.2 Data Breach

1. **Contain** the breach
2. **Assess** data exposure
3. **Notify** affected parties (72 hours)
4. **Report** to regulators
5. **Remediate** vulnerabilities
6. **Update** security controls

### 7.3 DDoS Attack

1. **Enable** DDoS protection (cloudflare/nginx)
2. **Block** attacking IPs
3. **Scale** resources if needed
4. **Monitor** traffic patterns
5. **Document** attack vectors

## 8. Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| Security Team | security@ovds.com.et | P1: Immediate |
| DevOps | devops@ovds.com.et | P2: 1 hour |
| Legal | legal@ovds.com.et | P1: Immediate |
| Management | management@ovds.com.et | P2: 1 hour |

## 9. References

- [Incident Response Plan](./incident-response-plan.md)
- [Threat Model](./threat-model.md)
- [Security Compliance Matrix](./security-compliance-matrix.md)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [NIST SP 800-61](https://csrc.nist.gov/publications/detail/sp/800-61/rev-3/final)
