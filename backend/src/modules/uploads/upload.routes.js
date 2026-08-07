import { Router } from 'express';
import * as uploadController from './upload.controller.js';
import { uploadImage } from './upload.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

// Admin tải ảnh — mount tại /api/v1/admin/uploads
export const uploadAdminRouter = Router();
uploadAdminRouter.use(authenticate, authorize('admin'));

// multer là middleware đồng bộ với callback nên express-async-errors không bắt
// được lỗi của nó; bọc lại để mọi lỗi đều đi qua errorHandler.
const handleUpload = (req, res, next) => uploadImage(req, res, (err) => (err ? next(err) : next()));

uploadAdminRouter.delete('/',      uploadController.remove);
uploadAdminRouter.post('/:type',   handleUpload, uploadController.upload);
