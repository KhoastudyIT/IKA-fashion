import { z } from 'zod';

/** Không truyền khoảng thời gian thì báo cáo lấy 30 ngày gần nhất. */
export const DEFAULT_REPORT_DAYS = 30;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng YYYY-MM-DD');

export const reportQuerySchema = z.object({
  from: isoDate.optional(),
  to:   isoDate.optional(),
});
