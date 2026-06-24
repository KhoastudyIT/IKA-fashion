import { z } from 'zod';

export const registerSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name:    z.string().min(2).max(100).optional(),
  phone:   z.string().max(20).optional(),
  address: z.string().max(255).optional(),
});
