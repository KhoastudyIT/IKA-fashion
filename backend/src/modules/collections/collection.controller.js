import * as collectionService from './collection.service.js';
import { ok, created } from '../../utils/response.js';

export async function list(_req, res) {
  ok(res, await collectionService.listCollections());
}

export async function getBySlug(req, res) {
  ok(res, await collectionService.getCollectionBySlug(req.params.slug));
}

export async function create(req, res) {
  const result = await collectionService.createCollection(req.body);
  created(res, result, 'Tạo danh mục thành công');
}

export async function update(req, res) {
  const result = await collectionService.updateCollection(req.params.id, req.body);
  ok(res, result, 'Cập nhật danh mục thành công');
}

export async function remove(req, res) {
  await collectionService.deleteCollection(req.params.id);
  ok(res, null, 'Xóa danh mục thành công');
}
