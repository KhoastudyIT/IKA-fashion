import {
  bearer, pathParam, jsonBody,
  okData, okList, okPaginated, createdData, okMessage,
  adminErrors, notFound, conflict,
} from '../helpers.js';

export const collectionPaths = {
  // ══════════════ Công khai ══════════════
  '/api/v1/collections': {
    get: {
      tags: ['Cửa hàng - Danh mục'],
      summary: 'Danh sách danh mục',
      description: 'Kèm `productCount` để hiển thị số sản phẩm ngay trên bộ lọc.',
      responses: {
        200: okPaginated('Toàn bộ danh mục', 'Collection'),
      },
    },
  },

  '/api/v1/collections/{slug}': {
    get: {
      tags: ['Cửa hàng - Danh mục'],
      summary: 'Danh mục kèm toàn bộ sản phẩm',
      description: 'Trả về hết sản phẩm của danh mục, không phân trang — dùng cho trang /collections/{slug}.',
      parameters: [pathParam('slug', { example: 'ao-thun' })],
      responses: {
        200: okData('Danh mục kèm mảng products', 'CollectionWithProducts'),
        404: notFound,
      },
    },
  },

  // ══════════════ Admin ══════════════
  '/api/v1/admin/collections': {
    post: {
      tags: ['Admin - Danh mục'],
      summary: 'Tạo danh mục',
      description: '`slug` phải là duy nhất — trùng thì trả 409.',
      security: bearer,
      requestBody: jsonBody('CollectionCreateBody'),
      responses: {
        201: createdData('Danh mục vừa tạo', 'Collection'),
        ...adminErrors,
        409: conflict,
      },
    },
  },

  '/api/v1/admin/collections/{id}': {
    put: {
      tags: ['Admin - Danh mục'],
      summary: 'Cập nhật danh mục',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 1 })],
      requestBody: jsonBody('CollectionUpdateBody'),
      responses: {
        200: okData('Danh mục sau khi cập nhật', 'Collection'),
        ...adminErrors,
        404: notFound,
      },
    },
    delete: {
      tags: ['Admin - Danh mục'],
      summary: 'Xóa danh mục',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 1 })],
      responses: {
        200: okMessage('Đã xóa danh mục', 'Xóa danh mục thành công'),
        ...adminErrors,
        404: notFound,
      },
    },
  },
};
