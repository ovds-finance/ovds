# ============================================================
# OVDS - HTTPS / Let's Encrypt SSL Setup via win-acme
# Run AFTER setup-xampp-vhost.ps1 and after HTTP is working
# Run as Administrator in PowerShell
# ============================================================

$domain      = "www.ovds.com.et"
$domainAlias = "ovds.com.et"
$docRoot     = "C:\xampp\htdocs\nxfk\public"
$vhostFile   = "C:\xampp\apache\conf\extra\httpd-vhosts.conf"
$httpdConf   = "C:\xampp\apache\conf\httpd.conf"
$wacmsDir    = "C:\win-acme"
$wacmsExe    = "$wacmsDir\wacs.exe"
$certDir     = "C:\xampp\apache\conf\ssl"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS HTTPS / SSL Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Verify HTTP is working first ---
Write-Host "[1] Verifying HTTP is reachable..." -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "http://$domain" -TimeoutSec 10 -UseBasicParsing
    Write-Host "    HTTP $($resp.StatusCode) OK - proceeding with SSL" -ForegroundColor Green
} catch {
    Write-Host "    ERROR: http://$domain is not reachable." -ForegroundColor Red
    Write-Host "    You must complete HTTP setup first:" -ForegroundColor Red
    Write-Host "      1. Run setup-xampp-vhost.ps1" -ForegroundColor Yellow
    Write-Host "      2. Configure router port forwarding (port 80)" -ForegroundColor Yellow
    Write-Host "      3. Set DNS A records to your public IP" -ForegroundColor Yellow
    Write-Host "    Then re-run this script." -ForegroundColor Red
    exit 1
}

# --- 2. Enable SSL module in httpd.conf ---
Write-Host ""
Write-Host "[2] Enabling SSL modules in httpd.conf..." -ForegroundColor Yellow
$conf = Get-Content $httpdConf -Raw

$changed = $false

@(
    '#LoadModule ssl_module',
    '#LoadModule socache_shmcb_module'
) | ForEach-Object {
    $enabled = $_ -replace '#', ''
    if ($conf -match [regex]::Escape($_)) {
        $conf = $conf -replace [regex]::Escape($_), $enabled
        $changed = $true
        Write-Host "    Enabled: $enabled" -ForegroundColor Green
    }
}

if ($conf -notmatch 'Include conf/extra/httpd-ssl.conf') {
    # Already included via ssl module load
}

if ($changed) {
    Set-Content $httpdConf $conf -Encoding UTF8
    Write-Host "    httpd.conf updated" -ForegroundColor Green
} else {
    Write-Host "    SSL modules already enabled" -ForegroundColor Gray
}

# --- 3. Create cert directory ---
Write-Host ""
Write-Host "[3] Creating SSL cert directory..." -ForegroundColor Yellow
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir | Out-Null
    Write-Host "    Created: $certDir" -ForegroundColor Green
} else {
    Write-Host "    Already exists: $certDir" -ForegroundColor Gray
}

