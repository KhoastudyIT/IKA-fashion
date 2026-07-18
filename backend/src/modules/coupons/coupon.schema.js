import { z } from 'zod';

export const applyCouponSchema = z.object({
  code:     z.string().min(1).max(50),
  subtotal: z.coerce.number().int().nonnegative(),
});

export const createCouponSchema = z.object({
  code:       z.string().min(1).max(50),
  type:       z.enum(['percentage', 'fixed']),
  value:      z.number().int().positive(),
  minOrder:   z.number().int().nonnegative().optional().default(0),
  quantity:   z.number().int().nonnegative().optional().default(100),
  active:     z.boolean().optional().default(true),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải dạng YYYY-MM-DD'),
});

export const updateCouponSchema = createCouponSchema.partial();
