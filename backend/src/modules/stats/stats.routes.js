import { Router } from 'express';
import * as statsController from './stats.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateQuery } from '../../middleware/validate.js';
import { reportQuerySchema } from './stats.schema.js';

// Báo cáo thống kê — mount tại /api/v1/admin/stats.
//
// Nhân viên xem được vì mục Thống Kê đã gộp vào Bảng Điều Khiển — trang mà
// nhân viên vẫn vào để nắm tình hình đơn hàng và tồn kho. Toàn bộ tuyến ở đây
// đều là GET nên không cần readOnly.
export const statsAdminRouter = Router();
statsAdminRouter.use(authenticate, authorize('admin', 'staff'));

statsAdminRouter.get('/report', validateQuery(reportQuerySchema), statsController.report);
statsAdminRouter.get('/export', validateQuery(reportQuerySchema), statsController.exportExcel);
