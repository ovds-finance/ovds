# ============================================================
# OVDS - XAMPP Virtual Host Setup Script
# Run this as Administrator in PowerShell
# ============================================================

$domain      = "www.ovds.com.et"
$domainAlias = "ovds.com.et"
$docRoot     = "C:/xampp/htdocs/nxfk/public"
$vhostFile   = "C:\xampp\apache\conf\extra\httpd-vhosts.conf"
$httpdConf   = "C:\xampp\apache\conf\httpd.conf"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS XAMPP Virtual Host Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Show network info ---
Write-Host "[1] Network Information" -ForegroundColor Yellow
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } | Select-Object -First 1).IPAddress
$publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org?format=text" -TimeoutSec 5) 2>$null
Write-Host "    Local IP  : $localIP"
Write-Host "    Public IP : $publicIP"
Write-Host ""
Write-Host "    --> Point DNS A records for '$domain' and '$domainAlias' to: $publicIP" -ForegroundColor Green
Write-Host "    --> Set router port forwarding: External 80 -> $localIP`:80" -ForegroundColor Green
Write-Host ""

# --- 2. Enable mod_rewrite and vhosts in httpd.conf ---
Write-Host "[2] Checking httpd.conf..." -ForegroundColor Yellow
if (Test-Path $httpdConf) {
    $conf = Get-Content $httpdConf -Raw

    $changed = $false

    if ($conf -match '#LoadModule rewrite_module') {
        $conf = $conf -replace '#LoadModule rewrite_module', 'LoadModule rewrite_module'
        $changed = $true
        Write-Host "    Enabled mod_rewrite" -ForegroundColor Green
    } else {
        Write-Host "    mod_rewrite already enabled" -ForegroundColor Gray
    }

    if ($conf -match '#LoadModule headers_module') {
        $conf = $conf -replace '#LoadModule headers_module', 'LoadModule headers_module'
        $changed = $true
        Write-Host "    Enabled mod_headers" -ForegroundColor Green
    } else {
        Write-Host "    mod_headers already enabled" -ForegroundColor Gray
    }

    if ($conf -match '#LoadModule expires_module') {
        $conf = $conf -replace '#LoadModule expires_module', 'LoadModule expires_module'
        $changed = $true
        Write-Host "    Enabled mod_expires" -ForegroundColor Green
    } else {
        Write-Host "    mod_expires already enabled" -ForegroundColor Gray
    }

    if ($conf -match '#Include conf/extra/httpd-vhosts.conf') {
        $conf = $conf -replace '#Include conf/extra/httpd-vhosts.conf', 'Include conf/extra/httpd-vhosts.conf'
        $changed = $true
        Write-Host "    Enabled vhosts include" -ForegroundColor Green
    } else {
        Write-Host "    vhosts include already enabled" -ForegroundColor Gray
    }

    # Enable proxy modules for API forwarding to NestJS
    @(
        '#LoadModule proxy_module',
        '#LoadModule proxy_http_module',
        '#LoadModule proxy_wstunnel_module'
    ) | ForEach-Object {
        if ($conf -match [regex]::Escape($_)) {
            $conf = $conf -replace [regex]::Escape($_), ($_ -replace '#', '')
            $changed = $true
            Write-Host "    Enabled: $($_ -replace '#', '')" -ForegroundColor Green
        }
    }

    if ($changed) {
        Set-Content $httpdConf $conf -Encoding UTF8
        Write-Host "    httpd.conf updated." -ForegroundColor Green
    }
} else {
    Write-Host "    WARNING: httpd.conf not found at $httpdConf" -ForegroundColor Red
}

Write-Host ""

# --- 3. Write virtual host config ---
Write-Host "[3] Writing virtual host config..." -ForegroundColor Yellow

$vhostBlock = @"

# ---- OVDS Virtual Host ----
<VirtualHost *:80>
    ServerName $domain
    ServerAlias $domainAlias
    DocumentRoot "$docRoot"

    <Directory "$docRoot">
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Proxy /api requests to NestJS backend on port 3000
    ProxyPreserveHost On
    ProxyPass        /api http://127.0.0.1:3000/api
    ProxyPassReverse /api http://127.0.0.1:3000/api

    # WebSocket proxy for Socket.IO real-time features
    ProxyPass        /socket.io ws://127.0.0.1:3000/socket.io
    ProxyPassReverse /socket.io ws://127.0.0.1:3000/socket.io

    ErrorLog "logs/ovds-error.log"
    CustomLog "logs/ovds-access.log" combined
</VirtualHost>
"@

# Check if already exists
$existing = Get-Content $vhostFile -Raw -ErrorAction SilentlyContinue
if ($existing -match "ovds") {
    Write-Host "    Virtual host for OVDS already exists in $vhostFile" -ForegroundColor Gray
    Write-Host "    Skipping to avoid duplicates. Edit manually if needed." -ForegroundColor Gray
} else {
    Add-Content $vhostFile $vhostBlock -Encoding UTF8
    Write-Host "    Virtual host added to $vhostFile" -ForegroundColor Green
}

Write-Host ""

# --- 4. Open Windows Firewall ports ---
Write-Host "[4] Opening Windows Firewall ports 80 and 443..." -ForegroundColor Yellow
$rule80 = Get-NetFirewallRule -DisplayName "XAMPP HTTP" -ErrorAction SilentlyContinue
if (-not $rule80) {
    New-NetFirewallRule -DisplayName "XAMPP HTTP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 | Out-Null
    Write-Host "    Port 80 rule added" -ForegroundColor Green
} else {
    Write-Host "    Port 80 rule already exists" -ForegroundColor Gray
}

$rule443 = Get-NetFirewallRule -DisplayName "XAMPP HTTPS" -ErrorAction SilentlyContinue
if (-not $rule443) {
    New-NetFirewallRule -DisplayName "XAMPP HTTPS" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 443 | Out-Null
    Write-Host "    Port 443 rule added" -ForegroundColor Green
} else {
    Write-Host "    Port 443 rule already exists" -ForegroundColor Gray
}

Write-Host ""

# --- 5. Restart Apache ---
Write-Host "[5] Restarting Apache..." -ForegroundColor Yellow
$apache = Get-Process -Name "httpd" -ErrorAction SilentlyContinue
if ($apache) {
    & "C:\xampp\apache\bin\httpd.exe" -k restart
    Write-Host "    Apache restart signal sent." -ForegroundColor Green
} else {
    Write-Host "    Apache is not running. Start it from XAMPP Control Panel." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Log into your domain registrar and set A records:" -ForegroundColor White
Write-Host "       ovds.com.et     -> $publicIP" -ForegroundColor Yellow
Write-Host "       www.ovds.com.et -> $publicIP" -ForegroundColor Yellow
Write-Host "  2. Log into your router and add port forwarding:" -ForegroundColor White
Write-Host "       External 80  -> $localIP`:80" -ForegroundColor Yellow
Write-Host "       External 443 -> $localIP`:443" -ForegroundColor Yellow
Write-Host "  3. For HTTPS, download win-acme from https://www.win-acme.com/" -ForegroundColor White
Write-Host "       and run: wacs.exe --target manual --host $domain" -ForegroundColor Yellow
Write-Host ""
