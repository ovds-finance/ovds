# ZAP Session Initializer for OVDS (Windows / PowerShell)
# Counterpart of scripts/zap-init-session.sh.
#
# Usage:
#   pwsh -File scripts/zap-init-session.ps1 -ZapUrl http://localhost:8080 -ApiKey ovds-zap-secret

param(
    [string]$ZapUrl = "http://localhost:8080",
    [string]$ApiKey = "ovds-zap-secret",
    [string]$Root = ""
)

$ErrorActionPreference = "Stop"

if (-not $Root) {
    $Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
}

$ContextFile = Join-Path $Root ".zap\contexts\ovds.context"
$PolicyFile  = Join-Path $Root ".zap\policies\ovds-scan.policy"
$UsersFile   = Join-Path $Root ".zap\users\test-users.json"

Write-Host "========================================"
Write-Host "  ZAP Session Initializer for OVDS"
Write-Host "========================================"
Write-Host "ZAP URL:    $ZapUrl"
Write-Host "API Key:    $ApiKey"
Write-Host "Root:       $Root"
Write-Host ""

# Verify ZAP reachable
try {
    $resp = Invoke-RestMethod -Uri "$ZapUrl/JSON/core/view/version/?apikey=$ApiKey" -Method Get -TimeoutSec 10
    Write-Host "✓ ZAP is running (version $($resp.version))"
} catch {
    Write-Host "ERROR: ZAP is not reachable at $ZapUrl" -ForegroundColor Red
    exit 1
}

# Import context
if (Test-Path $ContextFile) {
    Write-Host "Importing OVDS context..."
    try {
        Invoke-RestMethod -Uri "$ZapUrl/JSON/context/importContext/?apikey=$ApiKey" `
            -Form @{ contextFile = Get-Item $ContextFile } -Method Post -TimeoutSec 30
    } catch {
        Write-Host "  (context import failed — already present?)"
    }
} else {
    Write-Host "WARN: context file not found: $ContextFile" -ForegroundColor Yellow
}

# Import scan policy
if (Test-Path $PolicyFile) {
    Write-Host "Importing OVDS scan policy..."
    try {
        Invoke-RestMethod -Uri "$ZapUrl/JSON/action/importScanPolicy/?apikey=$ApiKey" `
            -Form @{ file = Get-Item $PolicyFile } -Method Post -TimeoutSec 30
    } catch {
        Write-Host "  (policy import failed — already present?)"
    }
} else {
    Write-Host "WARN: policy file not found: $PolicyFile" -ForegroundColor Yellow
}

# List contexts and find OVDS
$ctxList = Invoke-RestMethod -Uri "$ZapUrl/JSON/context/action/listContexts/?apikey=$ApiKey" -TimeoutSec 10
$ovdsCtx = $ctxList.contextList | Where-Object { $_.name -eq "OVDS" } | Select-Object -First 1
if ($ovdsCtx) {
    Write-Host "✓ Context OVDS imported (id=$($ovdsCtx.id))"

    # Import test users
    if (Test-Path $UsersFile) {
        Write-Host "Importing test users..."
        $users = Get-Content -LiteralPath $UsersFile -Raw | ConvertFrom-Json
        foreach ($u in $users.ovds_test_users) {
            try {
                Invoke-RestMethod -Uri "$ZapUrl/JSON/users/action/addUser/?apikey=$ApiKey" `
                    -Method Post -Body @{
                        contextId = $ovdsCtx.id
                        name      = $u.role
                        username  = $u.email
                        password  = $u.password
                    } -TimeoutSec 10
                Write-Host "  + user $($u.role) ($($u.email))"
            } catch {
                Write-Host "  - $($u.role): $($_.Exception.Message)"
            }
        }
    }

    # Set as default in-scope context
    try {
        Invoke-RestMethod -Uri "$ZapUrl/JSON/context/action/setDefaultContextInScope/?apikey=$ApiKey" `
            -Method Post -Body @{ contextName = "OVDS" } -TimeoutSec 10
        Write-Host "✓ OVDS is the default in-scope context"
    } catch { }
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Session Initialized"
Write-Host "========================================"
Write-Host "Context:    OVDS"
Write-Host "Policy:     OVDS Scan Policy"
Write-Host "Users:      normal_user, admin_user, supervisor_user, disabled_user"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Open ZAP Desktop at $ZapUrl (or attach via API)"
Write-Host "  2. Start manual exploration through the proxy"
Write-Host "  3. Run spider with authenticated users"
Write-Host "  4. Start active scan from the context menu"