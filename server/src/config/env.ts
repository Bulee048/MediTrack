import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string({
    required_error: 'MONGODB_URI environment variable is required',
  }).min(1, 'MONGODB_URI cannot be empty'),
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET environment variable is required',
  }).min(1, 'JWT_SECRET cannot be empty'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Environment Variable Validation Error:');
  _env.error.issues.forEach((issue) => {
    console.error(` - ${issue.path.join('.')}: ${issue.message}`);
  });
  throw new Error('Invalid environment configuration');
}

export const env = _env.data;
