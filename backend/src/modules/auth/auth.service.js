import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import config from '../../config/index.js';
import { users } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

function sanitize(user) {
  const { password: _p, ...safe } = user;
  return safe;
}

export async function register({ name, email, password }) {
  const existing = [...users.values()].find(u => u.email === email);
  if (existing) throw new AppError('Email đã được đăng ký', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: randomUUID(),
    name,
    email,
    password: hashed,
    role: 'customer',
    phone: '',
    address: '',
    createdAt: new Date().toISOString(),
  };
  users.set(user.id, user);

  return { user: sanitize(user), token: signToken(user) };
}

export async function login({ email, password }) {
  const user = [...users.values()].find(u => u.email === email);
  if (!user) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  return { user: sanitize(user), token: signToken(user) };
}

export function getMe(userId) {
  const user = users.get(userId);
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);
  return sanitize(user);
}

export function updateProfile(userId, data) {
  const user = users.get(userId);
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);
  const updated = { ...user, ...data };
  users.set(userId, updated);
  return sanitize(updated);
}
