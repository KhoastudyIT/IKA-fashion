import {
  bearer, pathParam, jsonBody, okList,
  unauthorized, forbidden, notFound, validationError,
} from '../helpers.js';

export const wishlistPaths = {
  '/api/v1/customer/wishlist': {
    get: {
      tags: ['Tài khoản - Yêu thích'],
      summary: 'Danh sách yêu thích',
      description: 'Trả về nguyên sản phẩm chứ không chỉ id, để render thẳng thẻ sản phẩm.',
      security: bearer,
      responses: {
        200: okList('Sản phẩm đã thích, mới nhất trước', 'Product'),
        401: unauthorized,
      403: forbidden,
      },
    },
    post: {
      tags: ['Tài khoản - Yêu thích'],
      summary: 'Thêm vào yêu thích',
      description: 'Thêm lại sản phẩm đã có sẵn thì bỏ qua, không báo lỗi.',
      security: bearer,
      requestBody: jsonBody('WishlistAddBody'),
      responses: {
        200: okList('Danh sách sau khi thêm', 'Product'),
        401: unauthorized,
        403: forbidden,
        404: notFound,
        422: validationError,
      },
    },
  },

  '/api/v1/customer/wishlist/{productId}': {
    delete: {
      tags: ['Tài khoản - Yêu thích'],
      summary: 'Xóa khỏi yêu thích',
      security: bearer,
      parameters: [pathParam('productId', { type: 'integer', example: 1 })],
      responses: {
        200: okList('Danh sách sau khi xóa', 'Product'),
        401: unauthorized,
      403: forbidden,
      },
    },
  },
};
