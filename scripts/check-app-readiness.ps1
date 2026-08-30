# Application Readiness Check for Security Testing (Windows)
# Validates that the OVDS application is properly configured for security testing
# Cross-platform counterpart: scripts/check-app-readiness.sh
#
# Usage:
#   .\scripts\check-app-readiness.ps1 -TargetUrl "http://localhost:3000"

param(
    [Parameter(Mandatory=$false)]
    [string]$TargetUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

$apiUrl = $TargetUrl -replace 'http://localhost:3000', 'http://localhost:3001/api'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS Security Testing Readiness Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend: $TargetUrl"
Write-Host "Backend:  $apiUrl"
Write-Host ""

$checksPassed = 0
$checksFailed = 0

function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$Expected
    )
    
    Write-Host -NoNewline "Checking $Name... "
    
    try {
        if (& $Test) {
            Write-Host "✓ PASS" -ForegroundColor Green
            $script:checksPassed++
            return $true
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red
            $script:checksFailed++
            return $false
        }
    } catch {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $script:checksFailed++
        return $false
    }
}

# Frontend checks
Write-Host "--- Frontend ---"

Test-Check -Name "Frontend is running" -Expected "200" -Test {
    try {
        $response = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    } catch { return $false }
}

Test-Check -Name "Frontend returns HTML" -Expected "html" -Test {
    try {
        $response = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 5
        return $response.Content -match '<html'
    } catch { return $false }
}

Test-Check -Name "Frontend has login page" -Expected "login" -Test {
    try {
        $response = Invoke-WebRequest -Uri "$TargetUrl/login" -UseBasicParsing -TimeoutSec 5
        return $response.Content -match 'login'
    } catch { return $false }
}

# Backend checks
Write-Host ""
Write-Host "--- Backend ---"

Test-Check -Name "Backend health endpoint" -Expected "200" -Test {
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/health/live" -Method Get -TimeoutSec 5
        return $true
    } catch { return $false }
}

Test-Check -Name "Backend auth endpoint exists" -Expected "405/404/401" -Test {
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method Get -TimeoutSec 5
        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return $statusCode -in @(405, 404, 401)
    }
}

Test-Check -Name "Backend CORS headers" -Expected "cors" -Test {
    try {
        $response = Invoke-WebRequest -Uri "$apiUrl/health/live" -UseBasicParsing -TimeoutSec 5 -Method Head
        return $response.Headers -match 'access-control'
    } catch { return $false }
}

# Authentication checks
Write-Host ""
Write-Host "--- Authentication ---"

Test-Check -Name "Login endpoint accepts POST" -Expected "email/password" -Test {
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method Post -ContentType "application/json" -Body "{}" -TimeoutSec 5
        return $true
    } catch {
        $errorMessage = $_.Exception.Message
        return $errorMessage -match 'email|password|invalid|401'
    }
}

# API checks
Write-Host ""
Write-Host "--- API ---"

Test-Check -Name "Users endpoint exists" -Expected "200/401/403/404" -Test {
    try {
        $response = Invoke-WebRequest -Uri "$apiUrl/users" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -in @(200, 401, 403, 404)
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return $statusCode -in @(200, 401, 403, 404)
    }
}

Test-Check -Name "Settings endpoint exists" -Expected "200/401/403/404" -Test {
    try {
        $response = Invoke-WebRequest -Uri "$apiUrl/settings" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -in @(200, 401, 403, 404)
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return $statusCode -in @(200, 401, 403, 404)
    }
}

# Security headers checks
Write-Host ""
Write-Host "--- Security Headers ---"

Test-Check -Name "Content-Type header" -Expected "content-type" -Test {
    try {
        $response = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 5 -Method Head
        return $response.Headers -match 'content-type'
    } catch { return $false }
}

Test-Check -Name "Server header present" -Expected "server" -Test {
    try {
        $response = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 5 -Method Head
        return $response.Headers -match 'server'
    } catch { return $false }
}

# Rate limiting checks
Write-Host ""
Write-Host "--- Rate Limiting ---"

Test-Check -Name "Rate limit headers" -Expected "rate limit" -Test {
    try {
        $response = Invoke-WebRequest -Uri "$apiUrl/health/live" -UseBasicParsing -TimeoutSec 5 -Method Head
        return $response.Headers -match 'x-ratelimit|retry-after'
    } catch { return $false }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Readiness Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $checksPassed"
Write-Host "Failed: $checksFailed"
Write-Host ""

if ($checksFailed -eq 0) {
    Write-Host "✅ Application is ready for security testing" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Create test users: npm run seed:zap-users"
    Write-Host "  2. Start ZAP: docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d"
    Write-Host "  3. Run scans: .\scripts\security-test-runner.ps1 -ScanType all"
    exit 0
} else {
    Write-Host "❌ Application is NOT ready for security testing" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the failed checks before proceeding."
    exit 1
}
