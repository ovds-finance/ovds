# Seed Test Users for ZAP Security Scanning
# Creates dedicated test accounts via the OVDS API for security testing
#
# Usage:
#   node scripts/seed-zap-test-users.mjs --api-url http://localhost:3001/api --admin-token <jwt>
#
# Prerequisites:
#   - OVDS backend running
#   - Admin JWT token for creating users

import https from 'https';
import http from 'http';

const args = process.argv.slice(2);
const apiUrl = args.find(a => a.startsWith('--api-url='))?.split('=')[1] || 'http://localhost:3001/api';
const adminToken = args.find(a => a.startsWith('--admin-token='))?.split('=')[1];

if (!adminToken) {
  console.error('Usage: node scripts/seed-zap-test-users.mjs --api-url <url> --admin-token <jwt>');
  process.exit(1);
}

const testUsers = [
  {
    email: 'scanner.user@ovds.local',
    username: 'zap-scanner-user',
    password: 'ZapScan#2024!Strong',
    role: 'EMPLOYEE'
  },
  {
    email: 'scanner.admin@ovds.local',
    username: 'zap-scanner-admin',
    password: 'ZapRoot#2024!Secure',
    role: 'ADMIN'
  },
  {
    email: 'scanner.supervisor@ovds.local',
    username: 'zap-scanner-supervisor',
    password: 'ZapSuper#2024!View',
    role: 'SUPERVISOR'
  },
  {
    email: 'scanner.disabled@ovds.local',
    username: 'zap-scanner-disabled',
    password: 'ZapDisabled#2024!Test',
    role: 'EMPLOYEE'
  }
];

function makeRequest(url, method, body, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function seedUsers() {
  console.log('========================================');
  console.log('  Seeding ZAP Test Users');
  console.log('========================================\n');
  console.log(`API URL: ${apiUrl}`);
  console.log(`Users to create: ${testUsers.length}\n`);

  for (const user of testUsers) {
    try {
      console.log(`Creating user: ${user.email} (${user.role})...`);
      
      const result = await makeRequest(`${apiUrl}/auth/register`, 'POST', user, adminToken);
      
      if (result.status === 201 || result.status === 200) {
        console.log(`  ✓ Created successfully`);
      } else if (result.status === 409) {
        console.log(`  ⚠ Already exists`);
      } else {
        console.log(`  ✗ Failed: ${result.status} - ${JSON.stringify(result.data)}`);
      }
    } catch (e) {
      console.error(`  ✗ Error: ${e.message}`);
    }
  }

  console.log('\n========================================');
  console.log('  Test Users Summary');
  console.log('========================================\n');
  
  testUsers.forEach(u => {
    console.log(`Email:    ${u.email}`);
    console.log(`Username: ${u.username}`);
    console.log(`Password: ${u.password}`);
    console.log(`Role:     ${u.role}`);
    console.log('');
  });

  console.log('Next steps:');
  console.log('  1. Verify users can log in');
  console.log('  2. Update .zap/contexts/ovds.context with user credentials');
  console.log('  3. Update .zap/automation/ovds-authenticated-scan.yaml with user credentials');
  console.log('  4. Run ZAP scans with these accounts');
  console.log('');
  console.log('Note: These accounts are for security testing only. Disable/remove after testing.');
}

seedUsers().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
