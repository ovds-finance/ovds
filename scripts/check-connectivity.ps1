# ============================================================
# OVDS - Connectivity Check Script
# Run this after setup to verify everything is working
# ============================================================

$domain = "www.ovds.com.et"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS Connectivity Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Public IP
Write-Host "[1] Your public IP:" -ForegroundColor Yellow
try {
    $publicIP = Invoke-RestMethod -Uri "https://api.ipify.org?format=text" -TimeoutSec 5
    Write-Host "    $publicIP" -ForegroundColor Green
} catch {
    Write-Host "    Could not fetch public IP" -ForegroundColor Red
}

# 2. DNS resolution
Write-Host ""
Write-Host "[2] DNS resolution for $domain`:" -ForegroundColor Yellow
try {
    $dns = Resolve-DnsName $domain -ErrorAction Stop
    $dns | ForEach-Object { Write-Host "    $($_.Name) -> $($_.IPAddress)" -ForegroundColor Green }
} catch {
    Write-Host "    DNS not resolving yet (propagation may take up to 48h)" -ForegroundColor Red
}

# 3. Apache running?
Write-Host ""
Write-Host "[3] Apache process:" -ForegroundColor Yellow
$apache = Get-Process -Name "httpd" -ErrorAction SilentlyContinue
if ($apache) {
    Write-Host "    Running (PID: $($apache[0].Id))" -ForegroundColor Green
} else {
    Write-Host "    NOT running - start Apache from XAMPP Control Panel" -ForegroundColor Red
}

# 4. Port 80 listening?
Write-Host ""
Write-Host "[4] Port 80 listening:" -ForegroundColor Yellow
$port80 = netstat -an | Select-String ":80 "
if ($port80) {
    Write-Host "    Port 80 is open" -ForegroundColor Green
} else {
    Write-Host "    Port 80 not listening" -ForegroundColor Red
}

# 5. Local HTTP test
Write-Host ""
Write-Host "[5] Local HTTP test (localhost):" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 5 -UseBasicParsing
    Write-Host "    HTTP $($resp.StatusCode) - Apache is serving" -ForegroundColor Green
} catch {
    Write-Host "    Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Public HTTP test
Write-Host ""
Write-Host "[6] Public HTTP test (http://$domain):" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "http://$domain" -TimeoutSec 10 -UseBasicParsing
    Write-Host "    HTTP $($resp.StatusCode) - Site is publicly accessible!" -ForegroundColor Green
} catch {
    Write-Host "    Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    (Check DNS propagation and router port forwarding)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Check Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
