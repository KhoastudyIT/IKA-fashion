import * as newsService from './news.service.js';
import { ok, created, noContent } from '../../utils/response.js';

// ---------- Công khai ----------

export async function list(req, res) {
  const result = await newsService.listPublishedNews(req.query);
  res.status(200).json({ success: true, ...result });
}

export async function getOne(req, res) {
  ok(res, await newsService.getPublishedNews(req.params.idOrSlug));
}

export async function listCategories(_req, res) {
  ok(res, await newsService.listNewsCategories());
}

// ---------- Admin ----------

export async function adminList(req, res) {
  const result = await newsService.listNewsAdmin(req.query);
  res.status(200).json({ success: true, ...result });
}

export async function adminGetById(req, res) {
  ok(res, await newsService.getNewsById(req.params.id));
}

export async function create(req, res) {
  const article = await newsService.createNews(req.body);
  created(res, article, 'Tạo bài viết thành công');
}

export async function update(req, res) {
  const article = await newsService.updateNews(req.params.id, req.body);
  ok(res, article, 'Cập nhật bài viết thành công');
}

export async function updateStatus(req, res) {
  const article = await newsService.updateNewsStatus(req.params.id, req.body.status);
  ok(res, article, 'Cập nhật trạng thái thành công');
}

export async function remove(req, res) {
  await newsService.deleteNews(req.params.id);
  noContent(res);
}
