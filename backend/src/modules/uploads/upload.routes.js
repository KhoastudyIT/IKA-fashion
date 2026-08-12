import { Router } from 'express';
import * as uploadController from './upload.controller.js';
import { uploadImage, CUSTOMER_IMAGE_FOLDERS } from './upload.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { AppError } from '../../middleware/errorHandler.js';

// multer là middleware đồng bộ với callback nên express-async-errors không bắt
// được lỗi của nó; bọc lại để mọi lỗi đều đi qua errorHandler.
const handleUpload = (req, res, next) => uploadImage(req, res, (err) => (err ? next(err) : next()));

// Admin tải ảnh — mount tại /api/v1/admin/uploads
export const uploadAdminRouter = Router();
uploadAdminRouter.use(authenticate, authorize('admin'));
uploadAdminRouter.delete('/',      uploadController.remove);
uploadAdminRouter.post('/:type',   handleUpload, uploadController.upload);

// Khách hàng tải ảnh — mount tại /api/v1/customer/uploads
//
// Chỉ mở đúng thư mục 'returns' (ảnh kèm yêu cầu trả/đổi). Chặn TRƯỚC khi multer
// ghi file, không thì khách đẩy được ảnh vào thư mục sản phẩm rồi mới bị từ chối.
export const uploadCustomerRouter = Router();
uploadCustomerRouter.use(authenticate, authorize('customer'));
uploadCustomerRouter.post(
  '/:type',
  (req, _res, next) => {
    if (!CUSTOMER_IMAGE_FOLDERS.includes(req.params.type)) {
      return next(new AppError('Bạn không được tải ảnh vào mục này', 403));
    }
    next();
  },
  handleUpload,
  uploadController.upload,
);
