// ZAP Configuration Validation Script
// Validates that all ZAP configuration files are properly formatted and complete
//
// Usage:
//   node scripts/validate-zap-config.mjs
//   node scripts/validate-zap-config.mjs --fix

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const zapDir = path.join(rootDir, '.zap');

const checks = [];
let errors = 0;
let warnings = 0;

function check(description, test) {
  const result = test();
  checks.push({ description, ...result });
  if (!result.pass) {
    errors++;
  } else if (result.warning) {
    warnings++;
  }
  return result;
}

// Check directories exist
check('ZAP directory exists', () => ({
  pass: fs.existsSync(zapDir),
  error: 'Missing .zap directory'
}));

check('Contexts directory exists', () => ({
  pass: fs.existsSync(path.join(zapDir, 'contexts')),
  error: 'Missing .zap/contexts directory'
}));

check('Policies directory exists', () => ({
  pass: fs.existsSync(path.join(zapDir, 'policies')),
  error: 'Missing .zap/policies directory'
}));

check('Users directory exists', () => ({
  pass: fs.existsSync(path.join(zapDir, 'users')),
  error: 'Missing .zap/users directory'
}));

check('Automation directory exists', () => ({
  pass: fs.existsSync(path.join(zapDir, 'automation')),
  error: 'Missing .zap/automation directory'
}));

// Check context file
const contextFile = path.join(zapDir, 'contexts', 'ovds.context');
check('Context file exists', () => ({
  pass: fs.existsSync(contextFile),
  error: 'Missing .zap/contexts/ovds.context'
}));

if (fs.existsSync(contextFile)) {
  const contextContent = fs.readFileSync(contextFile, 'utf8');
  
  check('Context has include rules', () => ({
    pass: contextContent.includes('<include>'),
    error: 'Context missing include rules'
  }));

  check('Context has exclude rules', () => ({
    pass: contextContent.includes('<exclude>'),
    warning: 'Consider adding exclude rules for dangerous endpoints'
  }));

  check('Context has authentication', () => ({
    pass: contextContent.includes('<authentication'),
    error: 'Context missing authentication configuration'
  }));

  check('Context has test users', () => ({
    pass: contextContent.includes('<user name="normal_user"') && contextContent.includes('<user name="admin_user"'),
    error: 'Context missing test users'
  }));

  check('Context has technologies', () => ({
    pass: contextContent.includes('<technology>'),
    warning: 'Consider adding technology tags for better scan rules'
  }));
}

// Check policy file
const policyFile = path.join(zapDir, 'policies', 'ovds-scan.policy');
check('Policy file exists', () => ({
  pass: fs.existsSync(policyFile),
  error: 'Missing .zap/policies/ovds-scan.policy'
}));

if (fs.existsSync(policyFile)) {
  const policyContent = fs.readFileSync(policyFile, 'utf8');
  
  check('Policy has enabled rules', () => ({
    pass: policyContent.includes('<enabledRules>'),
    error: 'Policy missing enabled rules'
  }));

  check('Policy has XSS rules', () => ({
    pass: policyContent.includes('Cross Site Scripting'),
    warning: 'Policy missing XSS scan rules'
  }));

  check('Policy has SQL Injection rules', () => ({
    pass: policyContent.includes('SQL Injection'),
    warning: 'Policy missing SQL Injection scan rules'
  }));

  check('Policy has auth rules', () => ({
    pass: policyContent.includes('Authentication') || policyContent.includes('Session'),
    warning: 'Policy missing authentication/session scan rules'
  }));
}

// Check test users
const usersFile = path.join(zapDir, 'users', 'test-users.json');
check('Test users file exists', () => ({
  pass: fs.existsSync(usersFile),
  error: 'Missing .zap/users/test-users.json'
}));

