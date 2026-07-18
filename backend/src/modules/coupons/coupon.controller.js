import * as couponService from './coupon.service.js';
import { ok, created } from '../../utils/response.js';

export async function apply(req, res) {
  const result = await couponService.applyCoupon(req.body.code, req.body.subtotal);
  ok(res, result, 'Áp dụng mã thành công');
}

export async function list(_req, res) {
  ok(res, await couponService.listCoupons());
}

export async function create(req, res) {
  const c = await couponService.createCoupon(req.body);
  created(res, c, 'Tạo mã giảm giá thành công');
}

export async function update(req, res) {
  const c = await couponService.updateCoupon(req.params.id, req.body);
  ok(res, c, 'Cập nhật mã giảm giá thành công');
}

export async function toggle(req, res) {
  const c = await couponService.toggleCoupon(req.params.id);
  ok(res, c, c.active ? 'Đã kích hoạt mã' : 'Đã tạm dừng mã');
}

export async function remove(req, res) {
  await couponService.deleteCoupon(req.params.id);
  ok(res, null, 'Đã xóa mã giảm giá');
}
