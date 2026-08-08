import {
  bearer, pathParam, jsonBody,
  okData, okList, createdData, okMessage,
  adminErrors, unauthorized, notFound, validationError,
} from '../helpers.js';

export const reviewPaths = {
  // ══════════════ Công khai ══════════════
  '/api/v1/reviews/product/{productId}': {
    get: {
      tags: ['Cửa hàng - Đánh giá'],
      summary: 'Đánh giá đã duyệt của một sản phẩm',
      description: 'Chỉ trả về đánh giá `approved = true`. Rating trung bình của sản phẩm cũng chỉ tính trên nhóm này.',
      parameters: [pathParam('productId', { type: 'integer', example: 1 })],
      responses: {
        200: okList('Đánh giá đã duyệt, mới nhất trước', 'Review'),
      },
    },
  },

  // ══════════════ Khách hàng ══════════════
  '/api/v1/customer/reviews/eligibility/{productId}': {
    get: {
      tags: ['Tài khoản - Đánh giá'],
      summary: 'Kiểm tra có được đánh giá không',
      description: 'Chỉ khách đã mua **và** đơn ở trạng thái đã nhận hàng mới được đánh giá. Gọi trước khi hiện form.',
      security: bearer,
      parameters: [pathParam('productId', { type: 'integer', example: 1 })],
      responses: {
        200: {
          description: 'Kết quả kiểm tra',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { type: 'object', properties: { canReview: { type: 'boolean', example: true } } } } },
                ],
              },
            },
          },
        },
        401: unauthorized,
      },
    },
  },

  '/api/v1/customer/reviews': {
    post: {
      tags: ['Tài khoản - Đánh giá'],
      summary: 'Gửi đánh giá',
      description: 'Bài gửi lên ở trạng thái chờ duyệt, chưa hiện ngoài trang sản phẩm cho tới khi admin duyệt.',
      security: bearer,
      requestBody: jsonBody('ReviewCreateBody'),
      responses: {
        201: createdData('Đánh giá vừa gửi — chờ admin duyệt', 'Review'),
        401: unauthorized,
        403: {
          description: 'Chưa mua hoặc chưa nhận hàng sản phẩm này',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Bạn cần mua và nhận hàng trước khi đánh giá' } } },
        },
        422: validationError,
      },
    },
  },

  // ══════════════ Admin ══════════════
  '/api/v1/admin/reviews': {
    get: {
      tags: ['Admin - Đánh giá'],
      summary: 'Tất cả đánh giá (gồm cả chưa duyệt)',
      description: 'Kèm `productName` và `approved` để lọc ngay trên dashboard.',
      security: bearer,
      responses: {
        200: okList('Toàn bộ đánh giá', 'Review'),
        ...adminErrors,
      },
    },
  },

  '/api/v1/admin/reviews/{id}/approve': {
    put: {
      tags: ['Admin - Đánh giá'],
      summary: 'Duyệt / ẩn đánh giá',
      description: 'Lật cờ `approved` — không cần body. Duyệt xong rating trung bình của sản phẩm được tính lại.',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 7 })],
      responses: {
        200: okData('Đánh giá sau khi duyệt/ẩn', 'Review'),
        ...adminErrors,
        404: notFound,
      },
    },
  },

  '/api/v1/admin/reviews/{id}/reply': {
    put: {
      tags: ['Admin - Đánh giá'],
      summary: 'Phản hồi đánh giá',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 7 })],
      requestBody: jsonBody('ReviewReplyBody'),
      responses: {
        200: okData('Đánh giá kèm phản hồi', 'Review'),
        ...adminErrors,
        404: notFound,
        422: validationError,
      },
    },
  },

  '/api/v1/admin/reviews/{id}': {
    delete: {
      tags: ['Admin - Đánh giá'],
      summary: 'Xóa đánh giá',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 7 })],
      responses: {
        200: okMessage('Đã xóa đánh giá', 'Đã xóa đánh giá'),
        ...adminErrors,
        404: notFound,
      },
    },
  },
};
