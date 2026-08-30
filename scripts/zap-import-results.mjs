// ZAP Scan Results Importer for OVDS
// Parses ZAP HTML/JSON reports and imports findings into the OVDS Security Assessment module
//
// Usage:
//   node scripts/zap-import-results.mjs --report zap-baseline-report.json --assessment-id <id>
//   node scripts/zap-import-results.mjs --report zap-authenticated-report.html --api-url http://localhost:3001/api --token <jwt>

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const reportFile = args.find(a => a.startsWith('--report='))?.split('=')[1];
const apiUrl = args.find(a => a.startsWith('--api-url='))?.split('=')[1] || 'http://localhost:3001/api';
const assessmentId = args.find(a => a.startsWith('--assessment-id='))?.split('=')[1];
const token = args.find(a => a.startsWith('--token='))?.split('=')[1];
const dryRun = args.includes('--dry-run');
const batchSize = parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '10');

if (!reportFile) {
  console.error('Usage: node scripts/zap-import-results.mjs --report <file> [--api-url <url>] [--assessment-id <id>] [--token <jwt>] [--dry-run] [--batch-size <size>]');
  process.exit(1);
}

const reportPath = path.resolve(rootDir, reportFile);
if (!fs.existsSync(reportPath)) {
  console.error(`Report file not found: ${reportPath}`);
  process.exit(1);
}

const reportContent = fs.readFileSync(reportPath, 'utf8');

// Severity mapping
const severityMap = {
  'High': 'HIGH',
  'Medium': 'MEDIUM',
  'Low': 'LOW',
  'Informational': 'INFO',
  'Critical': 'CRITICAL'
};

// Category mapping based on ZAP alert names
function mapCategory(alertName) {
  const lower = alertName.toLowerCase();
  if (lower.includes('xss') || lower.includes('cross site scripting')) return 'INJECTION';
  if (lower.includes('sql injection')) return 'INJECTION';
  if (lower.includes('injection')) return 'INJECTION';
  if (lower.includes('authentication') || lower.includes('session')) return 'AUTHENTICATION';
  if (lower.includes('csrf') || lower.includes('request forgery')) return 'CSRF';
  if (lower.includes('cookie') || lower.includes('session')) return 'SESSION_MANAGEMENT';
  if (lower.includes('header') || lower.includes('csp') || lower.includes('content security')) return 'SECURITY_HEADERS';
  if (lower.includes('information disclosure') || lower.includes('debug')) return 'INFORMATION_DISCLOSURE';
  if (lower.includes('path traversal') || lower.includes('directory traversal')) return 'PATH_TRAVERSAL';
  if (lower.includes('file upload')) return 'FILE_UPLOAD';
  if (lower.includes('redirect') || lower.includes('open redirect')) return 'OPEN_REDIRECT';
  if (lower.includes('xxe') || lower.includes('xml external')) return 'XXE';
  if (lower.includes('ssrf') || lower.includes('server side request')) return 'SSRF';
  if (lower.includes('cors')) return 'CORS';
  if (lower.includes('jwt')) return 'JWT';
  if (lower.includes('rate limit') || lower.includes('brute')) return 'RATE_LIMITING';
  return 'OTHER';
}

// Parse JSON report
function parseJsonReport(content) {
  try {
    const data = JSON.parse(content);
    const findings = [];
    
    // ZAP JSON report format
    if (data.site && Array.isArray(data.site)) {
      for (const site of data.site) {
        if (site.alerts && Array.isArray(site.alerts)) {
          for (const alert of site.alerts) {
            findings.push({
              title: alert.alert || alert.name || 'Unknown Alert',
              severity: severityMap[alert.risk] || 'MEDIUM',
              category: mapCategory(alert.alert || alert.name || ''),
              url: alert.url || '',
              param: alert.param || '',
              attack: alert.attack || '',
              evidence: alert.evidence || '',
              description: alert.description || alert.alert || '',
              solution: alert.solution || '',
              reference: alert.reference || '',
              source: 'ZAP',
              status: 'OPEN'
            });
          }
        }
      }
    }
    
    // Alternative JSON format
    if (data.alerts && Array.isArray(data.alerts)) {
      for (const alert of data.alerts) {
        findings.push({
          title: alert.alert || alert.name || 'Unknown Alert',
          severity: severityMap[alert.risk] || 'MEDIUM',
          category: mapCategory(alert.alert || alert.name || ''),
          url: alert.url || '',
          param: alert.param || '',
          attack: alert.attack || '',
          evidence: alert.evidence || '',
          description: alert.description || alert.alert || '',
          solution: alert.solution || '',
          reference: alert.reference || '',
          source: 'ZAP',
          status: 'OPEN'
        });
      }
    }
    
    return findings;
  } catch (e) {
    console.error(`Failed to parse JSON report: ${e.message}`);
    return [];
  }
}

