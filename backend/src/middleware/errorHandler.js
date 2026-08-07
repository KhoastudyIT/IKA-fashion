export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }

  // multer ném lỗi riêng khi file vượt giới hạn — trả 400 kèm thông báo dễ hiểu
  // thay vì để rơi xuống nhánh 500 bên dưới.
  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Ảnh vượt quá dung lượng cho phép (tối đa 5MB)'
      : `Lỗi tải file: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }

  console.error('[Error]', err);
  return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
}
