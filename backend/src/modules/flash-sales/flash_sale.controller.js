import * as svc from './flash_sale.service.js';
import { ok, created } from '../../utils/response.js';

/** GET /flash-sales/active — khối Flash Sale phía khách */
export async function getActive(_req, res) {
  ok(res, await svc.getActiveFlashSales());
}

export async function list(_req, res) {
  ok(res, await svc.listFlashSales());
}

export async function getOne(req, res) {
  ok(res, await svc.getFlashSaleById(req.params.id));
}

export async function create(req, res) {
  created(res, await svc.createFlashSale(req.body), 'Đã tạo flash sale');
}

export async function update(req, res) {
  ok(res, await svc.updateFlashSale(req.params.id, req.body), 'Đã cập nhật flash sale');
}

export async function toggle(req, res) {
  const item = await svc.toggleFlashSale(req.params.id);
  ok(res, item, item.active ? 'Đã bật flash sale' : 'Đã tạm ngưng flash sale');
}

export async function end(req, res) {
  ok(res, await svc.endFlashSale(req.params.id), 'Đã kết thúc flash sale');
}
