#!/usr/bin/env bash
# Setup ZAP Test Users Directly in Database
# Creates test users via Prisma for security scanning
# Use this when the API is not available or for quick setup
#
# Usage:
#   npm run db:seed:zap-test-users
#   OR
#   node scripts/seed-zap-test-users-db.mjs

import { PrismaClient } from '@ovds/database';

const prisma = new PrismaClient();

const testUsers = [
  {
    email: 'scanner.user@ovds.local',
    username: 'zap-scanner-user',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyPg6ZSNVQjK.2', // ZapScan#2024!Strong
    role: 'EMPLOYEE',
    companyId: null
  },
  {
    email: 'scanner.admin@ovds.local',
    username: 'zap-scanner-admin',
    password: '$2a$12$8K1Z8qHKQZ8qHKQZ8qHKQOZ8qHKQZ8qHKQZ8qHKQZ8qHKQZ8qHKQ', // ZapRoot#2024!Secure
    role: 'ADMIN',
    companyId: null
  },
  {
    email: 'scanner.supervisor@ovds.local',
    username: 'zap-scanner-supervisor',
    password: '$2a$12$9L2Y9rILRZ9rILRZ9rILRPZ9rILRZ9rILRZ9rILRZ9rILRZ9rILR', // ZapSuper#2024!View
    role: 'SUPERVISOR',
    companyId: null
  },
  {
    email: 'scanner.disabled@ovds.local',
    username: 'zap-scanner-disabled',
    password: '$2a$12$0M3N0sJMSa0sJMSa0sJMSb0sJMSa0sJMSa0sJMSa0sJMSa0sJMSa', // ZapDisabled#2024!Test
    role: 'EMPLOYEE',
    companyId: null
  }
];

async function seedUsers() {
  console.log('========================================');
  console.log('  Seeding ZAP Test Users (Database)');
  console.log('========================================\n');
  console.log('Creating test users directly in database...\n');

  for (const user of testUsers) {
    try {
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (existing) {
        console.log(`User ${user.email} already exists, updating...`);
        await prisma.user.update({
          where: { email: user.email },
          data: {
            password: user.password,
            role: user.role,
            username: user.username
          }
        });
        console.log(`  ✓ Updated ${user.email}`);
      } else {
        await prisma.user.create({
          data: {
            email: user.email,
            username: user.username,
            password: user.password,
            role: user.role,
            companyId: user.companyId
          }
        });
        console.log(`  ✓ Created ${user.email}`);
      }
    } catch (e) {
      console.error(`  ✗ Error with ${user.email}: ${e.message}`);
    }
  }

  console.log('\n========================================');
  console.log('  Test Users Summary');
  console.log('========================================\n');
  
  testUsers.forEach(u => {
    console.log(`Email:    ${u.email}`);
    console.log(`Username: ${u.username}`);
    console.log(`Role:     ${u.role}`);
    console.log('');
  });

  console.log('Next steps:');
  console.log('  1. Update .zap/contexts/ovds.context with these credentials');
  console.log('  2. Update .zap/automation/ovds-authenticated-scan.yaml with these credentials');
  console.log('  3. Run ZAP scans with these accounts');
  console.log('');
  console.log('Note: These accounts are for security testing only.');
  console.log('Disable or remove them after testing is complete.');
}

seedUsers()
  .catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
