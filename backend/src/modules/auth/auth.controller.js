import * as authService from './auth.service.js';
import { ok, created } from '../../utils/response.js';

export async function register(req, res) {
  const result = await authService.register(req.body);
  created(res, result, 'Đăng ký thành công');
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  ok(res, result, 'Đăng nhập thành công');
}

export async function getMe(req, res) {
  ok(res, await authService.getMe(req.user.id));
}

export async function updateProfile(req, res) {
  const user = await authService.updateProfile(req.user.id, req.body);
  ok(res, user, 'Cập nhật thông tin thành công');
}

export async function changePassword(req, res) {
  await authService.changePassword(req.user.id, req.body);
  ok(res, null, 'Đổi mật khẩu thành công');
}

export function logout(_req, res) {
  ok(res, null, 'Đăng xuất thành công');
}

export async function listUsers(req, res) {
  const result = await authService.listUsers(req.query);
  res.status(200).json({ success: true, ...result });
}

export async function createUser(req, res) {
  const user = await authService.createUser(req.body);
  created(res, user, 'Tạo tài khoản thành công');
}

export async function deleteUser(req, res) {
  await authService.deleteUser(req.params.id);
  ok(res, null, 'Đã xóa người dùng');
}

export async function toggleLockUser(req, res) {
  const user = await authService.toggleLockUser(req.params.id);
  ok(res, user, user.isLocked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
}

export async function updateUserRole(req, res) {
  const user = await authService.updateUserRole(req.params.id, req.body.role, req.user.id);
  ok(res, user, 'Cập nhật vai trò thành công');
}
