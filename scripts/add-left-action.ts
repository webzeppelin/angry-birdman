/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addLeftActionCode() {
  try {
    const existing = await prisma.actionCode.findUnique({
      where: { actionCode: 'LEFT' },
    });

    if (!existing) {
      await prisma.actionCode.create({
        data: {
          actionCode: 'LEFT',
          displayName: 'Left',
        },
      });
      console.log('✓ Added LEFT action code');
    } else {
      console.log('✓ LEFT action code already exists');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void addLeftActionCode();
