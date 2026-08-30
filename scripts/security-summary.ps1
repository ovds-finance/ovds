# Security Testing Summary Generator (Windows)
# Generates a summary of all security testing activities and results
#
# Usage:
#   .\scripts\security-summary.ps1

param()

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS Security Testing Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ZAP reports exist
$reportsDir = "security-reports"
if (-not (Test-Path $reportsDir)) {
    Write-Host "No security reports found in $reportsDir/"
    Write-Host "Run security scans first:"
    Write-Host "  .\scripts\security-test-runner.ps1 -ScanType all"
    exit 1
}

# Count reports
$baselineReports = (Get-ChildItem -Path $reportsDir -Filter "zap-baseline-*.html" -ErrorAction SilentlyContinue | Measure-Object).Count
$fullReports = (Get-ChildItem -Path $reportsDir -Filter "zap-full-*.html" -ErrorAction SilentlyContinue | Measure-Object).Count
$apiReports = (Get-ChildItem -Path $reportsDir -Filter "zap-api-*.html" -ErrorAction SilentlyContinue | Measure-Object).Count

Write-Host "## Scan Reports"
Write-Host ""
Write-Host "| Type | Count |"
Write-Host "|------|-------|"
Write-Host "| Baseline | $baselineReports |"
Write-Host "| Full | $fullReports |"
Write-Host "| API | $apiReports |"
Write-Host ""

# Check ZAP configuration
Write-Host "## Configuration Status"
Write-Host ""

if (Test-Path ".zap\contexts\ovds.context") {
    Write-Host "✅ ZAP context configured" -ForegroundColor Green
} else {
    Write-Host "❌ ZAP context missing" -ForegroundColor Red
}

if (Test-Path ".zap\policies\ovds-scan.policy") {
    Write-Host "✅ Scan policy configured" -ForegroundColor Green
} else {
    Write-Host "❌ Scan policy missing" -ForegroundColor Red
}

if (Test-Path ".zap\users\test-users.json") {
    Write-Host "✅ Test users configured" -ForegroundColor Green
} else {
    Write-Host "❌ Test users missing" -ForegroundColor Red
}

Write-Host ""

# Check scripts availability
Write-Host "## Available Scripts"
Write-Host ""
Write-Host "| Script | Status |"
Write-Host "|--------|--------|"

$scripts = @(
    @{ Path = "scripts\zap-baseline.ps1"; Name = "Baseline Scan" },
    @{ Path = "scripts\zap-full-scan.ps1"; Name = "Full Scan" },
    @{ Path = "scripts\zap-authenticated-scan.ps1"; Name = "Authenticated Scan" },
    @{ Path = "scripts\zap-api-scan.ps1"; Name = "API Scan" },
    @{ Path = "scripts\security-test-runner.ps1"; Name = "Test Runner" },
    @{ Path = "scripts\validate-zap-config.mjs"; Name = "Config Validator" },
    @{ Path = "scripts\seed-zap-test-users.mjs"; Name = "User Seeder" },
    @{ Path = "scripts\check-app-readiness.ps1"; Name = "Readiness Check" },
    @{ Path = "scripts\check-security-config.ps1"; Name = "Config Checker" },
    @{ Path = "scripts\generate-security-report.ps1"; Name = "Report Generator" }
)

foreach ($script in $scripts) {
    if (Test-Path $script.Path) {
        Write-Host "| $($script.Name) | ✅ Available |"
    } else {
        Write-Host "| $($script.Name) | ❌ Missing |"
    }
}

Write-Host ""

# Check Docker compose
Write-Host "## Docker Compose"
Write-Host ""

if (Test-Path "docker-compose.security.yml") {
    Write-Host "✅ Security testing stack configured" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start:"
    Write-Host "  docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d"
} else {
    Write-Host "❌ docker-compose.security.yml missing" -ForegroundColor Red
}

Write-Host ""

# Check CI/CD
Write-Host "## CI/CD Integration"
Write-Host ""

if (Test-Path ".github\workflows\zap-security-scan.yml") {
    Write-Host "✅ GitHub Actions workflow configured" -ForegroundColor Green
    Write-Host ""
    Write-Host "Triggers:"
    Write-Host "  - Push to main/develop"
    Write-Host "  - Pull requests to main/develop"
    Write-Host "  - Weekly schedule (Monday 2 AM)"
    Write-Host "  - Manual workflow dispatch"
} else {
    Write-Host "❌ GitHub Actions workflow missing" -ForegroundColor Red
}

Write-Host ""

# Recommendations
Write-Host "## Recommendations"
Write-Host ""
Write-Host "1. Run configuration validation:"
Write-Host "   node scripts/validate-zap-config.mjs"
Write-Host ""
Write-Host "2. Seed test users:"
Write-Host "   npm run seed:zap-users"
Write-Host ""
Write-Host "3. Start security testing stack:"
Write-Host "   docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d"
Write-Host ""
Write-Host "4. Run all scans:"
Write-Host "   .\scripts\security-test-runner.ps1 -ScanType all"
Write-Host ""
Write-Host "5. Review reports in: $reportsDir/"
Write-Host ""
Write-Host "6. Check application readiness:"
Write-Host "   .\scripts\check-app-readiness.ps1"
Write-Host ""
Write-Host "7. Check security configuration:"
Write-Host "   .\scripts\check-security-config.ps1"
Write-Host ""

# Security gates
Write-Host "## Security Gates"
Write-Host ""
Write-Host "| Gate | Requirement | Status |"
Write-Host "|------|-------------|--------|"
Write-Host "| 1 | Setup & Authorization | ⏳ Pending |"
Write-Host "| 2 | Build & Deploy | ⏳ Pending |"
Write-Host "| 3 | ZAP Scan | ⏳ Pending |"
Write-Host "| 4 | Retest & Sign-off | ⏳ Pending |"
Write-Host ""
Write-Host "Run scans to complete gates."
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
