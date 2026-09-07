// Security Status Snapshot
// Aggregates the latest ZAP findings + Phase 6 manual test results
// into a single `security-reports/status.json` + `status.md` snapshot
// for the status dashboard and CI annotations.
//
// Reads from:
//   - security-reports/zap-baseline-report.json (preferred)
//   - security-reports/zap-full-scan-report.json (fallback)
//   - security-reports/zap-api-report.json
//   - security-reports/*-phase6*.json (if present)
//
// Usage:
//   node scripts/security-status-snapshot.mjs
//   node scripts/security-status-snapshot.mjs --reports-dir security-reports --output security-reports/status.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const flag = (name, def) => {
  const v = args.find((a) => a.startsWith(`--${name}=`));
  return v ? v.split('=').slice(1).join('=') : def;
};

const reportsDir = path.resolve(rootDir, flag('reports-dir', 'security-reports'));
const outJson = path.resolve(rootDir, flag('output', path.join('security-reports', 'status.json')));
const outMd = outJson.replace(/\.json$/, '.md');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const zapRiskToSev = { High: 'HIGH', Medium: 'MEDIUM', Low: 'LOW', Informational: 'INFO' };

function safeRead(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function parseZapJson(content) {
  if (!content) return [];
  try {
    const data = JSON.parse(content);
    const out = [];
    const visit = (node) => {
      if (!node) return;
      if (Array.isArray(node.alerts)) {
        for (const a of node.alerts) {
          out.push({
            severity: zapRiskToSev[(a.riskdesc || '').split(' ')[0] || a.risk] || 'MEDIUM',
            title: a.alert || a.name || 'Unknown',
            url: a.url || '',
            confidence: a.confidence || '',
            riskScore: a.riskScore ?? null,
            source: a.source ?? ''
          });
        }
      }
      if (Array.isArray(node.site)) node.site.forEach(visit);
      if (Array.isArray(node)) node.forEach(visit);
    };
    visit(data);
    return out;
  } catch {
    return [];
  }
}

const zapFiles = [
  { name: 'baseline',     path: path.join(reportsDir, 'zap-baseline-report.json') },
  { name: 'full',         path: path.join(reportsDir, 'zap-full-scan-report.json') },
  { name: 'api',          path: path.join(reportsDir, 'zap-api-report.json') },
  { name: 'authenticated', path: path.join(reportsDir, 'zap-authenticated-report.json') }
];

const phase6Files = fs
  .readdirSync(reportsDir)
  .filter((f) => /phase6|manual-tests?/i.test(f) && f.endsWith('.json'))
  .map((f) => path.join(reportsDir, f));

const scans = {};
for (const z of zapFiles) {
  const content = safeRead(z.path);
  const findings = parseZapJson(content);
  if (findings.length === 0) continue;
  scans[z.name] = { file: path.relative(rootDir, z.path), findings };
}

const manualSuites = [];
for (const p of phase6Files) {
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const suite = data.suite || path.basename(p, '.json');
    const total = data.results?.length ?? 0;
    const passed = data.results?.filter((r) => r.result === 'PASS').length ?? 0;
    const failed = data.results?.filter((r) => r.result === 'FAIL').length ?? 0;
    manualSuites.push({ suite, total, passed, failed, file: path.relative(rootDir, p) });
  } catch { /* skip malformed */ }
}

const aggregate = (findings) => {
  const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const f of findings) c[f.severity] = (c[f.severity] || 0) + 1;
  return c;
};

const summary = {
  generatedAt: new Date().toISOString(),
  reportsDir: path.relative(rootDir, reportsDir),
  zapScans: Object.fromEntries(
    Object.entries(scans).map(([k, v]) => [k, { file: v.file, ...aggregate(v.findings) }])
  ),
  totalZapFindings: Object.values(scans).reduce((s, v) => s + v.findings.length, 0),
  manualSuites
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(summary, null, 2));

const sevBadge = (n, sev) => {
  if (!n) return '`0`';
  const color = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🔵', INFO: '⚪' }[sev];
  return `${color} \`${n}\``;
};

const md = [
  `# Security Assessment Status`,
  ``,
  `_Generated: ${summary.generatedAt}_`,
  ``,
  `## ZAP Automated Scans`,
  ``,
  `| Scan | File | Critical | High | Medium | Low | Info |`,
  `|------|------|---------:|-----:|-------:|----:|-----:|`,
  ...Object.entries(summary.zapScans).map(
    ([name, s]) =>
      `| ${name} | \`${s.file}\` | ${sevBadge(s.CRITICAL, 'CRITICAL')} | ${sevBadge(s.HIGH, 'HIGH')} | ${sevBadge(s.MEDIUM, 'MEDIUM')} | ${sevBadge(s.LOW, 'LOW')} | ${sevBadge(s.INFO, 'INFO')} |`
  ),
  ``,
  `**Total ZAP findings:** ${summary.totalZapFindings}`,
  ``,
  `## Phase 6 Manual Suites`,
  ``,
  `| Suite | File | Total | Passed | Failed |`,
  `|-------|------|------:|------:|------:|`,
  ...manualSuites.map((s) =>
    `| ${s.suite} | \`${s.file}\` | ${s.total} | ${s.passed} | ${s.failed} |`
  ),
  ``,
  `## How to Update`,
  ``,
  `\`\`\`bash`,
  `pwsh scripts/zap-test-manual-all.ps1     # Phase 6 manual tests`,
  `node scripts/zap-export-findings.mjs --report security-reports/zap-baseline-report.json --output security-reports/findings.md`,
  `node scripts/security-status-snapshot.mjs`,
  `\`\`\``
].join('\n');

fs.writeFileSync(outMd, md);

console.log('========================================');
console.log('  Security Status Snapshot');
console.log('========================================');
console.log(`JSON: ${outJson}`);
console.log(`MD:   ${outMd}`);
console.log('');
console.log(`ZAP scans: ${Object.keys(summary.zapScans).length}`);
console.log(`Total ZAP findings: ${summary.totalZapFindings}`);
console.log(`Manual suites: ${manualSuites.length}`);

const criticalOrHigh = Object.values(summary.zapScans).reduce(
  (sum, s) => sum + (s.CRITICAL || 0) + (s.HIGH || 0),
  0
);
console.log(`Critical+High findings across all scans: ${criticalOrHigh}`);