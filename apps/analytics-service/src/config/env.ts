import z from 'zod';

const NodeEnvSchema = z.enum(['development', 'production', 'test']);

const envSchema = z.object({
  NODE_ENV: NodeEnvSchema.default('development'),
  PORT: z.coerce.number().default(4000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errors = z.treeifyError(parsedEnv.error);
  console.error('Invalid environment variables: ', errors);

  process.exit(1);
}

export const env = parsedEnv.data;
