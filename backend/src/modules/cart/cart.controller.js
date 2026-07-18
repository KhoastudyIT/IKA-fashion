import * as cartService from './cart.service.js';
import { ok } from '../../utils/response.js';

export async function getCart(req, res) {
  ok(res, await cartService.getCart(req.user.id));
}

export async function addItem(req, res) {
  const cart = await cartService.addItem(req.user.id, req.body);
  ok(res, cart, 'Đã thêm vào giỏ hàng');
}

export async function updateItem(req, res) {
  const cart = await cartService.updateItem(req.user.id, req.params.key, req.body.quantity);
  ok(res, cart, 'Đã cập nhật giỏ hàng');
}

export async function removeItem(req, res) {
  const cart = await cartService.removeItem(req.user.id, req.params.key);
  ok(res, cart, 'Đã xóa khỏi giỏ hàng');
}

export async function clearCart(req, res) {
  ok(res, await cartService.clearCart(req.user.id), 'Đã xóa toàn bộ giỏ hàng');
}
