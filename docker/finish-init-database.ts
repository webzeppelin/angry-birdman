/**
 * Finish Initialization Script for Deployed Environments
 *
 * This script completes the initialization of a deployed Angry Birdman instance
 * by creating essential database records that are required for the application
 * to function properly. Unlike the development seed script, this only creates
 * the minimal necessary data without sample/test data.
 *
 * Creates:
 * - Action codes (HOLD, WARN, KICK, RESERVE, PASS)
 * - System settings (nextBattleStartDate, schedulerEnabled)
 * - Superadmin user profile (must be run after Keycloak user is created)
 *
 * Prerequisites:
 * - Database migrations have been run
 * - Keycloak "superadmin" user has been created
 * - DATABASE_URL environment variable is set
 * - SUPERADMIN_KEYCLOAK_SUB environment variable contains the Keycloak subject ID
 *
 * Usage: tsx docker/finish-init-database.ts
 */

import { existsSync } from 'fs';
import { join } from 'path';

import { PrismaPg } from '@prisma/adapter-pg';
import { config as dotenvConfig } from 'dotenv';
import pg from 'pg';

import { PrismaClient } from '../database/generated/prisma/client';

// Load environment variables from docker/.env.test
const envPath = join(__dirname, '.env.test');
if (!existsSync(envPath)) {
  console.error(`\n❌ Error: ${envPath} not found`);
  console.error('   Please ensure you are running this script from the project root directory.\n');
  process.exit(1);
}

dotenvConfig({ path: envPath });

// Validate required environment variables
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('\n❌ Error: DATABASE_URL environment variable is not set\n');
  process.exit(1);
}

const superadminKeycloakSub = process.env.SUPERADMIN_KEYCLOAK_SUB;
if (!superadminKeycloakSub) {
  console.error('\n❌ Error: SUPERADMIN_KEYCLOAK_SUB environment variable is not set');
  console.error('   This should contain the Keycloak subject ID for the superadmin user.\n');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔧 Starting database initialization for deployed environment...\n');

  // ============================================================================
  // 1. Seed Action Codes
  // ============================================================================
  console.log('📋 Seeding action codes...');
  const actionCodes = [
    { actionCode: 'HOLD', displayName: 'Hold' },
    { actionCode: 'WARN', displayName: 'Warn' },
    { actionCode: 'KICK', displayName: 'Kick' },
    { actionCode: 'RESERVE', displayName: 'Move to Reserve' },
    { actionCode: 'PASS', displayName: 'Pass' },
  ];

  for (const code of actionCodes) {
    await prisma.actionCode.upsert({
      where: { actionCode: code.actionCode },
      update: {},
      create: code,
    });
  }
  console.log(`✅ Created ${actionCodes.length} action codes\n`);

  // ============================================================================
  // 2. Seed System Settings
  // ============================================================================
  console.log('⚙️ Seeding system settings...');

  // Next battle date - set to 3 days from now
  const nextBattleDate = new Date();
  nextBattleDate.setDate(nextBattleDate.getDate() + 3);
  nextBattleDate.setUTCHours(5, 0, 0, 0); // 00:00 EST (05:00 UTC)

  await prisma.systemSetting.upsert({
    where: { key: 'nextBattleStartDate' },
    update: {},
    create: {
      key: 'nextBattleStartDate',
      value: nextBattleDate.toISOString(),
      description: 'Next scheduled battle start date in Official Angry Birds Time (EST)',
      dataType: 'date',
    },
  });

  // Scheduler enabled flag
  await prisma.systemSetting.upsert({
    where: { key: 'schedulerEnabled' },
    update: {},
    create: {
      key: 'schedulerEnabled',
      value: 'true',
      description: 'Enable/disable automatic battle creation via scheduler',
      dataType: 'boolean',
    },
  });

  console.log('✅ Created 2 system settings\n');

  // ============================================================================
  // 3. Create Superadmin User Profile
  // ============================================================================
  console.log('👤 Creating superadmin user profile...');

  const superadminUserId = `keycloak:${superadminKeycloakSub}`;

  await prisma.user.upsert({
    where: { userId: superadminUserId },
    update: {
      username: 'superadmin',
      email: 'superadmin@angrybirdman.app',
      roles: ['superadmin'],
    },
    create: {
      userId: superadminUserId,
      username: 'superadmin',
      email: 'superadmin@angrybirdman.app',
      clanId: null,
      owner: false,
      roles: ['superadmin'],
    },
  });

  console.log('✅ Created superadmin user profile\n');

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('✨ Database initialization completed successfully!\n');
  console.log('Summary:');
  console.log(`  - ${actionCodes.length} action codes`);
  console.log(`  - 2 system settings`);
  console.log(`  - 1 superadmin user profile`);
  console.log(`  - Next battle date: ${nextBattleDate.toISOString()}\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error initializing database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
