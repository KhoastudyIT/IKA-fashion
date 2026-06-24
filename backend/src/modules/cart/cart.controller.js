import * as cartService from './cart.service.js';
import { ok } from '../../utils/response.js';

export function getCart(req, res) {
  ok(res, cartService.getCart(req.user.id));
}

export function addItem(req, res) {
  const cart = cartService.addItem(req.user.id, req.body);
  ok(res, cart, 'Đã thêm vào giỏ hàng');
}

export function updateItem(req, res) {
  const cart = cartService.updateItem(req.user.id, req.params.key, req.body.quantity);
  ok(res, cart, 'Đã cập nhật giỏ hàng');
}

export function removeItem(req, res) {
  const cart = cartService.removeItem(req.user.id, req.params.key);
  ok(res, cart, 'Đã xóa khỏi giỏ hàng');
}

export function clearCart(req, res) {
  ok(res, cartService.clearCart(req.user.id), 'Đã xóa toàn bộ giỏ hàng');
}
