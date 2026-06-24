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

export function getMe(req, res) {
  ok(res, authService.getMe(req.user.id));
}

export function updateProfile(req, res) {
  const user = authService.updateProfile(req.user.id, req.body);
  ok(res, user, 'Cập nhật thông tin thành công');
}

export function logout(_req, res) {
  ok(res, null, 'Đăng xuất thành công');
}
