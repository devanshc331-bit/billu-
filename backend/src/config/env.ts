import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root (2 levels up from backend/src/config/env.ts)
// Wait, when running from backend directory, the project root is e:\PRD, and backend/src is e:\PRD\backend\src.
// So let's load from parent and parent/parent. Just calling dotenv.config() will load from current working directory (e:\PRD).
// But to be bulletproof, let's look for .env in current and parent directories.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  ENCRYPTION_KEY: z.string().default('00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'),
  MOCK_MODE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  NOTION_API_KEY: z.string().optional(),
  NOTION_DATABASE_ID: z.string().optional(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Environment validation failed:', parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;
export type Env = z.infer<typeof envSchema>;
