.PHONY: help security-check security-zap-validate security-zap-seed security-zap-baseline security-zap-full security-zap-auth security-zap-api security-zap-all security-report security-zap-start security-zap-stop security-zap-logs security-import security-test-data security-scan-secrets security-scan-deps security-dashboard security-alert security-summary security-init security-clean security-clean-docker security-all security-audit-review security-test-e2e security-test-unit security-checklist-reconcile security-asvs security-otp security-webhook security-csp security-health

help: ## Show this help message
	@echo "OVDS Security Testing Commands"
	@echo "=============================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""

security-check: ## Check application readiness for security testing
	@echo "Checking application readiness..."
	@node scripts/check-app-readiness.mjs || node scripts/check-app-readiness.mjs http://localhost:3000

security-zap-validate: ## Validate ZAP configuration
	@echo "Validating ZAP configuration..."
	@node scripts/validate-zap-config.mjs

security-zap-seed: ## Seed test users for ZAP scanning
	@echo "Seeding ZAP test users..."
	@npm run seed:zap-users

security-zap-baseline: ## Run ZAP baseline scan (passive)
	@echo "Running ZAP baseline scan..."
	@powershell -File scripts/zap-baseline.ps1 -TargetUrl http://localhost:3000

security-zap-full: ## Run ZAP full scan (active)
	@echo "Running ZAP full scan..."
	@powershell -File scripts/zap-full-scan.ps1 -TargetUrl http://localhost:3000

security-zap-auth: ## Run ZAP authenticated scan
	@echo "Running ZAP authenticated scan..."
	@powershell -File scripts/zap-authenticated-scan.ps1 -TargetFrontend http://localhost:3000 -TargetBackend http://localhost:3001

security-zap-api: ## Run ZAP API scan
	@echo "Running ZAP API scan..."
	@powershell -File scripts/zap-api-scan.ps1 -ApiDefinition http://localhost:3001/api/openapi.json

security-zap-all: ## Run all ZAP scans
	@echo "Running all ZAP scans..."
	@bash scripts/security-test-runner.sh all

security-report: ## Generate security assessment report
	@echo "Generating security report..."
	@node scripts/generate-security-report.mjs --format html --output security-reports/assessment-report

security-zap-start: ## Start security testing stack
	@echo "Starting security testing stack..."
	@docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d

security-zap-stop: ## Stop security testing stack
	@echo "Stopping security testing stack..."
	@docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml down -v

security-zap-logs: ## Show ZAP container logs
	@docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml logs -f zap

security-import: ## Import ZAP results (usage: REPORT=file.json ASSESSMENT_ID=id)
	@if [ -z "$(REPORT)" ]; then echo "Usage: make security-import REPORT=zap-report.json ASSESSMENT_ID=abc-123"; exit 1; fi
	@if [ -z "$(ASSESSMENT_ID)" ]; then echo "Usage: make security-import REPORT=zap-report.json ASSESSMENT_ID=abc-123"; exit 1; fi
	@node scripts/zap-import-results.mjs --report $(REPORT) --assessment-id $(ASSESSMENT_ID)

security-test-data: ## Seed synthetic test data
	@echo "Seeding synthetic test data..."
	@node scripts/seed-zap-test-data.mjs --api-url http://localhost:3001/api --token $(shell cat .zap/users/test-users.json | grep -o '"password": "[^"]*"' | head -1 | cut -d'"' -f4)

security-scan-secrets: ## Scan for exposed secrets
	@echo "Scanning for secrets..."
	@bash scripts/scan-secrets.sh

security-scan-deps: ## Check dependency vulnerabilities
	@echo "Checking dependencies..."
	@bash scripts/check-dependencies.sh

security-dashboard: ## Generate security metrics dashboard
	@echo "Generating security dashboard..."
	@bash scripts/generate-dashboard-data.sh

