import {
  bearer, pathParam, queryParam, jsonBody,
  okData, okList, okPaginated, createdData,
  adminErrors, notFound, validationError,
} from '../helpers.js';

const newsFilters = [
  queryParam('search', { type: 'string' }, 'Tìm trong tiêu đề và tóm tắt (có phân biệt dấu tiếng Việt)'),
  queryParam('category', { type: 'string' }, 'slug danh mục: xu-huong | phoi-do | bao-quan | tin-cua-hang'),
  queryParam('sort', { type: 'string', enum: ['newest', 'oldest'], default: 'newest' }),
  queryParam('page', { type: 'integer', default: 1 }),
  queryParam('limit', { type: 'integer', default: 12, maximum: 100 }),
];

export const newsPaths = {
  // ══════════════ Công khai ══════════════
  '/api/v1/news': {
    get: {
      tags: ['Cửa hàng - Tin tức'],
      summary: 'Danh sách bài viết ĐÃ ĐĂNG (bài nháp không lộ ra)',
      description: 'Không kèm trường `content` cho nhẹ — lấy nội dung đầy đủ ở endpoint chi tiết.',
      parameters: newsFilters,
      responses: {
        200: okPaginated('Danh sách bài viết kèm meta phân trang', 'NewsArticle'),
      },
    },
  },

  '/api/v1/news/categories': {
    get: {
      tags: ['Cửa hàng - Tin tức'],
      summary: 'Danh mục bài viết + số bài đã đăng',
      description: 'Khai trước `/{idOrSlug}` ở tầng router, không thì "categories" bị nuốt thành slug bài viết.',
      responses: {
        200: okList('Danh mục bài viết', 'NewsCategory'),
      },
    },
  },

  '/api/v1/news/{idOrSlug}': {
    get: {
      tags: ['Cửa hàng - Tin tức'],
      summary: 'Chi tiết bài viết (kèm content)',
      description: 'Nhận cả id lẫn slug: `/news/12` hoặc `/news/xu-huong-thoi-trang-nam-thu-dong-2026`. Bài nháp trả 404.',
      parameters: [pathParam('idOrSlug', { example: 'xu-huong-thoi-trang-nam-thu-dong-2026' })],
      responses: {
        200: okData('Bài viết đầy đủ nội dung', 'NewsArticleDetail'),
        404: notFound,
      },
    },
  },

  // ══════════════ Admin ══════════════
  '/api/v1/admin/news': {
    get: {
      tags: ['Admin - Tin tức'],
      summary: 'Danh sách bài viết (gồm cả bài nháp)',
      security: bearer,
      parameters: [
        ...newsFilters,
        queryParam('status', { type: 'string', enum: ['draft', 'published'] }, 'Bỏ trống thì lấy cả hai'),
      ],
      responses: {
        200: okPaginated('Danh sách bài viết kèm meta phân trang', 'NewsArticle'),
        ...adminErrors,
      },
    },
    post: {
      tags: ['Admin - Tin tức'],
      summary: 'Tạo bài viết',
      description: 'Bỏ trống `slug` thì tự sinh từ tiêu đề (bỏ dấu tiếng Việt, trùng thì thêm hậu tố `-2`). Thẻ HTML trong `content` bị loại bỏ khi lưu.',
      security: bearer,
      requestBody: jsonBody('NewsCreateBody'),
      responses: {
        201: createdData('Bài viết vừa tạo', 'NewsArticleDetail'),
        400: {
          description: 'Danh mục không tồn tại',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Danh mục không tồn tại' } } },
        },
        ...adminErrors,
        422: validationError,
      },
    },
  },

  '/api/v1/admin/news/{id}': {
    get: {
      tags: ['Admin - Tin tức'],
      summary: 'Chi tiết bài viết (xem được cả bài nháp)',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 12 })],
      responses: {
        200: okData('Bài viết đầy đủ nội dung', 'NewsArticleDetail'),
        ...adminErrors,
        404: notFound,
      },
    },
    put: {
      tags: ['Admin - Tin tức'],
      summary: 'Cập nhật bài viết',
      description: 'Chỉ gửi trường muốn đổi. Slug chỉ thay khi truyền `slug` — đổi tiêu đề không phá URL đã công khai.',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 12 })],
      requestBody: jsonBody('NewsUpdateBody'),
      responses: {
        200: okData('Bài viết sau khi cập nhật', 'NewsArticleDetail'),
        ...adminErrors,
        404: notFound,
        422: validationError,
      },
    },
    delete: {
      tags: ['Admin - Tin tức'],
      summary: 'Xóa bài viết',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 12 })],
      responses: {
        204: { description: 'Đã xóa, không có nội dung trả về' },
        ...adminErrors,
        404: notFound,
      },
    },
  },

  '/api/v1/admin/news/{id}/status': {
    patch: {
      tags: ['Admin - Tin tức'],
      summary: 'Đổi trạng thái đăng / nháp',
      description: 'Tách riêng khỏi PUT để nút bật-tắt trên dashboard không phải gửi lại cả bài.',
      security: bearer,
      parameters: [pathParam('id', { type: 'integer', example: 12 })],
      requestBody: jsonBody('NewsStatusBody'),
      responses: {
        200: okData('Bài viết sau khi đổi trạng thái', 'NewsArticleDetail'),
        ...adminErrors,
        404: notFound,
        422: validationError,
      },
    },
  },
};
