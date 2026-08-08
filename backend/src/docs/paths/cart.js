import {
  bearer, pathParam, jsonBody, okData,
  unauthorized, forbidden, notFound, validationError,
} from '../helpers.js';

const itemKey = pathParam('key', {
  example: '1|M|Trắng',
  description: 'Dạng productId|size|color, nhớ encode: 1%7CM%7CTr%E1%BA%AFng',
});

export const cartPaths = {
  '/api/v1/customer/cart': {
    get: {
      tags: ['Tài khoản - Giỏ hàng'],
      summary: 'Xem giỏ hàng',
      security: bearer,
      responses: {
        200: okData('Giỏ hàng hiện tại kèm subtotal', 'Cart'),
        401: unauthorized,
      403: forbidden,
      },
    },
    delete: {
      tags: ['Tài khoản - Giỏ hàng'],
      summary: 'Xóa toàn bộ giỏ hàng',
      security: bearer,
      responses: {
        200: okData('Giỏ hàng rỗng sau khi xóa', 'Cart'),
        401: unauthorized,
      403: forbidden,
      },
    },
  },

  '/api/v1/customer/cart/items': {
    post: {
      tags: ['Tài khoản - Giỏ hàng'],
      summary: 'Thêm sản phẩm vào giỏ',
      description: 'Thêm lại đúng sản phẩm + size + màu đã có thì cộng dồn số lượng chứ không tạo dòng mới.',
      security: bearer,
      requestBody: jsonBody('CartAddItemBody'),
      responses: {
        200: okData('Giỏ hàng sau khi thêm', 'Cart'),
        400: {
          description: 'Size hoặc màu không nằm trong danh sách của sản phẩm',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Size không hợp lệ' } } },
        },
        401: unauthorized,
        403: forbidden,
        404: notFound,
        422: validationError,
      },
    },
  },

  '/api/v1/customer/cart/items/{key}': {
    put: {
      tags: ['Tài khoản - Giỏ hàng'],
      summary: 'Cập nhật số lượng một dòng giỏ hàng',
      description: 'Đặt số lượng tuyệt đối, không cộng dồn. Muốn bỏ hẳn thì dùng DELETE.',
      security: bearer,
      parameters: [itemKey],
      requestBody: jsonBody('CartUpdateItemBody'),
      responses: {
        200: okData('Giỏ hàng sau khi cập nhật', 'Cart'),
        401: unauthorized,
        403: forbidden,
        404: notFound,
        422: validationError,
      },
    },
    delete: {
      tags: ['Tài khoản - Giỏ hàng'],
      summary: 'Xóa một dòng khỏi giỏ',
      security: bearer,
      parameters: [itemKey],
      responses: {
        200: okData('Giỏ hàng sau khi xóa', 'Cart'),
        401: unauthorized,
        403: forbidden,
        404: notFound,
      },
    },
  },
};