# --- 4. Download win-acme if not present ---
Write-Host ""
Write-Host "[4] Checking win-acme (Let's Encrypt client)..." -ForegroundColor Yellow
if (-not (Test-Path $wacmsExe)) {
    Write-Host "    Downloading win-acme..." -ForegroundColor Yellow
    $wacmeUrl = "https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip"
    $zipPath  = "$env:TEMP\win-acme.zip"
    try {
        Invoke-WebRequest -Uri $wacmeUrl -OutFile $zipPath -TimeoutSec 60
        New-Item -ItemType Directory -Path $wacmsDir -Force | Out-Null
        Expand-Archive -Path $zipPath -DestinationPath $wacmsDir -Force
        Remove-Item $zipPath
        Write-Host "    win-acme downloaded to $wacmsDir" -ForegroundColor Green
    } catch {
        Write-Host "    Download failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "    Download manually from: https://www.win-acme.com/" -ForegroundColor Yellow
        Write-Host "    Extract to: $wacmsDir" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "    win-acme already present at $wacmsExe" -ForegroundColor Gray
}

# --- 5. Request certificate ---
Write-Host ""
Write-Host "[5] Requesting SSL certificate from Let's Encrypt..." -ForegroundColor Yellow
Write-Host "    This will place a challenge file in your webroot." -ForegroundColor Gray
Write-Host "    Make sure port 80 is open and DNS is pointing to this machine." -ForegroundColor Gray
Write-Host ""

& $wacmsExe `
    --target manual `
    --host "$domain,$domainAlias" `
    --validation filesystem `
    --webroot "$docRoot" `
    --store pemfiles `
    --pemfilespath "$certDir" `
    --installation none

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "    Certificate request failed. Common causes:" -ForegroundColor Red
    Write-Host "      - DNS not yet pointing to this IP" -ForegroundColor Yellow
    Write-Host "      - Port 80 blocked by router or ISP" -ForegroundColor Yellow
    Write-Host "      - Rate limit hit (5 certs per domain per week)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "    Certificate issued successfully!" -ForegroundColor Green

# --- 6. Write HTTPS virtual host ---
Write-Host ""
Write-Host "[6] Writing HTTPS virtual host config..." -ForegroundColor Yellow

$httpsVhost = @"

# ---- OVDS HTTPS Virtual Host ----
<VirtualHost *:443>
    ServerName $domain
    ServerAlias $domainAlias
    DocumentRoot "$docRoot"

    SSLEngine on
    SSLCertificateFile    "$certDir\$domain-chain.pem"
    SSLCertificateKeyFile "$certDir\$domain-key.pem"

    <Directory "$docRoot">
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Proxy API requests to NestJS backend
    ProxyPreserveHost On
    ProxyPass        /api http://127.0.0.1:3000/api
    ProxyPassReverse /api http://127.0.0.1:3000/api

    # WebSocket proxy for Socket.IO
    ProxyPass        /socket.io ws://127.0.0.1:3000/socket.io
    ProxyPassReverse /socket.io ws://127.0.0.1:3000/socket.io

    ErrorLog  "logs/ovds-ssl-error.log"
    CustomLog "logs/ovds-ssl-access.log" combined
</VirtualHost>

# ---- Redirect HTTP -> HTTPS ----
<VirtualHost *:80>
    ServerName $domain
    ServerAlias $domainAlias
    RewriteEngine On
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>
"@

$existing = Get-Content $vhostFile -Raw -ErrorAction SilentlyContinue
if ($existing -match "443") {
    Write-Host "    HTTPS vhost already exists. Skipping." -ForegroundColor Gray
} else {
    # Replace the existing HTTP vhost block with the HTTPS one
    Add-Content $vhostFile $httpsVhost -Encoding UTF8
    Write-Host "    HTTPS virtual host added" -ForegroundColor Green
}

# --- 7. Enable proxy modules ---
Write-Host ""
Write-Host "[7] Enabling proxy modules for API..." -ForegroundColor Yellow
$conf = Get-Content $httpdConf -Raw
$proxyMods = @(
    '#LoadModule proxy_module',
    '#LoadModule proxy_http_module',
    '#LoadModule proxy_wstunnel_module'
)
$changed = $false
foreach ($mod in $proxyMods) {
    if ($conf -match [regex]::Escape($mod)) {
        $conf = $conf -replace [regex]::Escape($mod), ($mod -replace '#', '')
        $changed = $true
        Write-Host "    Enabled: $($mod -replace '#', '')" -ForegroundColor Green
    }
}
if ($changed) {
    Set-Content $httpdConf $conf -Encoding UTF8
}

# --- 8. Restart Apache ---
Write-Host ""
Write-Host "[8] Restarting Apache..." -ForegroundColor Yellow
& "C:\xampp\apache\bin\httpd.exe" -k restart
Start-Sleep -Seconds 3

$apache = Get-Process -Name "httpd" -ErrorAction SilentlyContinue
if ($apache) {
    Write-Host "    Apache restarted successfully" -ForegroundColor Green
} else {
    Write-Host "    Apache failed to start - check C:\xampp\apache\logs\error.log" -ForegroundColor Red
}

# --- 9. Schedule auto-renewal ---
Write-Host ""
Write-Host "[9] Setting up auto-renewal task..." -ForegroundColor Yellow
$taskName = "OVDS-SSL-Renew"
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $existing) {
    $action  = New-ScheduledTaskAction -Execute $wacmsExe -Argument "--renew --baseuri https://acme-v02.api.letsencrypt.org/"
    $trigger = New-ScheduledTaskTrigger -Daily -At "03:00AM"
    $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 1)
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest | Out-Null
    Write-Host "    Auto-renewal task created (runs daily at 3 AM)" -ForegroundColor Green
} else {
    Write-Host "    Auto-renewal task already exists" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HTTPS Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your site is now available at:" -ForegroundColor White
Write-Host "  https://$domain" -ForegroundColor Green
Write-Host "  https://$domainAlias" -ForegroundColor Green
Write-Host ""
Write-Host "HTTP automatically redirects to HTTPS." -ForegroundColor Gray
Write-Host "Certificate auto-renews daily at 3 AM." -ForegroundColor Gray
Write-Host ""
