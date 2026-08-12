import {
  bearer, pathParam, jsonBody,
  okData, okList, okPaginated, createdData, okMessage,
  adminErrors, unauthorized, forbidden, notFound, validationError,
} from '../helpers.js';

export const couponPaths = {
  // ══════════════ Khách hàng ══════════════
  '/api/v1/customer/coupons/apply': {
    post: {
      tags: ['Tài khoản - Mã giảm giá'],
      summary: 'Áp mã lúc checkout (xem trước số tiền giảm)',
      description: 'Chỉ tính thử để hiển thị, chưa trừ lượt dùng — lượt chỉ trừ khi đơn được tạo thật.',
      security: bearer,
      requestBody: jsonBody('CouponApplyBody'),
      responses: {
        200: okData('Mã hợp lệ kèm số tiền được giảm', 'CouponPreview'),
        400: {
          description: 'Mã sai, hết hạn, hết lượt, hoặc đơn chưa đạt giá trị tối thiểu',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Mã giảm giá đã hết hạn' } } },
        },
        401: unauthorized,
        403: forbidden,
        422: validationError,
      },
    },
  },

  // ══════════════ Admin ══════════════
  '/api/v1/admin/coupons': {
    get: {
      tags: ['Admin - Mã giảm giá'],
      summary: 'Danh sách mã giảm giá',
      security: bearer,
      responses: {
        200: okPaginated('Toàn bộ mã, kể cả mã đã tắt', 'Coupon'),
        ...adminErrors,
      },
    },
    post: {
      tags: ['Admin - Mã giảm giá'],
      summary: 'Tạo mã giảm giá',
      security: bearer,
      requestBody: jsonBody('CouponCreateBody'),
      responses: {
        201: createdData('Mã vừa tạo', 'Coupon'),
        ...adminErrors,
        409: { $ref: '#/components/responses/Conflict' },
        422: validationError,
      },
    },
  },

  '/api/v1/admin/coupons/{id}': {
    put: {
      tags: ['Admin - Mã giảm giá'],
      summary: 'Cập nhật mã',
      description: 'Chỉ gửi trường muốn đổi.',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 3 })],
      requestBody: jsonBody('CouponUpdateBody'),
      responses: {
        200: okData('Mã sau khi cập nhật', 'Coupon'),
        ...adminErrors,
        404: notFound,
        422: validationError,
      },
    },
    delete: {
      tags: ['Admin - Mã giảm giá'],
      summary: 'Xóa mã',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 3 })],
      responses: {
        200: okMessage('Đã xóa mã', 'Đã xóa mã giảm giá'),
        ...adminErrors,
        404: notFound,
      },
    },
  },

  '/api/v1/admin/coupons/{id}/toggle': {
    put: {
      tags: ['Admin - Mã giảm giá'],
      summary: 'Bật / tắt mã',
      description: 'Lật cờ `active` — không cần body.',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 3 })],
      responses: {
        200: okData('Mã sau khi bật/tắt', 'Coupon'),
        ...adminErrors,
        404: notFound,
      },
    },
  },
};
