import { z } from 'zod';

export const updateUserSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name cannot be empty')
      // .trim()
      .min(1, 'Name cannot be empty'),
  }),
});
