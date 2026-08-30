# Security Misconfiguration Checker for OVDS (Windows)
# Checks for common security misconfigurations in the application
#
# Usage:
#   .\scripts\check-security-config.ps1 -TargetUrl "http://localhost:3000"

param(
    [Parameter(Mandatory=$false)]
    [string]$TargetUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

$apiUrl = $TargetUrl -replace 'http://localhost:3000', 'http://localhost:3001/api'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Security Misconfiguration Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: $TargetUrl"
Write-Host ""

$issues = 0
$warnings = 0

function Test-Issue {
    param(
        [string]$Name,
        [string]$Severity,
        [bool]$Result
    )
    
    if (-not $Result) {
        Write-Host "[$Severity] $Name" -ForegroundColor Red
        if ($Severity -in @("HIGH", "CRITICAL")) {
            $script:issues++
        } else {
            $script:warnings++
        }
    } else {
        Write-Host "[PASS] $Name" -ForegroundColor Green
    }
}

# Check security headers
Write-Host "--- Security Headers ---"
try {
    $headers = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 5 -Method Head
    $headerString = $headers.Headers | Out-String
} catch {
    $headerString = ""
}

Test-Issue -Name "Content-Security-Policy" -Severity "HIGH" -Result ($headerString -match 'content-security-policy')
Test-Issue -Name "X-Content-Type-Options" -Severity "MEDIUM" -Result ($headerString -match 'x-content-type-options')
Test-Issue -Name "X-Frame-Options" -Severity "HIGH" -Result ($headerString -match 'x-frame-options')
Test-Issue -Name "Strict-Transport-Security" -Severity "HIGH" -Result ($headerString -match 'strict-transport-security')
Test-Issue -Name "Referrer-Policy" -Severity "LOW" -Result ($headerString -match 'referrer-policy')
Test-Issue -Name "Permissions-Policy" -Severity "LOW" -Result ($headerString -match 'permissions-policy')

# Check CORS
Write-Host ""
Write-Host "--- CORS Configuration ---"
try {
    $corsHeaders = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 5 -Method Head -Headers @{Origin = "https://evil.com"}
    $corsString = $corsHeaders.Headers | Out-String
} catch {
    $corsString = ""
}

Test-Issue -Name "CORS wildcard origin" -Severity "HIGH" -Result (-not ($corsString -match 'access-control-allow-origin: \*'))
Test-Issue -Name "CORS credentials with wildcard" -Severity "HIGH" -Result (-not (($corsString -match 'access-control-allow-credentials: true') -and ($corsString -match 'access-control-allow-origin: \*')))

# Check cookie security
Write-Host ""
Write-Host "--- Cookie Security ---"
try {
    $cookieResponse = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 5 -SessionVariable "testSession"
    $cookieString = $testSession.Headers | Out-String
} catch {
    $cookieString = ""
}

# Note: This is a simplified check - actual cookie flags would need deeper inspection
Test-Issue -Name "Cookie security flags" -Severity "MEDIUM" -Result ($cookieString -match 'Secure|HttpOnly|SameSite')

# Check information disclosure
Write-Host ""
Write-Host "--- Information Disclosure ---"

Test-Issue -Name "Server version disclosure" -Severity "LOW" -Result (-not (($headerString -match 'server:') -and ($headerString -match 'nginx|apache|express')))
Test-Issue -Name "X-Powered-By header" -Severity "LOW" -Result (-not ($headerString -match 'x-powered-by'))

# Check error handling
Write-Host ""
Write-Host "--- Error Handling ---"
try {
    $errorResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method Post -ContentType "application/json" -Body '{"invalid": "data"}' -TimeoutSec 5
    $errorString = $errorResponse | Out-String
} catch {
    $errorString = $_.Exception.Message
}

Test-Issue -Name "Stack trace in error response" -Severity "HIGH" -Result (-not ($errorString -match 'stack trace|at |Error:'))
Test-Issue -Name "Database error in response" -Severity "HIGH" -Result (-not ($errorString -match 'mysql|postgresql|sqlite|database'))
Test-Issue -Name "Internal path in response" -Severity "MEDIUM" -Result (-not ($errorString -match '/home/|/var/www/|/usr/src/'))

# Check authentication
Write-Host ""
Write-Host "--- Authentication ---"
try {
    $rateLimitHeaders = Invoke-WebRequest -Uri "$apiUrl/auth/login" -UseBasicParsing -TimeoutSec 5 -Method Head
    $rateLimitString = $rateLimitHeaders.Headers | Out-String
} catch {
    $rateLimitString = ""
}

Test-Issue -Name "Login endpoint without rate limiting" -Severity "HIGH" -Result ($rateLimitString -match 'retry-after|x-ratelimit')

# Check HTTPS
Write-Host ""
Write-Host "--- Transport Security ---"
Test-Issue -Name "HTTP instead of HTTPS" -Severity "HIGH" -Result (-not ($TargetUrl -match '^http://'))

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Security Configuration Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Critical Issues: 0"
Write-Host "High Issues:     $issues"
Write-Host "Warnings:        $warnings"
Write-Host ""

if ($issues -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ No security misconfigurations found" -ForegroundColor Green
    exit 0
} elseif ($issues -eq 0) {
    Write-Host "⚠️  $warnings warnings found - review recommended" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ $issues high/critical issues found - immediate attention required" -ForegroundColor Red
    exit 1
}
