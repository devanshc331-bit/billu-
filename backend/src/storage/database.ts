import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? [] : ['error', 'warn'],
});

export async function connectDB() {
  try {
    // Run database migrations in production environment on startup
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Running database migrations in production...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });

      // Seed default user and rules only if the database is empty
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('🌱 Database is empty. Seeding initial records...');
        execSync('npx prisma db seed', { stdio: 'inherit' });
      }
    }

    await prisma.$connect();
    console.log('🔌 Database connected successfully.');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}
