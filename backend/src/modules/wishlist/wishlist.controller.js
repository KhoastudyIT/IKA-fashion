import * as wishlistService from './wishlist.service.js';
import { ok } from '../../utils/response.js';

export function list(req, res) {
  ok(res, wishlistService.listWishlist(req.user.id));
}

export function add(req, res) {
  const items = wishlistService.addToWishlist(req.user.id, req.body.productId);
  ok(res, items, 'Đã thêm vào danh sách yêu thích');
}

export function remove(req, res) {
  const items = wishlistService.removeFromWishlist(req.user.id, req.params.productId);
  ok(res, items, 'Đã xóa khỏi danh sách yêu thích');
}
