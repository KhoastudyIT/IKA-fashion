import * as statsService from './stats.service.js';
import * as settingsService from '../settings/settings.service.js';
import { buildStatsWorkbook } from '../../services/excel/stats-report.js';
import { DEFAULT_REPORT_DAYS } from './stats.schema.js';
import { ok } from '../../utils/response.js';

/** Quy đổi from/to (YYYY-MM-DD) thành khoảng nửa mở [start, end). */
function parseRange(query) {
  const today = new Date();
  const toStr = query.to ?? today.toISOString().slice(0, 10);
  const fromStr = query.from
    ?? new Date(today.getTime() - (DEFAULT_REPORT_DAYS - 1) * 86_400_000).toISOString().slice(0, 10);

  const start = new Date(`${fromStr}T00:00:00`);
  // Cộng thêm một ngày: admin chọn "đến 14/08" là muốn tính cả đơn trong ngày 14/08.
  const end = new Date(`${toStr}T00:00:00`);
  end.setDate(end.getDate() + 1);
  return { start, end, fromStr, toStr };
}

/** GET /admin/stats/report — cùng dữ liệu với file Excel, dạng JSON. */
export async function report(req, res) {
  const { start, end, fromStr, toStr } = parseRange(req.query);
  const data = await statsService.getReportData({ from: start, to: end });
  ok(res, { range: { from: fromStr, to: toStr }, ...data });
}

/**
 * GET /admin/stats/export — tải báo cáo thống kê dạng Excel.
 *
 * Không truyền from/to thì lấy 30 ngày gần nhất.
 */
export async function exportExcel(req, res) {
  const { start, end, fromStr, toStr } = parseRange(req.query);
  const data = await statsService.getReportData({ from: start, to: end });

  let settings = {};
  try { settings = await settingsService.getSettings(); } catch { /* dùng mặc định */ }

  const workbook = buildStatsWorkbook(data, {
    from: start,
    to: new Date(`${toStr}T00:00:00`),
    storeName: settings.storeName,
    exportedBy: req.user?.name,
  });

  const fileName = `thong-ke-${fromStr}-den-${toStr}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  await workbook.xlsx.write(res);
  res.end();
}
