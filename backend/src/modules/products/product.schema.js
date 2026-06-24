import { z } from 'zod';

export const createProductSchema = z.object({
  name:        z.string().min(1).max(200),
  handle:      z.string().min(1).max(200),
  collection:  z.string().min(1).max(100),   // ao-thun | ao-polo | quan
  type:        z.string().min(1).max(100),
  price:       z.number().int().positive(),  // VND
  img:         z.string().optional().default('/products/placeholder.png'),
  images:      z.array(z.string()).optional().default([]),
  colors:      z.array(z.string()).optional().default([]),
  sizes:       z.array(z.string()).optional().default([]),
  features:    z.array(z.string()).optional().default([]),
  stock:       z.number().int().nonnegative().optional().default(0),
  description: z.string().max(1000).optional().default(''),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  collection: z.string().optional(),
  search:     z.string().optional(),
  sort:       z.enum(['price_asc', 'price_desc', 'rating', 'sold', 'newest']).optional().default('newest'),
  page:       z.coerce.number().int().positive().optional().default(1),
  limit:      z.coerce.number().int().positive().max(100).optional().default(12),
  priceMin:   z.coerce.number().nonnegative().optional(),
  priceMax:   z.coerce.number().positive().optional(),
  colors:     z.string().optional(),  // CSV: "Đen,Trắng"
  sizes:      z.string().optional(),  // CSV: "M,L"
});
