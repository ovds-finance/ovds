# Seed Synthetic Test Data for ZAP Scanning
# Creates test records across various modules for security scanning
#
# Usage:
#   node scripts/seed-zap-test-data.mjs --api-url http://localhost:3001/api --token <jwt>

const args = process.argv.slice(2);
const apiUrl = args.find(a => a.startsWith('--api-url='))?.split('=')[1] || 'http://localhost:3001/api';
const token = args.find(a => a.startsWith('--token='))?.split('=')[1];

if (!token) {
  console.error('Usage: node scripts/seed-zap-test-data.mjs --api-url <url> --token <jwt>');
  process.exit(1);
}

function makeRequest(url, method, body, authToken) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };

    const client = urlObj.protocol === 'https:' ? require('https') : require('http');
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

async function seedData() {
  console.log('========================================');
  console.log('  Seeding Synthetic Test Data');
  console.log('========================================\n');
  console.log(`API URL: ${apiUrl}\n`);

  const testData = [
    {
      module: 'HR / Employees',
      endpoint: '/api/hr/employees',
      method: 'POST',
      payload: {
        firstName: 'Test',
        lastName: 'Scanner',
        email: 'test.scanner@ovds.local',
        departmentId: 'default',
        position: 'Security Tester'
      }
    },
    {
      module: 'Customers',
      endpoint: '/api/crm/contacts',
      method: 'POST',
      payload: {
        name: 'Test Customer Scanner',
        email: 'customer.scanner@ovds.local',
        phone: '+251911234567',
        type: 'INDIVIDUAL'
      }
    },
    {
      module: 'Vendors',
      endpoint: '/api/purchases/vendors',
      method: 'POST',
      payload: {
        name: 'Test Vendor Scanner',
        email: 'vendor.scanner@ovds.local',
        phone: '+251911234568',
        category: 'SERVICES'
      }
    },
    {
      module: 'Items / Products',
      endpoint: '/api/items',
      method: 'POST',
      payload: {
        name: 'Test Product Scanner',
        sku: 'ZAP-TEST-001',
        category: 'TEST',
        price: 100.00,
        cost: 50.00
      }
    },
    {
      module: 'Invoices',
      endpoint: '/api/sales/invoices',
      method: 'POST',
      payload: {
        customerId: 'test-customer-id',
        items: [{ productId: 'test-product-id', quantity: 1, unitPrice: 100.00 }],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    }
  ];

  let created = 0;
  let failed = 0;

  for (const item of testData) {
    try {
      console.log(`Creating ${item.module}...`);
      
      const result = await makeRequest(`${apiUrl}${item.endpoint}`, item.method, item.payload, token);
      
      if (result.status === 201 || result.status === 200) {
        console.log(`  ✓ Created successfully`);
        created++;
      } else {
        console.log(`  ⚠ Status ${result.status}: ${JSON.stringify(result.data).substring(0, 100)}`);
        // Don't count as failure - endpoint might require different payload
      }
    } catch (e) {
      console.error(`  ✗ Error: ${e.message}`);
      failed++;
    }
  }

  console.log('\n========================================');
  console.log('  Seeding Complete');
  console.log('========================================');
  console.log(`Created: ${created}`);
  console.log(`Failed:  ${failed}`);
  console.log('\nNote: Some endpoints may require specific IDs or configurations.');
  console.log('Use the application UI to create additional test data as needed.');
  console.log('\nNext steps:');
  console.log('  1. Verify test data in the application');
  console.log('  2. Run ZAP scans to discover these endpoints');
  console.log('  3. Test authorization with different user roles');
}

seedData().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
