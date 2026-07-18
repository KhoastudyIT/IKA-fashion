import * as wishlistService from './wishlist.service.js';
import { ok } from '../../utils/response.js';

export async function list(req, res) {
  ok(res, await wishlistService.listWishlist(req.user.id));
}

export async function add(req, res) {
  const items = await wishlistService.addToWishlist(req.user.id, req.body.productId);
  ok(res, items, 'Đã thêm vào danh sách yêu thích');
}

export async function remove(req, res) {
  const items = await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
  ok(res, items, 'Đã xóa khỏi danh sách yêu thích');
}
