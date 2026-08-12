import {
  bearer, pathParam, jsonBody,
  okData, okList, createdData,
  adminErrors, notFound, conflict, validationError,
} from '../helpers.js';

const saleId = pathParam('id', { type: 'integer', example: 1 });

/** Lỗi trả về khi chương trình đã kết thúc — dùng lại ở update và toggle. */
const frozen = {
  description: 'Chương trình đã kết thúc nên không sửa được nữa',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        message: 'Chương trình đã kết thúc lúc 20:24 12/8/2026 nên không sửa được nữa. Hãy tạo chương trình mới.',
      },
    },
  },
};

export const flashSalePaths = {
  // ══════════════ Công khai ══════════════
  '/api/v1/flash-sales/active': {
    get: {
      tags: ['Cửa hàng - Flash Sale'],
      summary: 'Các chương trình đang chạy',
      description:
        'Chỉ trả về chương trình đang bật, trong khung giờ và CÒN SUẤT (`sold < stock`). '
        + 'Trang Ưu Đãi đọc từ đây; chưa có chương trình nào thì trả mảng rỗng.',
      responses: {
        200: okList('Chương trình đang chạy, rẻ nhất lên trước', 'FlashSale'),
      },
    },
  },

  // ══════════════ Admin ══════════════
  '/api/v1/admin/flash-sales': {
    get: {
      tags: ['Admin - Flash Sale'],
      summary: 'Danh sách toàn bộ chương trình',
      description: 'Gồm cả chương trình đã tạm ngưng và đã kết thúc, mới nhất lên trước.',
      security: bearer,
      responses: {
        200: okList('Toàn bộ chương trình', 'FlashSale'),
        ...adminErrors,
      },
    },
    post: {
      tags: ['Admin - Flash Sale'],
      summary: 'Tạo chương trình cho một sản phẩm',
      description:
        'Giá flash phải thấp hơn giá đang bán. Một sản phẩm chỉ được có một chương trình '
        + 'đang bật trong cùng khung giờ — ràng buộc EXCLUDE trong DB chặn trường hợp chồng lấn.',
      security: bearer,
      requestBody: jsonBody('FlashSaleCreateBody'),
      responses: {
        201: createdData('Chương trình vừa tạo', 'FlashSale'),
        400: {
          description: 'Giá flash không thấp hơn giá đang bán',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Giá flash sale phải thấp hơn giá đang bán của "Áo Thun Trắng Premium" (299.000 đ)' },
            },
          },
        },
        ...adminErrors,
        409: conflict,
        422: validationError,
      },
    },
  },

  '/api/v1/admin/flash-sales/{id}': {
    get: {
      tags: ['Admin - Flash Sale'],
      summary: 'Chi tiết một chương trình',
      security: bearer,
      parameters: [saleId],
      responses: {
        200: okData('Chương trình', 'FlashSale'),
        ...adminErrors,
        404: notFound,
      },
    },
    put: {
      tags: ['Admin - Flash Sale'],
      summary: 'Sửa chương trình',
      description: 'Chỉ gửi trường muốn đổi. Chương trình ĐÃ KẾT THÚC thì bị từ chối.',
      security: bearer,
      parameters: [saleId],
      requestBody: jsonBody('FlashSaleUpdateBody'),
      responses: {
        200: okData('Chương trình sau khi sửa', 'FlashSale'),
        400: frozen,
        ...adminErrors,
        404: notFound,
        409: conflict,
        422: validationError,
      },
    },
  },

  '/api/v1/admin/flash-sales/{id}/toggle': {
    patch: {
      tags: ['Admin - Flash Sale'],
      summary: 'Tạm ngưng / bật lại',
      description:
        'Tắt tạm thời, bật lại được. Không có endpoint XOÁ: đơn hàng cũ trỏ về chương trình '
        + 'để giải thích đơn giá, xoá đi là mất dấu vết đó.',
      security: bearer,
      parameters: [saleId],
      responses: {
        200: okData('Chương trình sau khi đổi trạng thái', 'FlashSale'),
        400: frozen,
        ...adminErrors,
        404: notFound,
        409: conflict,
      },
    },
  },

  '/api/v1/admin/flash-sales/{id}/end': {
    patch: {
      tags: ['Admin - Flash Sale'],
      summary: 'Kết thúc ngay lập tức',
      description:
        'Chốt `endsAt` về hiện tại — giá trở lại niêm yết ngay và chương trình ĐÓNG BĂNG, '
        + 'không sửa cũng không bật/tắt được nữa. Chương trình chưa tới giờ chạy thì `startsAt` '
        + 'cũng được kéo về hiện tại để khung giờ không bị đảo ngược.',
      security: bearer,
      parameters: [saleId],
      responses: {
        200: okData('Chương trình sau khi kết thúc', 'FlashSale'),
        400: {
          description: 'Chương trình đã kết thúc từ trước',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Chương trình này đã kết thúc rồi' },
            },
          },
        },
        ...adminErrors,
        404: notFound,
      },
    },
  },
};
