/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { userId: 'keycloak:275386a9-b13d-4cd4-a282-d44b0d6a2146' },
  });
  console.log('User found:', user ? `${user.username} (${user.email})` : 'NOT FOUND');
  await prisma.$disconnect();
}

void checkUser();
