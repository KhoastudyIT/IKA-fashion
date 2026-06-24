import { wishlist, products } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

function getSet(userId) {
  if (!wishlist.has(userId)) wishlist.set(userId, new Set());
  return wishlist.get(userId);
}

export function listWishlist(userId) {
  const set = getSet(userId);
  return [...set]
    .map(id => products.get(id))
    .filter(Boolean);
}

export function addToWishlist(userId, productId) {
  const id = Number(productId);
  if (!products.has(id)) throw new AppError('Không tìm thấy sản phẩm', 404);
  getSet(userId).add(id);
  return listWishlist(userId);
}

export function removeFromWishlist(userId, productId) {
  getSet(userId).delete(Number(productId));
  return listWishlist(userId);
}