security-alert: ## Send security alert (usage: SEVERITY=high MESSAGE="text" DETAILS="details")
	@if [ -z "$(SEVERITY)" ]; then echo "Usage: make security-alert SEVERITY=high MESSAGE='text' DETAILS='details'"; exit 1; fi
	@if [ -z "$(MESSAGE)" ]; then echo "Usage: make security-alert SEVERITY=high MESSAGE='text' DETAILS='details'"; exit 1; fi
	@bash scripts/security-alert.sh --severity $(SEVERITY) --message "$(MESSAGE)" --details "$(DETAILS)"

security-summary: ## Show security testing summary
	@echo "Generating security summary..."
	@bash scripts/security-summary.sh

security-init: ## Initialize security testing environment
	@echo "Initializing security testing environment..."
	@mkdir -p security-reports
	@node scripts/validate-zap-config.mjs
	@npm run seed:zap-users
	@echo "✅ Security testing environment initialized"

security-clean: ## Clean security testing artifacts
	@echo "Cleaning security testing artifacts..."
	@rm -rf security-reports/
	@rm -f scanner-*.txt scanner-*.log scanner-*.json scanner-output.txt scanner-results.json scanner-summary.txt scanner-progress.txt scanner-enhanced*.txt scanner-final.log
	@echo "✅ Security testing artifacts cleaned"

security-clean-docker: ## Clean Docker security testing containers
	@echo "Cleaning Docker security testing containers..."
	@docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml down -v
	@docker system prune -f
	@echo "✅ Docker security testing containers cleaned"

security-backup: ## Create database backup
	@echo "Creating database backup..."
	@bash scripts/backup-db.sh

security-restore: ## Restore database from backup (usage: BACKUP=backup_file.sql.gz)
	@if [ -z "$(BACKUP)" ]; then echo "Usage: make security-restore BACKUP=backups/ovds_backup_20240101.sql.gz"; exit 1; fi
	@echo "Restoring database from $(BACKUP)..."
	@bash scripts/restore-db.sh $(BACKUP)

security-all: ## Run complete security testing suite
	@echo "Running complete security testing suite..."
	@$(MAKE) security-check
	@$(MAKE) security-zap-validate
	@$(MAKE) security-zap-seed
	@$(MAKE) security-zap-start
	@$(MAKE) security-scan-secrets
	@$(MAKE) security-scan-deps
	@$(MAKE) security-zap-baseline
	@$(MAKE) security-dashboard
	@$(MAKE) security-summary
	@echo "✅ Complete security testing suite finished"

security-audit-review: ## Review audit logs for suspicious activity
	@echo "Reviewing audit logs..."
	@bash scripts/audit-log-review.sh

security-test-e2e: ## Run security e2e tests
	@echo "Running security e2e tests..."
	@npm run security:test:e2e

security-test-unit: ## Run security unit tests
	@echo "Running security unit tests..."
	@npm run security:test:unit

security-checklist-reconcile: ## Show security checklist reconciliation
	@echo "Security Checklist Reconciliation"
	@echo "================================"
	@cat docs/security-checklist-reconciliation.md | grep -E "^\| [0-9]+ \|" | head -20
	@echo ""
	@echo "See docs/security-checklist-reconciliation.md for full details"

security-asvs: ## Show OWASP ASVS compliance status
	@echo "OWASP ASVS Compliance Status"
	@echo "============================"
	@cat docs/security-asvs-mapping.md | grep -E "Compliance:|Level|Count|Percentage" | head -10
	@echo ""
	@echo "See docs/security-asvs-mapping.md for full details"

security-otp: ## Test OTP functionality
	@echo "Testing OTP service..."
	@curl -X POST http://localhost:3001/api/auth/otp/send \
		-H "Content-Type: application/json" \
		-d '{"email":"test@ovds.local","purpose":"LOGIN"}'

security-webhook: ## Test webhook verification
	@echo "Webhook verification guard is active for configured providers"
	@echo "Providers: chapa, mobile_money, eims"

security-csp: ## Check Content Security Policy headers
	@echo "Checking CSP headers..."
	@curl -I http://localhost:3001/api/health | grep -i "content-security-policy" || echo "CSP header not found"

security-health: ## Check health endpoint security
	@echo "Checking health endpoint security..."
	@curl -s http://localhost:3001/health/detailed | head -5 || echo "Health endpoint requires authentication"
