import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  size:      z.string().min(1),
  color:     z.string().min(1),
  quantity:  z.number().int().positive().max(99).optional().default(1),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().positive().max(99),
});
