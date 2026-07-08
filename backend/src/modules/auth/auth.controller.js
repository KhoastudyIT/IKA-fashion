import * as authService from './auth.service.js';
import { ok, created } from '../../utils/response.js';
import { users } from '../../db/store.js';

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

export function listUsers(req, res) {
  const list = [...users.values()].map(u => {
    const { password, ...safe } = u;
    return safe;
  });
  ok(res, list);
}

export function deleteUser(req, res) {
  users.delete(req.params.id);
  ok(res, null, 'Đã xóa người dùng');
}

export function toggleLockUser(req, res) {
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
  if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản Admin' });
  user.isLocked = !user.isLocked;
  users.set(req.params.id, user);
  const { password, ...safe } = user;
  ok(res, safe, user.isLocked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
}

export function updateUserRole(req, res) {
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
  if (user.id === req.user.id) return res.status(400).json({ success: false, message: 'Không thể tự thay đổi vai trò của mình' });
  user.role = req.body.role;
  users.set(req.params.id, user);
  const { password, ...safe } = user;
  ok(res, safe, 'Cập nhật vai trò thành công');
}
