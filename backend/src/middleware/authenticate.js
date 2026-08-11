import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { AppError } from './errorHandler.js';
import { query } from '../db/index.js';

/**
 * authenticate — JWT middleware with live DB check (phantom-session fix).
 *
 * Flow:
 *  1. Verify JWT signature + expiry (fast, synchronous).
 *  2. Query the DB to confirm the user still exists and is NOT locked.
 *  3. Attach the DB row to req.user and call next().
 *
 * Throwing 401 vs 403:
 *  - 401 → token missing / invalid / expired  (you are not authenticated)
 *  - 403 → token valid but account locked/banned (you are authenticated but forbidden)
 */
export async function authenticate(req, _res, next) {
  try {
    // ── Step 1: Validate the Bearer token ────────────────────────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('Vui lòng đăng nhập', 401));
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      return next(new AppError('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.', 401));
    }

    // ── Step 2: Live DB check — does the user exist and is NOT locked? ────────
    const { rows } = await query(
      'SELECT id, name, email, role, is_locked FROM users WHERE id = $1',
      [payload.id],
    );

    const user = rows[0];

    if (!user) {
      return next(
        new AppError(
          'Tài khoản của bạn đã bị khóa hoặc không tồn tại. Vui lòng đăng nhập lại.',
          401,
        ),
      );
    }

    if (user.is_locked) {
      return next(
        new AppError(
          'Tài khoản của bạn đã bị khóa hoặc không tồn tại. Vui lòng đăng nhập lại.',
          403,
        ),
      );
    }

    // ── Step 3: Attach the live user row (not just the JWT payload) ───────────
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
