#requires -version 5.1
<#
  Repair systematic code corruption in apps/ (deleted commas + lowercased
  globals + $2 backreference artifacts). This was a botched regex transform.

  IMPORTANT: Run with -DryRun first to see counts before writing.
  The transforms are ordered by confidence (lowest false-positive risk first).
#>
[CmdletBinding()]
param(
    [switch]$DryRun,
    [string]$Root = 'C:\xampp\htdocs\nx\apps'
)

$ErrorActionPreference = 'Stop'

# Gather target files (exclude node_modules/dist/.nx)
$files = Get-ChildItem -Path $Root -Recurse -File -Include '*.ts','*.tsx' -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\\(node_modules|dist|\.nx|\.cache)\\' }

Write-Host ("Target files: {0}" -f $files.Count)
Write-Host ("Mode: {0}" -f $(if($DryRun){'DRY-RUN (no writes)'}else{'WRITE'}))
Write-Host ""

# Counters per transform
$stats = [ordered]@{
    'L1_lowercased_globals' = 0
    'L2_dollar2_type_params' = 0
    'L3_comma_param_type_to_name' = 0
    'L4_comma_boolean_to_key' = 0
    'L4b_comma_null_to_key' = 0
    'L4c_comma_undefined_to_key' = 0
    'L5_fused_closeparen_call' = 0
    'L6_number_to_Math' = 0
    'files_changed' = 0
}

# ---- Transform L1: lowercased global constructors -> Capitalized ----
# These are NEVER valid as lowercase in TS. Safe to restore.
$l1Rules = @(
    @{ pat = '\bmath\.';   rep = 'Math.'   },
    @{ pat = '\bobject\.'; rep = 'Object.' },
    @{ pat = '\barray\.';  rep = 'Array.'  },
    @{ pat = '\bpromise\.'; rep = 'Promise.' },
    @{ pat = '\bjson\.';   rep = 'JSON.'   },
    @{ pat = '\bdate\.';   rep = 'Date.'   },
    @{ pat = '\bregexp\.'; rep = 'RegExp.' },
    @{ pat = '\berror\.';  rep = 'Error.'  },
    @{ pat = '\bboolean\('; rep = 'Boolean(' },
    @{ pat = '\bnumber\(';  rep = 'Number(' },
    @{ pat = '\bstring\(';  rep = 'String(' }
)

foreach ($f in $files) {
    $orig = [System.IO.File]::ReadAllText($f.FullName)
    $content = $orig
    $changed = $false

    # L1: lowercased globals
    foreach ($r in $l1Rules) {
        $matches = [regex]::Matches($content, $r.pat)
        if ($matches.Count -gt 0) {
            $stats['L1_lowercased_globals'] += $matches.Count
            $content = [regex]::Replace($content, $r.pat, $r.rep)
            $changed = $true
        }
    }

    if ($changed) {
        $stats['files_changed']++
        if (-not $DryRun) {
            [System.IO.File]::WriteAllText($f.FullName, $content, [System.Text.UTF8Encoding]::new($false))
        }
    }
}

Write-Host "=== Stage L1 (lowercased globals) results ==="
foreach ($k in $stats.Keys) { Write-Host ("  {0,-30} {1}" -f $k, $stats[$k]) }
