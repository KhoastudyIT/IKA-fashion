import * as collectionService from './collection.service.js';
import { ok } from '../../utils/response.js';

export function list(_req, res) {
  ok(res, collectionService.listCollections());
}

export function getBySlug(req, res) {
  ok(res, collectionService.getCollectionBySlug(req.params.slug));
}
