import { AppError } from './errorHandler.js';

/**
 * Phân quyền theo role. Phải chạy sau `authenticate` (đã gán req.user).
 * Dùng: router.post('/', authenticate, authorize('admin'), handler)
 */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Vui lòng đăng nhập', 401));
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện thao tác này', 403));
    }
    next();
  };
}

export function readOnly(...roles) {
  return (req, _res, next) => {
    if (roles.includes(req.user?.role) && req.method !== 'GET') {
      return next(new AppError('Tài khoản của bạn chỉ được phép xem mục này', 403));
    }
    next();
  };
}
