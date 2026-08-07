import { AppError } from '../../middleware/errorHandler.js';
import { deleteUploadedImage } from './upload.service.js';
import { ok, created } from '../../utils/response.js';

/**
 * POST /api/v1/admin/uploads/:type
 *
 * Nhận file multipart (field `file`), trả về đường dẫn công khai dạng
 * /uploads/<type>/<tên-do-server-sinh>. Frontend lưu thẳng chuỗi này vào DB.
 */
export async function upload(req, res) {
  if (!req.file) throw new AppError('Chưa chọn file ảnh', 400);

  const url = `/uploads/${req.params.type}/${req.file.filename}`;
  created(res, {
    url,
    size: req.file.size,
    mimeType: req.file.mimetype,
  }, 'Tải ảnh lên thành công');
}

/** DELETE /api/v1/admin/uploads?url=/uploads/news/abc.jpg */
export async function remove(req, res) {
  const { url } = req.query;
  if (!url) throw new AppError('Thiếu tham số url', 400);

  deleteUploadedImage(url);
  ok(res, null, 'Đã xoá ảnh');
}