if (fs.existsSync(usersFile)) {
  try {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    check('Test users has normal_user', () => ({
      pass: users.ovds_test_users?.some(u => u.role === 'normal_user'),
      error: 'Missing normal_user test account'
    }));
    check('Test users has admin_user', () => ({
      pass: users.ovds_test_users?.some(u => u.role === 'admin_user'),
      error: 'Missing admin_user test account'
    }));
    check('Passwords are not default/common', () => {
      const weakPasswords = ['password', '123456', 'admin', 'test'];
      const usersWithWeakPasswords = users.ovds_test_users?.filter(u =>
        weakPasswords.some(p => u.password.toLowerCase().includes(p))
      );
      const weak = usersWithWeakPasswords && usersWithWeakPasswords.length > 0;
      return {
        pass: !weak,
        warning: weak ? 'Test user passwords appear weak - use strong passwords' : undefined
      };
    });
  } catch (e) {
    check('Test users is valid JSON', () => ({
      pass: false,
      error: `Invalid JSON: ${e.message}`
    }));
  }
}

// Check automation configs
const authScanFile = path.join(zapDir, 'automation', 'ovds-authenticated-scan.yaml');
check('Authenticated scan config exists', () => ({
  pass: fs.existsSync(authScanFile),
  error: 'Missing .zap/automation/ovds-authenticated-scan.yaml'
}));

const apiScanFile = path.join(zapDir, 'automation', 'ovds-api-scan.yaml');
check('API scan config exists', () => ({
  pass: fs.existsSync(apiScanFile),
  error: 'Missing .zap/automation/ovds-api-scan.yaml'
}));

// Check scripts exist
const scripts = [
  'zap-baseline.ps1',
  'zap-full-scan.ps1',
  'zap-authenticated-scan.ps1',
  'zap-api-scan.ps1',
  'zap-init-session.sh',
  'security-test-runner.sh',
  'security-test-runner.ps1'
];

for (const script of scripts) {
  const scriptPath = path.join(rootDir, 'scripts', script);
  check(`Script exists: ${script}`, () => ({
    pass: fs.existsSync(scriptPath),
    error: `Missing scripts/${script}`
  }));
}

// Check docker-compose override
const dockerCompose = path.join(rootDir, 'docker-compose.security.yml');
check('Docker compose security override exists', () => ({
  pass: fs.existsSync(dockerCompose),
  error: 'Missing docker-compose.security.yml'
}));

// Check documentation
const docs = [
  'scripts/zap-setup.md',
  'scripts/remediation-register.md',
  'scripts/security-testing-checklist.md'
];

for (const doc of docs) {
  const docPath = path.join(rootDir, doc);
  const exists = fs.existsSync(docPath);
  check(`Documentation exists: ${doc}`, () => ({
    pass: exists,
    warning: exists ? undefined : `Missing ${doc}`,
    error: exists ? undefined : `Missing ${doc}`
  }));
}

// Summary
console.log('\n========================================');
console.log('  ZAP Configuration Validation Results');
console.log('========================================\n');

checks.forEach(c => {
  const isPass = c.pass === true;
  const isWarn = c.pass === true && c.warning;
  const status = isPass ? '✓ ' : (isWarn ? '⚠ ' : '✗ ');
  const color = isPass ? '\x1b[32m' : (isWarn ? '\x1b[33m' : '\x1b[31m');
  const message = isPass ? c.description : (c.error || c.warning || c.description);
  console.log(`${color}${status}${message}\x1b[0m`);
});

console.log('\n----------------------------------------');
console.log(`Total: ${checks.length} checks`);
console.log(`Passed: ${checks.filter(c => c.pass === true && !c.warning).length}`);
console.log(`Warnings: ${warnings}`);
console.log(`Errors: ${errors}`);
console.log('----------------------------------------\n');

if (errors > 0) {
  console.log('Please fix the errors above before running security scans.');
  process.exit(1);
} else if (warnings > 0) {
  console.log(`Configuration is valid (${warnings} advisory suggestions visible above as ⚠).`);
  process.exit(0);
} else {
  console.log('Configuration is complete and valid. Ready for security testing.');
  process.exit(0);
}
