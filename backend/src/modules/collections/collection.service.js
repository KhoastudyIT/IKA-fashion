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
