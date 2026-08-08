import {
  bearer, pathParam, queryParam, jsonBody,
  okData, okList, createdData,
  adminErrors, unauthorized, forbidden, notFound, validationError,
} from '../helpers.js';

export const orderPaths = {
  // ══════════════ Khách hàng ══════════════
  '/api/v1/customer/orders': {
    get: {
      tags: ['Tài khoản - Đơn hàng'],
      summary: 'Đơn hàng của tôi',
      description: 'Sắp xếp mới nhất trước.',
      security: bearer,
      responses: {
        200: okList('Toàn bộ đơn của người đang đăng nhập', 'Order'),
        401: unauthorized,
      403: forbidden,
      },
    },
    post: {
      tags: ['Tài khoản - Đơn hàng'],
      summary: 'Đặt hàng từ giỏ',
      description: 'Lấy nguyên giỏ hàng hiện tại làm items rồi dọn giỏ. Giỏ rỗng thì trả 400. Truyền `couponCode` để trừ thẳng vào tổng tiền.',
      security: bearer,
      requestBody: jsonBody('OrderCreateBody'),
      responses: {
        201: createdData('Đơn hàng vừa tạo', 'Order'),
        400: {
          description: 'Giỏ hàng rỗng, không đủ tồn kho, hoặc mã giảm giá không dùng được',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Giỏ hàng đang trống' } } },
        },
        401: unauthorized,
        403: forbidden,
        422: validationError,
      },
    },
  },

  '/api/v1/customer/orders/{id}': {
    get: {
      tags: ['Tài khoản - Đơn hàng'],
      summary: 'Chi tiết đơn của tôi',
      description: 'Chỉ xem được đơn của chính mình — đơn của người khác trả 404 chứ không phải 403.',
      security: bearer,
      parameters: [pathParam('id', { example: 'DH1720051200000' })],
      responses: {
        200: okData('Chi tiết đơn hàng', 'Order'),
        401: unauthorized,
        403: forbidden,
        404: notFound,
      },
    },
  },

  // ══════════════ Admin ══════════════
  '/api/v1/admin/orders': {
    get: {
      tags: ['Admin - Đơn hàng'],
      summary: 'Tất cả đơn hàng',
      security: bearer,
      parameters: [
        queryParam('status', { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'] }, 'Bỏ trống thì lấy hết'),
      ],
      responses: {
        200: okList('Toàn bộ đơn hàng', 'Order'),
        ...adminErrors,
      },
    },
  },

  '/api/v1/admin/orders/{id}': {
    get: {
      tags: ['Admin - Đơn hàng'],
      summary: 'Chi tiết một đơn bất kỳ',
      security: bearer,
      parameters: [pathParam('id', { example: 'DH1720051200000' })],
      responses: {
        200: okData('Chi tiết đơn hàng', 'Order'),
        ...adminErrors,
        404: notFound,
      },
    },
  },

  '/api/v1/admin/orders/{id}/status': {
    put: {
      tags: ['Admin - Đơn hàng'],
      summary: 'Cập nhật trạng thái đơn',
      description: 'Gửi `status`, `paymentStatus`, hoặc cả hai.',
      security: bearer,
      parameters: [pathParam('id', { example: 'DH1720051200000' })],
      requestBody: jsonBody('OrderUpdateStatusBody'),
      responses: {
        200: okData('Đơn hàng sau khi cập nhật', 'Order'),
        ...adminErrors,
        404: notFound,
        422: validationError,
      },
    },
  },
};
