import { z } from 'zod';

export const createOrderSchema = z.object({
  shippingAddress: z.string().min(5).max(255),
  phone:           z.string().min(8).max(20),
  notes:           z.string().max(500).optional().default(''),
});

const STATUSES = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];

export const updateOrderStatusSchema = z.object({
  status:        z.enum(STATUSES).optional(),
  paymentStatus: z.enum(['unpaid', 'paid']).optional(),
});

export { STATUSES };
