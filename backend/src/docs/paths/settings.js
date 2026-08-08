import { bearer, jsonBody, okData, adminErrors, validationError } from '../helpers.js';

export const settingsPaths = {
  '/api/v1/settings': {
    get: {
      tags: ['Cửa hàng - Thông tin'],
      summary: 'Cấu hình cửa hàng (công khai)',
      description: 'Header, Footer và trang Liên hệ đọc từ đây. Không cần đăng nhập. Luôn trả về một bản ghi — chưa có thì server tự tạo dòng mặc định.',
      responses: {
        200: okData('Cấu hình đang áp dụng', 'StoreSettings'),
      },
    },
  },

  '/api/v1/admin/settings': {
    get: {
      tags: ['Admin - Cài đặt'],
      summary: 'Cấu hình cửa hàng (bản admin)',
      description: 'Cùng dữ liệu với endpoint công khai, tách riêng để form dashboard không phụ thuộc route công khai.',
      security: bearer,
      responses: {
        200: okData('Cấu hình đang áp dụng', 'StoreSettings'),
        ...adminErrors,
      },
    },
    put: {
      tags: ['Admin - Cài đặt'],
      summary: 'Cập nhật cấu hình cửa hàng',
      description: 'Chỉ gửi trường muốn đổi. `logo` là đường dẫn do POST /admin/uploads/settings trả về.',
      security: bearer,
      requestBody: jsonBody('StoreSettingsUpdateBody'),
      responses: {
        200: okData('Cấu hình sau khi cập nhật', 'StoreSettings'),
        ...adminErrors,
        422: validationError,
      },
    },
  },
};