// Parse HTML report (basic extraction)
function parseHtmlReport(content) {
  const findings = [];
  
  // Extract alert tables from HTML
  const alertRegex = /<tr[^>]*>\s*<td[^>]*>\s*<span[^>]*class="[^"]*risk-[^"]*"[^>]*>([^<]+)<\/span>\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/gi;
  
  let match;
  while ((match = alertRegex.exec(content)) !== null) {
    const severity = match[1].trim();
    const title = match[2].trim();
    
    if (severity && title && severity !== 'Risk') {
      findings.push({
        title: title,
        severity: severityMap[severity] || 'MEDIUM',
        category: mapCategory(title),
        url: '',
        param: '',
        attack: '',
        evidence: '',
        description: title,
        solution: '',
        reference: '',
        source: 'ZAP',
        status: 'OPEN'
      });
    }
  }
  
  return findings;
}

// Parse report based on format
let findings = [];
if (reportFile.endsWith('.json')) {
  findings = parseJsonReport(reportContent);
} else if (reportFile.endsWith('.html')) {
  findings = parseHtmlReport(reportContent);
} else {
  // Try JSON first, fallback to HTML
  findings = parseJsonReport(reportContent);
  if (findings.length === 0) {
    findings = parseHtmlReport(reportContent);
  }
}

console.log('========================================');
console.log('  ZAP Report Parser');
console.log('========================================\n');
console.log(`Report: ${reportFile}`);
console.log(`Format: ${reportFile.endsWith('.json') ? 'JSON' : 'HTML'}`);
console.log(`Findings found: ${findings.length}\n`);

if (findings.length === 0) {
  console.log('No findings parsed from report. The report may use a different format.');
  console.log('You can manually import findings using the Security Assessment module UI.');
  process.exit(0);
}

// Group by severity
const bySeverity = {};
for (const finding of findings) {
  bySeverity[finding.severity] = (bySeverity[finding.severity] || 0) + 1;
}

console.log('Findings by severity:');
Object.entries(bySeverity).forEach(([sev, count]) => {
  console.log(`  ${sev}: ${count}`);
});
console.log('');

if (dryRun) {
  console.log('Dry run mode - showing first 5 findings:\n');
  findings.slice(0, 5).forEach((f, i) => {
    console.log(`[${i + 1}] ${f.severity} - ${f.title}`);
    console.log(`    Category: ${f.category}`);
    console.log(`    URL: ${f.url}`);
    console.log('');
  });
  process.exit(0);
}

// Import findings via API
if (!assessmentId) {
  console.log('No assessment ID provided. Use --assessment-id to import into a specific assessment.');
  console.log('Alternatively, use the Security Assessment module UI to manually import findings.');
  process.exit(1);
}

const importUrl = `${apiUrl}/security-assessment/findings`;
let imported = 0;
let failed = 0;

async function importFinding(finding) {
  const payload = {
    ...finding,
    assessmentId
  };
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(importUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  return await response.json();
}

async function importBatch(batch) {
  const results = [];
  for (const finding of batch) {
    try {
      const result = await importFinding(finding);
      console.log(`  ✓ Imported: ${finding.severity} - ${finding.title.substring(0, 60)}...`);
      results.push({ success: true, finding, result });
    } catch (e) {
      console.error(`  ✗ Failed: ${finding.severity} - ${finding.title.substring(0, 60)}... - ${e.message}`);
      results.push({ success: false, finding, error: e.message });
    }
  }
  return results;
}

async function main() {
  console.log(`\nImporting ${findings.length} findings to assessment ${assessmentId}...`);
  console.log(`Batch size: ${batchSize}\n`);
  
  // Process in batches
  for (let i = 0; i < findings.length; i += batchSize) {
    const batch = findings.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(findings.length / batchSize);
    
    console.log(`Processing batch ${batchNum}/${totalBatches}...`);
    const results = await importBatch(batch);
    
    imported += results.filter(r => r.success).length;
    failed += results.filter(r => !r.success).length;
    
    // Small delay between batches
    if (i + batchSize < findings.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n========================================');
  console.log('  Import Complete');
  console.log('========================================');
  console.log(`Total:    ${findings.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Failed:   ${failed}`);
  console.log(`\nAPI Endpoint: ${importUrl}`);
  
  if (failed > 0) {
    console.log('\nSome findings failed to import. Check the errors above.');
    console.log('You may need to:');
    console.log('  1. Verify the API endpoint is correct');
    console.log('  2. Check authentication token');
    console.log('  3. Verify assessment ID exists');
    console.log('  4. Check API permissions');
    process.exit(1);
  }
}

main().catch(e => {
  console.error(`\nFatal error: ${e.message}`);
  process.exit(1);
});
