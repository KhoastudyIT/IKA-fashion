import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

/**
 * Giới hạn tần suất cho các endpoint xác thực.
 *
 * Trước đây chỉ khung chat có chặn flood, còn /auth/login thì không — nghĩa là
 * dò mật khẩu bằng script chạy được không giới hạn. Hai limiter dưới đây đếm
 * theo địa chỉ IP và trả về lỗi tiếng Việt theo đúng khuôn phản hồi lỗi chung
 * của API (errorHandler.js).
 *
 * Ở môi trường test thì tắt hẳn, nếu không các bài test gọi liên tiếp sẽ dính
 * giới hạn và fail ngẫu nhiên.
 */
const DISABLED = config.nodeEnv === 'test';

function makeLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    limit: max,
    skip: () => DISABLED,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Đếm cả request thành công lẫn thất bại thì người đăng nhập đúng cũng bị
    // chặn oan; chỉ những lần SAI mới tính vào hạn mức.
    skipSuccessfulRequests: true,
    handler: (req, res) => {
      res.status(429).json({ success: false, message });
    },
  });
}

/** Đăng nhập: 8 lần sai trong 15 phút cho mỗi IP. */
export const loginLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
});

/** Đăng ký: 5 tài khoản mỗi giờ cho mỗi IP — chặn tạo hàng loạt. */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  skip: () => DISABLED,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Đã tạo quá nhiều tài khoản từ thiết bị này. Vui lòng thử lại sau.',
    });
  },
});
