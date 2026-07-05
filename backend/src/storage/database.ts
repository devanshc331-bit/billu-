import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? [] : ['error', 'warn'],
});

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('🔌 Database connected successfully.');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}
