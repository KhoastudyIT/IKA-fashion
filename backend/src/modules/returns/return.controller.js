import * as svc from './return.service.js';
import { ok, created } from '../../utils/response.js';

// ─── Khách hàng ──────────────────────────────────────────────────────────────

export async function create(req, res) {
  const item = await svc.createReturn(req.user.id, req.body);
  created(res, item, 'Đã gửi yêu cầu, cửa hàng sẽ phản hồi sớm');
}

export async function listMine(req, res) {
  ok(res, await svc.listMyReturns(req.user.id));
}

// ─── Admin / nhân viên ───────────────────────────────────────────────────────

export async function list(req, res) {
  const result = await svc.listReturns(req.query);
  res.status(200).json({ success: true, ...result });
}

export async function getOne(req, res) {
  ok(res, await svc.getReturnById(req.params.id));
}

export async function updateStatus(req, res) {
  ok(res, await svc.updateReturnStatus(req.params.id, req.body), 'Đã cập nhật yêu cầu');
}
