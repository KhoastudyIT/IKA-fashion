import {
  bearer, pathParam, jsonBody, okData, okList, okMessage,
  adminErrors, notFound, validationError,
} from '../helpers.js';

const userId = pathParam('id', { example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

export const userPaths = {
  '/api/v1/admin/users': {
    get: {
      tags: ['Admin - Người dùng'],
      summary: 'Danh sách người dùng',
      security: bearer,
      responses: {
        200: okList('Toàn bộ tài khoản', 'User'),
        ...adminErrors,
      },
    },
  },

  '/api/v1/admin/users/{id}': {
    delete: {
      tags: ['Admin - Người dùng'],
      summary: 'Xóa người dùng',
      security: bearer,
      parameters: [userId],
      responses: {
        200: okMessage('Đã xóa tài khoản', 'Xóa người dùng thành công'),
        ...adminErrors,
        404: notFound,
      },
    },
  },

  '/api/v1/admin/users/{id}/toggle-lock': {
    put: {
      tags: ['Admin - Người dùng'],
      summary: 'Khóa / mở khóa tài khoản',
      description: 'Lật cờ `isLocked` — không cần body. Tài khoản bị khóa không đăng nhập được.',
      security: bearer,
      parameters: [userId],
      responses: {
        200: okData('Tài khoản sau khi khóa/mở', 'User'),
        ...adminErrors,
        404: notFound,
      },
    },
  },

  '/api/v1/admin/users/{id}/role': {
    put: {
      tags: ['Admin - Người dùng'],
      summary: 'Đổi vai trò',
      description: 'Không tự hạ quyền chính mình được — tránh trường hợp hệ thống mất sạch admin.',
      security: bearer,
      parameters: [userId],
      requestBody: jsonBody('UserRoleBody'),
      responses: {
        200: okData('Tài khoản sau khi đổi vai trò', 'User'),
        400: {
          description: 'Tự đổi vai trò của chính mình',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Không thể tự đổi vai trò của chính mình' } } },
        },
        ...adminErrors,
        404: notFound,
        422: validationError,
      },
    },
  },
};
