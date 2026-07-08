import { collections, products } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

export function listCollections() {
  // Kèm số lượng sản phẩm mỗi danh mục
  const all = [...products.values()];
  return collections.map(c => ({
    ...c,
    productCount: all.filter(p => p.collection === c.slug).length,
  }));
}

export function getCollectionBySlug(slug) {
  const collection = collections.find(c => c.slug === slug);
  if (!collection) throw new AppError('Không tìm thấy danh mục', 404);
  const items = [...products.values()].filter(p => p.collection === slug);
  return { ...collection, products: items };
}

export function createCollection({ name, slug, img }) {
  const existing = collections.find(c => c.slug === slug);
  if (existing) throw new AppError('Slug danh mục đã tồn tại', 409);
  const newCol = { id: Date.now(), name, slug, img: img || '/products/ao-thun-trang.png' };
  collections.push(newCol);
  return newCol;
}

export function updateCollection(id, data) {
  const idx = collections.findIndex(c => c.id === Number(id));
  if (idx === -1) throw new AppError('Không tìm thấy danh mục', 404);
  collections[idx] = { ...collections[idx], ...data };
  return collections[idx];
}

export function deleteCollection(id) {
  const idx = collections.findIndex(c => c.id === Number(id));
  if (idx === -1) throw new AppError('Không tìm thấy danh mục', 404);
  collections.splice(idx, 1);
}

