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
