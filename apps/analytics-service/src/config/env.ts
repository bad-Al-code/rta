import 'dotenv/config';
import z from 'zod';

const NodeEnvSchema = z.enum(['development', 'production', 'test']);

const envSchema = z.object({
  NODE_ENV: NodeEnvSchema.default('development'),
  PORT: z.coerce.number().default(4000),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().min(1, 'JWT_EXPIRES_IN is required'),
  COOKIE_PARSER_SECRET: z
    .string()
    .min(32, 'COOKIE_PARSER_SECRET must be at least 32 characters long'),

  API_URL: z.url().default('http://localhost:4000'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errors = z.treeifyError(parsedEnv.error);
  console.error('Invalid environment variables: ', errors);

  process.exit(1);
}

export const env = parsedEnv.data;
