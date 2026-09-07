// ZAP Report Diff
// Compares two ZAP JSON reports and prints new / fixed / unchanged findings.
//
// Usage:
//   node scripts/zap-report-diff.mjs --baseline before.json --current after.json
//   node scripts/zap-report-diff.mjs --baseline before.json --current after.json --output diff.md
//   node scripts/zap-report-diff.mjs --baseline before.json --current after.json --fail-on-regression

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
const has = (n) => args.includes(n);

const baselinePath = flag('baseline');
const currentPath = flag('current');
const output = flag('output');
const failOnRegression = flag('fail-on-regression') || 'critical';
const failOnlyOnReg = has('--fail-on-regression') || has('--fail-on-regressions');

if (!baselinePath || !currentPath) {
  console.error(
    'Usage: node scripts/zap-report-diff.mjs --baseline <before.json> --current <after.json> [--output diff.md] [--fail-on-regression critical|high|medium|low]'
  );
  process.exit(1);
}

const severityOrder = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1, INFORMATIONAL: 1 };
const zapRiskToSev = { High: 'HIGH', Medium: 'MEDIUM', Low: 'LOW', Informational: 'INFO' };

function parseFindings(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const findings = new Map();

  const visit = (node) => {
    if (!node) return;
    if (Array.isArray(node.alerts)) {
      for (const a of node.alerts) {
        const sev = zapRiskToSev[(a.riskdesc || '').split(' ')[0] || a.risk] || 'MEDIUM';
        // Fingerprint = title + url + param
        const fp = `${a.alert || a.name}::${a.url || ''}::${a.param || ''}`;
        findings.set(fp, {
          severity: sev,
          title: a.alert || a.name || 'Unknown',
          url: a.url || '',
          param: a.param || '',
          confidence: a.confidence || '',
          cwe: a.cwe || '',
          instances: (findings.get(fp)?.instances || 0) + 1
        });
      }
    }
    if (Array.isArray(node.site)) node.site.forEach(visit);
    if (Array.isArray(node)) node.forEach(visit);
  };

  visit(data);
  return findings;
}

const baseline = parseFindings(path.resolve(rootDir, baselinePath));
const current = parseFindings(path.resolve(rootDir, currentPath));

const newFindings = [];
const fixedFindings = [];
const unchanged = [];

for (const [fp, f] of current) {
  if (!baseline.has(fp)) {
    newFindings.push(f);
  } else {
    unchanged.push(f);
  }
}
for (const [fp, f] of baseline) {
  if (!current.has(fp)) {
    fixedFindings.push(f);
  }
}

const sevCount = (arr) => {
  const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const f of arr) c[f.severity] = (c[f.severity] || 0) + 1;
  return c;
};

const newCount = sevCount(newFindings);
const fixedCount = sevCount(fixedFindings);
const unchangedCount = sevCount(unchanged);

console.log('========================================');
console.log('  ZAP Report Diff');
console.log('========================================');
console.log(`Baseline:  ${baselinePath} (${baseline.size} findings)`);
console.log(`Current:   ${currentPath} (${current.size} findings)`);
console.log('');
console.log('New findings (regressions):');
Object.entries(newCount).forEach(([s, n]) => {
  if (n > 0) console.log(`  ${s}: ${n}`);
});
console.log(`  TOTAL: ${newFindings.length}`);
console.log('');
console.log('Fixed findings:');
Object.entries(fixedCount).forEach(([s, n]) => {
  if (n > 0) console.log(`  ${s}: ${n}`);
});
console.log(`  TOTAL: ${fixedFindings.length}`);
console.log('');
console.log(`Unchanged: ${unchanged.length}`);

// Markdown output
const md = [
  `# ZAP Report Diff`,
  ``,
  `- Baseline: \`${baselinePath}\``,
  `- Current: \`${currentPath}\``,
  ``,
  `## Regressions (NEW findings)`,
  ``,
  `| Severity | Count |`,
  `|----------|------:|`,
  ...Object.entries(newCount).map(([s, n]) => `| ${s} | ${n} |`),
  ``,
  newFindings.length === 0
    ? `_None_`
    : newFindings
      .map(
        (f, i) =>
          `### NEW-${String(i + 1).padStart(3, '0')} — ${f.title}\n**Severity:** ${f.severity}\n**Affected:** \`${f.url}\`${f.param ? ` (param: \`${f.param}\`)` : ''}`
      )
      .join('\n\n'),
  ``,
  `## Fixed findings`,
  ``,
  `| Severity | Count |`,
  `|----------|------:|`,
  ...Object.entries(fixedCount).map(([s, n]) => `| ${s} | ${n} |`),
  ``,
  fixedFindings.length === 0
    ? `_None_`
    : fixedFindings
      .map(
        (f, i) =>
          `### FIXED-${String(i + 1).padStart(3, '0')} — ${f.title}\n**Severity:** ${f.severity}\n**Affected:** \`${f.url}\``
      )
      .join('\n\n')
].join('\n');

if (output) {
  const target = path.resolve(rootDir, output);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, md);
  console.log(`Diff written to: ${target}`);
}

// Fail if new findings exceed threshold
if (failOnlyOnReg) {
  const threshold = severityOrder[failOnRegression.toUpperCase()] || 5;
  const regression = newFindings.filter((f) => (severityOrder[f.severity] || 1) >= threshold);
  if (regression.length > 0) {
    console.log('');
    console.log(`❌ ${regression.length} new findings at >= ${failOnRegression.toUpperCase()}`);
    console.log('Fix these before merging:');
    regression.forEach((f) => console.log(`  - [${f.severity}] ${f.title} (${f.url})`));
    process.exit(1);
  }
}

if (newFindings.length === 0 && fixedFindings.length === 0) {
  console.log('No change between baseline and current.');
}