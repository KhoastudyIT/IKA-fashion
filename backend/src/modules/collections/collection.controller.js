import * as collectionService from './collection.service.js';
import { ok, created } from '../../utils/response.js';

export function list(_req, res) {
  ok(res, collectionService.listCollections());
}

export function getBySlug(req, res) {
  ok(res, collectionService.getCollectionBySlug(req.params.slug));
}

export function create(req, res) {
  const result = collectionService.createCollection(req.body);
  created(res, result, 'Tạo danh mục thành công');
}

export function update(req, res) {
  const result = collectionService.updateCollection(req.params.id, req.body);
  ok(res, result, 'Cập nhật danh mục thành công');
}

export function remove(req, res) {
  collectionService.deleteCollection(req.params.id);
  ok(res, null, 'Xóa danh mục thành công');
}

