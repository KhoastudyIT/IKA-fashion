import {
  bearer, jsonBody, okData, createdData, okMessage,
  unauthorized, conflict, validationError,
} from '../helpers.js';

export const authPaths = {
  '/api/v1/auth/register': {
    post: {
      tags: ['Xác thực'],
      summary: 'Đăng ký tài khoản',
      description: 'Trả về luôn token nên đăng ký xong là dùng được ngay, không cần gọi thêm login.',
      requestBody: jsonBody('RegisterBody'),
      responses: {
        201: createdData('Đăng ký thành công — kèm token', 'AuthResult'),
        409: conflict,
        422: validationError,
      },
    },
  },

  '/api/v1/auth/login': {
    post: {
      tags: ['Xác thực'],
      summary: 'Đăng nhập',
      description: 'Tài khoản admin có sẵn trong dữ liệu seed: `admin@ika.vn` / `admin123`.',
      requestBody: jsonBody('LoginBody'),
      responses: {
        200: okData('Đăng nhập thành công — kèm token', 'AuthResult'),
        401: {
          description: 'Sai email hoặc mật khẩu',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Email hoặc mật khẩu không đúng' } } },
        },
        422: validationError,
      },
    },
  },

  '/api/v1/auth/me': {
    get: {
      tags: ['Xác thực'],
      summary: 'Thông tin tài khoản hiện tại',
      security: bearer,
      responses: {
        200: okData('Hồ sơ của người đang đăng nhập', 'User'),
        401: unauthorized,
      },
    },
    put: {
      tags: ['Xác thực'],
      summary: 'Cập nhật hồ sơ',
      description: 'Không đổi được email và mật khẩu qua endpoint này.',
      security: bearer,
      requestBody: jsonBody('UpdateProfileBody'),
      responses: {
        200: okData('Hồ sơ sau khi cập nhật', 'User'),
        401: unauthorized,
        422: validationError,
      },
    },
  },

  '/api/v1/auth/logout': {
    post: {
      tags: ['Xác thực'],
      summary: 'Đăng xuất',
      description: 'Token là JWT không lưu trạng thái nên endpoint này chỉ để client dọn phiên; token cũ vẫn hợp lệ tới lúc hết hạn.',
      security: bearer,
      responses: {
        200: okMessage('Đã đăng xuất', 'Đăng xuất thành công'),
        401: unauthorized,
      },
    },
  },
};
