import * as contactService from './contact.service.js';
import { ok, created } from '../../utils/response.js';

export async function create(req, res) {
  const contact = await contactService.createContact(req.body);
  created(res, contact, 'Đã gửi yêu cầu liên hệ. Chúng tôi sẽ phản hồi sớm nhất.');
}

export async function list(req, res) {
  const result = await contactService.listContacts(req.query);
  res.status(200).json({ success: true, ...result });
}

export async function stats(_req, res) {
  ok(res, await contactService.countContactsByStatus());
}

export async function getOne(req, res) {
  ok(res, await contactService.getContact(req.params.id));
}

export async function update(req, res) {
  const contact = await contactService.updateContact(req.params.id, req.body);
  ok(res, contact, 'Đã cập nhật yêu cầu liên hệ');
}

export async function remove(req, res) {
  await contactService.deleteContact(req.params.id);
  ok(res, null, 'Đã xóa yêu cầu liên hệ');
}
