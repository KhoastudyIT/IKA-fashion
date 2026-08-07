import { z } from 'zod';

export const createNewsSchema = z.object({
  title:      z.string().min(1).max(300),
  slug:       z.string().max(350).optional(),        // bỏ trống thì tự sinh từ tiêu đề
  img:        z.string().max(500).optional().default(''),
  excerpt:    z.string().max(500).optional().default(''),
  content:    z.string().min(1),
  author:     z.string().max(100).optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  status:     z.enum(['draft', 'published']).optional().default('draft'),
  date:       z.string().optional(),                 // 'yyyy-mm-dd' hoặc 'dd/mm/yyyy'
});

export const updateNewsSchema = createNewsSchema.partial();

export const updateNewsStatusSchema = z.object({
  status: z.enum(['draft', 'published']),
});

export const newsQuerySchema = z.object({
  search:   z.string().optional(),
  category: z.string().optional(),                   // slug danh mục
  sort:     z.enum(['newest', 'oldest']).optional().default('newest'),
  page:     z.coerce.number().int().positive().optional().default(1),
  limit:    z.coerce.number().int().positive().max(100).optional().default(12),
});

// Dashboard xem được cả bài nháp nên có thêm bộ lọc trạng thái.
export const adminNewsQuerySchema = newsQuerySchema.extend({
  status: z.enum(['draft', 'published']).optional(),
});
