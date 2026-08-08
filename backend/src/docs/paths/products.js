import {
  bearer, pathParam, queryParam, jsonBody,
  okData, okPaginated, createdData,
  adminErrors, notFound, validationError,
} from '../helpers.js';

export const productPaths = {
  // ══════════════ Công khai ══════════════
  '/api/v1/products': {
    get: {
      tags: ['Cửa hàng - Sản phẩm'],
      summary: 'Danh sách sản phẩm (lọc / sắp xếp / phân trang)',
      parameters: [
        queryParam('collection', { type: 'string' }, 'slug danh mục: ao-thun | ao-polo | quan | sale'),
        queryParam('search', { type: 'string' }, 'Tìm trong tên sản phẩm'),
        queryParam('sort', { type: 'string', enum: ['price_asc', 'price_desc', 'rating', 'sold', 'newest'], default: 'newest' }),
        queryParam('page', { type: 'integer', default: 1 }),
        queryParam('limit', { type: 'integer', default: 12, maximum: 100 }),
        queryParam('priceMin', { type: 'integer' }, 'Giá thấp nhất (VND)'),
        queryParam('priceMax', { type: 'integer' }, 'Giá cao nhất (VND)'),
        queryParam('colors', { type: 'string' }, 'CSV, ví dụ: Đen,Trắng'),
        queryParam('sizes', { type: 'string' }, 'CSV, ví dụ: M,L'),
      ],
      responses: {
        200: okPaginated('Danh sách sản phẩm kèm meta phân trang', 'Product'),
      },
    },
  },

  '/api/v1/products/handle/{handle}': {
    get: {
      tags: ['Cửa hàng - Sản phẩm'],
      summary: 'Chi tiết theo handle',
      description: 'Khai trước `/{id}` ở tầng router, không thì "handle" bị nuốt thành id.',
      parameters: [pathParam('handle', { example: 'ao-thun-cotton-basic' })],
      responses: {
        200: okData('Chi tiết sản phẩm', 'Product'),
        404: notFound,
      },
    },
  },

  '/api/v1/products/{id}': {
    get: {
      tags: ['Cửa hàng - Sản phẩm'],
      summary: 'Chi tiết theo id',
      parameters: [pathParam('id', { type: 'integer', example: 1 })],
      responses: {
        200: okData('Chi tiết sản phẩm', 'Product'),
        404: notFound,
      },
    },
  },

  // ══════════════ Admin ══════════════
  '/api/v1/admin/products': {
    post: {
      tags: ['Admin - Sản phẩm'],
      summary: 'Tạo sản phẩm',
      description: '`handle` phải là duy nhất — trùng thì trả 409.',
      security: bearer,
      requestBody: jsonBody('ProductCreateBody'),
      responses: {
        201: createdData('Sản phẩm vừa tạo', 'Product'),
        ...adminErrors,
        409: { $ref: '#/components/responses/Conflict' },
        422: validationError,
      },
    },
  },

  '/api/v1/admin/products/{id}': {
    put: {
      tags: ['Admin - Sản phẩm'],
      summary: 'Cập nhật sản phẩm',
      description: 'Chỉ gửi trường muốn đổi.',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 1 })],
      requestBody: jsonBody('ProductUpdateBody'),
      responses: {
        200: okData('Sản phẩm sau khi cập nhật', 'Product'),
        ...adminErrors,
        404: notFound,
        422: validationError,
      },
    },
    delete: {
      tags: ['Admin - Sản phẩm'],
      summary: 'Xóa sản phẩm',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 1 })],
      responses: {
        204: { description: 'Đã xóa, không có nội dung trả về' },
        ...adminErrors,
        404: notFound,
      },
    },
  },
};
