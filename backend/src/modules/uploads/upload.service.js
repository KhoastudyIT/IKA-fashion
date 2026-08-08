import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { AppError } from '../../middleware/errorHandler.js';

// Ảnh tải lên nằm ngoài src/ để `node --watch` không restart server mỗi lần có file mới.
export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

// Client chỉ chọn được thư mục trong danh sách này — không tự đặt đường dẫn lưu.
export const IMAGE_FOLDERS = ['news', 'products', 'collections', 'settings'];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/jpg':  '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
};

for (const folder of IMAGE_FOLDERS) {
  fs.mkdirSync(path.join(UPLOAD_ROOT, folder), { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const folder = req.params.type;
    if (!IMAGE_FOLDERS.includes(folder)) {
      return cb(new AppError(`Loại ảnh phải là một trong: ${IMAGE_FOLDERS.join(', ')}`, 400));
    }
    cb(null, path.join(UPLOAD_ROOT, folder));
  },
  filename(_req, file, cb) {
    // Tên do server sinh — không dùng tên file client gửi lên (tránh path traversal
    // và trùng tên giữa các lần tải).
    cb(null, `${Date.now()}-${crypto.randomUUID()}${EXT_BY_MIME[file.mimetype] ?? '.bin'}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!EXT_BY_MIME[file.mimetype]) {
      return cb(new AppError('Ảnh chỉ chấp nhận JPG, PNG hoặc WEBP', 400));
    }
    cb(null, true);
  },
}).single('file');

/**
 * Xoá một ảnh đã tải lên. Chỉ nhận đường dẫn dạng /uploads/<folder>/<file>
 * và luôn kiểm tra kết quả resolve vẫn nằm trong UPLOAD_ROOT.
 */
export function deleteUploadedImage(publicPath) {
  const match = String(publicPath).match(/^\/uploads\/([^/]+)\/([^/]+)$/);
  if (!match) throw new AppError('Đường dẫn ảnh không hợp lệ', 400);

  const [, folder, filename] = match;
  if (!IMAGE_FOLDERS.includes(folder)) throw new AppError('Thư mục ảnh không hợp lệ', 400);

  const target = path.resolve(UPLOAD_ROOT, folder, filename);
  if (!target.startsWith(UPLOAD_ROOT + path.sep)) {
    throw new AppError('Đường dẫn ảnh không hợp lệ', 400);
  }

  if (!fs.existsSync(target)) throw new AppError('Không tìm thấy ảnh', 404);
  fs.unlinkSync(target);
}
