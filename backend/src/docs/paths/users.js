import {
  bearer, pathParam, queryParam, jsonBody, okData, okList, okPaginated, okMessage, createdData,
  adminErrors, notFound, conflict, validationError,
} from '../helpers.js';

const userId = pathParam('id', { example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

export const userPaths = {
  '/api/v1/admin/users': {
    get: {
      tags: ['Admin - Người dùng'],
      summary: 'Danh sách người dùng',
      description:
        'Bỏ trống `role` thì trả về mọi tài khoản. Trang Khách Hàng gọi `?role=customer`, '
        + 'trang Nhân Viên gọi `?role=staff,admin` — hai nhóm tài khoản này tách bạch nhau.',
      security: bearer,
      parameters: [
        queryParam(
          'role',
          { type: 'string', example: 'staff,admin' },
          'Lọc theo vai trò, phân tách bằng dấu phẩy: customer | staff | admin',
        ),
        queryParam('page', { type: 'integer', default: 1 }, 'Trang, bắt đầu từ 1'),
        queryParam('limit', { type: 'integer', default: 10, maximum: 100 }, 'Số tài khoản mỗi trang'),
      ],
      responses: {
        200: {
          description: 'Tài khoản khớp bộ lọc, mới nhất lên trước',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 10 },
                      total: { type: 'integer', example: 58 },
                      totalPages: { type: 'integer', example: 6 },
                    },
                  },
                  summary: {
                    type: 'object',
                    description:
                      'Đếm trên TOÀN BỘ tài khoản khớp bộ lọc vai trò (không phải trang đang '
                      + 'xem), cho các thẻ ở đầu trang Khách Hàng / Nhân Viên.',
                    properties: {
                      total: { type: 'integer', example: 58 },
                      active: { type: 'integer', example: 55 },
                      locked: { type: 'integer', example: 3 },
                    },
                  },
                },
              },
            },
          },
        },
        ...adminErrors,
        422: validationError,
      },
    },
    post: {
      tags: ['Admin - Người dùng'],
      summary: 'Tạo tài khoản nội bộ',
      description:
        'Admin tạo thẳng tài khoản nhân viên (hoặc admin). Không trả token — tài khoản mới '
        + 'tự đăng nhập bằng mật khẩu được cấp. Bỏ trống `role` thì mặc định là `staff`.',
      security: bearer,
      requestBody: jsonBody('CreateUserBody'),
      responses: {
        201: createdData('Tài khoản vừa tạo', 'User'),
        ...adminErrors,
        409: conflict,
        422: validationError,
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
