// ZAP Finding Exporter
// Parses a ZAP JSON report and emits Markdown rows matching the
// `scripts/remediation-register.md` template.
// Optionally filters by severity and writes a ready-to-paste row block.
//
// Usage:
//   node scripts/zap-export-findings.mjs --report zap-baseline-report.json
//   node scripts/zap-export-findings.mjs --report zap-report.json --min High --output findings.md
//   node scripts/zap-export-findings.mjs --report zap-report.json --dry-run

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const flag = (name) => {
  const v = args.find((a) => a.startsWith(`--${name}=`));
  return v ? v.split('=').slice(1).join('=') : null;
};

const reportFile = flag('report');
const minSeverity = (flag('min') || 'Informational').toUpperCase();
const outputFile = flag('output');
const dryRun = args.includes('--dry-run');

if (!reportFile) {
  console.error(
    'Usage: node scripts/zap-export-findings.mjs --report <file> [--min Critical|High|Medium|Low|Informational] [--output findings.md] [--dry-run]'
  );
  process.exit(1);
}

const reportPath = path.resolve(rootDir, reportFile);
if (!fs.existsSync(reportPath)) {
  console.error(`Report not found: ${reportPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const severityOrder = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1, INFORMATIONAL: 1 };
const zapRiskToSev = { High: 'HIGH', Medium: 'MEDIUM', Low: 'LOW', Informational: 'INFO' };

const findings = [];
const visit = (node) => {
  if (!node) return;
  if (Array.isArray(node.alerts)) {
    for (const a of node.alerts) {
      findings.push({
        title: a.alert || a.name || 'Unknown',
        severity: zapRiskToSev[(a.riskdesc || '').split(' ')[0] || a.risk] || 'MEDIUM',
        url: a.url || '',
        param: a.param || '',
        evidence: a.evidence || '',
        description: a.desc || a.description || '',
        solution: a.solution || '',
        reference: a.reference || '',
        confidence: a.confidence || '',
        cwe: a.cwe || '',
        wasc: a.wascid || ''
      });
    }
  }
  if (Array.isArray(node.site)) node.site.forEach(visit);
  if (Array.isArray(node)) node.forEach(visit);
};

visit(data);

const minRank = severityOrder[minSeverity] || 1;
const filtered = findings.filter((f) => (severityOrder[f.severity] || 1) >= minRank);

console.log(`Report:      ${reportFile}`);
console.log(`Total:       ${findings.length}`);
console.log(`Filtered:    ${filtered.length} (>= ${minSeverity})`);

if (filtered.length === 0) {
  console.log('No findings to export.');
  process.exit(0);
}

const sevCount = {};
filtered.forEach((f) => (sevCount[f.severity] = (sevCount[f.severity] || 0) + 1));
console.log('By severity:');
Object.entries(sevCount).forEach(([s, n]) => console.log(`  ${s}: ${n}`));
console.log('');

const rows = filtered.map((f, idx) => {
  const id = `ZAP-${String(idx + 1).padStart(3, '0')}`;
  const sanitizedEvidence = (f.evidence || '')
    .replace(/\b(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1<token>')
    .replace(/(password=)[^&\s]*/gi, '$1<redacted>')
    .replace(/(\bsession=)[^;\s]*/gi, '$1<redacted>')
    .slice(0, 200);

  return [
    `### ${id} — ${f.title}`,
    ``,
    `**Severity:** ${f.severity}    **Confidence:** ${f.confidence || '—'}    **CWE:** ${f.cwe || '—'}    **WASC:** ${f.wasc || '—'}`,
    ``,
    `**Affected:** \`${f.url}\`` + (f.param ? `  (parameter: \`${f.param}\`)` : ''),
    ``,
    `**Description:** ${f.description}`,
    ``,
    `**Evidence:** \`${sanitizedEvidence || 'See ZAP report'}\``,
    ``,
    `**Recommendation:** ${f.solution || 'See OWASP guidance for this finding type.'}`,
    ``,
    `**References:** ${f.reference || '—'}`,
    ``,
    `**Owner:** _unassigned_    **Target date:** _TBD_    **Status:** Open    **Retest:** Not retested`,
    ``,
    `---`,
    ``
  ].join('\n');
});

const md = [
  `# ZAP Findings Export`,
  ``,
  `Source: \`${reportFile}\`  |  Filter: >= ${minSeverity}  |  Generated: ${new Date().toISOString()}`,
  ``,
  `Total findings: ${filtered.length}`,
  ``,
  `## Findings`,
  ``,
  rows.join('\n')
].join('\n');

if (dryRun) {
  console.log(md.slice(0, 2000));
  console.log('\n... (truncated, use --output to write full file)');
  process.exit(0);
}

const target = outputFile
  ? path.resolve(rootDir, outputFile)
  : path.join(rootDir, 'security-reports', 'zap-findings.md');

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, md);
console.log(`Wrote ${filtered.length} findings to: ${target}`);