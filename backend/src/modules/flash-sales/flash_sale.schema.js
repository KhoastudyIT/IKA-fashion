import { z } from 'zod';

// ── Flash Sale CRUD ────────────────────────────────────────────────────────

export const createFlashSaleSchema = z.object({
  name:      z.string().min(1).max(200),
  startTime: z.string().datetime({ offset: true, message: 'startTime phải là ISO 8601 có timezone' }),
  endTime:   z.string().datetime({ offset: true, message: 'endTime phải là ISO 8601 có timezone' }),
  isActive:  z.boolean().optional().default(false),
}).refine(d => new Date(d.endTime) > new Date(d.startTime), {
  message: 'endTime phải sau startTime',
  path: ['endTime'],
});

export const updateFlashSaleSchema = z.object({
  name:      z.string().min(1).max(200).optional(),
  startTime: z.string().datetime({ offset: true }).optional(),
  endTime:   z.string().datetime({ offset: true }).optional(),
  isActive:  z.boolean().optional(),
});

// ── Flash Sale Products ────────────────────────────────────────────────────

export const addProductSchema = z.object({
  productId:       z.number().int().positive(),
  discountedPrice: z.number().int().nonnegative(),
  stockLimit:      z.number().int().positive(),
});

export const updateProductSchema = z.object({
  discountedPrice: z.number().int().nonnegative().optional(),
  stockLimit:      z.number().int().positive().optional(),
});
