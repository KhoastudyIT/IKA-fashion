import * as orderService from './order.service.js';
import * as settingsService from '../settings/settings.service.js';
import { buildInvoicePdf, invoiceCode } from '../../services/pdf/invoice.js';
import { ok, created } from '../../utils/response.js';

export async function create(req, res) {
  const order = await orderService.createOrder(req.user.id, req.body);
  created(res, order, 'Đặt hàng thành công');
}

export async function listMine(req, res) {
  ok(res, await orderService.listMyOrders(req.user.id));
}

export async function getById(req, res) {
  ok(res, await orderService.getOrder(req.params.id, req.user));
}

/**
 * GET /orders/:id/invoice — hoá đơn PDF của một đơn.
 *
 * Khách in được hoá đơn đơn hàng của mình, admin và nhân viên in được mọi đơn.
 * Việc kiểm tra chủ sở hữu do orderService.getOrder lo, giống các route xem chi
 * tiết đơn khác.
 */
export async function invoice(req, res) {
  const order = await orderService.getOrder(req.params.id, req.user);

  // Thông tin cửa hàng in ở đầu hoá đơn; thiếu cũng không chặn việc in.
  let settings = {};
  try { settings = await settingsService.getSettings(); } catch { /* dùng mặc định */ }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="hoa-don-${invoiceCode(order.id)}.pdf"`);

  // Nối thẳng stream vào response: file không cần nằm trọn trong bộ nhớ.
  buildInvoicePdf(order, settings).pipe(res);
}

export async function listAll(req, res) {
  const result = await orderService.listAllOrders(req.query);
  res.status(200).json({ success: true, ...result });
}

export async function updateStatus(req, res) {
  const order = await orderService.updateOrderStatus(req.params.id, req.body);
  ok(res, order, 'Đã cập nhật đơn hàng');
}
