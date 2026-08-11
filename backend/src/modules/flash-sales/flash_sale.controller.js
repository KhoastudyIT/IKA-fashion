import * as flashSaleService from './flash_sale.service.js';
import { ok, created } from '../../utils/response.js';

// ── Public ─────────────────────────────────────────────────────────────────

/** GET /api/v1/flash-sales/active */
export async function getActive(_req, res) {
  ok(res, await flashSaleService.getActiveFlashSales());
}

// ── Admin — Flash Sales ────────────────────────────────────────────────────

/** GET /api/v1/admin/flash-sales */
export async function list(_req, res) {
  ok(res, await flashSaleService.listFlashSales());
}

/** GET /api/v1/admin/flash-sales/:id */
export async function getOne(req, res) {
  ok(res, await flashSaleService.getFlashSaleById(req.params.id));
}

/** POST /api/v1/admin/flash-sales */
export async function create(req, res) {
  const sale = await flashSaleService.createFlashSale(req.body);
  created(res, sale, 'Đã tạo flash sale');
}

/** PUT /api/v1/admin/flash-sales/:id */
export async function update(req, res) {
  ok(res, await flashSaleService.updateFlashSale(req.params.id, req.body), 'Đã cập nhật flash sale');
}

/** PUT /api/v1/admin/flash-sales/:id/toggle */
export async function toggle(req, res) {
  const sale = await flashSaleService.toggleFlashSale(req.params.id);
  ok(res, sale, sale.isActive ? 'Đã kích hoạt flash sale' : 'Đã tạm dừng flash sale');
}

/** DELETE /api/v1/admin/flash-sales/:id */
export async function remove(req, res) {
  await flashSaleService.deleteFlashSale(req.params.id);
  ok(res, null, 'Đã xóa flash sale');
}

// ── Admin — Flash Sale Products ────────────────────────────────────────────

/** POST /api/v1/admin/flash-sales/:id/products */
export async function addProduct(req, res) {
  const item = await flashSaleService.addProductToFlashSale(req.params.id, req.body);
  created(res, item, 'Đã thêm sản phẩm vào flash sale');
}

/** PUT /api/v1/admin/flash-sales/:id/products/:productId */
export async function updateProduct(req, res) {
  const item = await flashSaleService.updateFlashSaleProduct(
    req.params.id, req.params.productId, req.body,
  );
  ok(res, item, 'Đã cập nhật sản phẩm flash sale');
}

/** DELETE /api/v1/admin/flash-sales/:id/products/:productId */
export async function removeProduct(req, res) {
  await flashSaleService.removeProductFromFlashSale(req.params.id, req.params.productId);
  ok(res, null, 'Đã xóa sản phẩm khỏi flash sale');
}
