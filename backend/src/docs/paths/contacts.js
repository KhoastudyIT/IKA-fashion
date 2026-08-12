import {
  bearer, pathParam, queryParam, jsonBody,
  okData, okPaginated, okMessage, createdData,
  adminErrors, notFound, validationError,
} from '../helpers.js';

const contactId = pathParam('id', { type: 'integer', example: 5 });

export const contactPaths = {
  // ══════════════ Công khai ══════════════
  '/api/v1/contacts': {
    post: {
      tags: ['Cửa hàng - Liên hệ'],
      summary: 'Gửi yêu cầu liên hệ',
      description:
        'KHÔNG yêu cầu đăng nhập — người gửi form Liên hệ hầu hết là khách vãng lai. '
        + 'Số điện thoại để trống được, nhưng đã nhập thì phải đúng định dạng Việt Nam.',
      requestBody: jsonBody('ContactCreateBody'),
      responses: {
        201: createdData('Yêu cầu vừa gửi', 'Contact'),
        422: validationError,
      },
    },
  },

  // ══════════════ Admin ══════════════
  '/api/v1/admin/contacts': {
    get: {
      tags: ['Admin - Liên hệ'],
      summary: 'Danh sách yêu cầu liên hệ',
      security: bearer,
      parameters: [
        queryParam('status', { type: 'string', enum: ['new', 'processing', 'resolved'] }, 'Lọc theo trạng thái'),
        queryParam('search', { type: 'string' }, 'Tìm theo tên, email, chủ đề hoặc nội dung'),
        queryParam('sort', { type: 'string', enum: ['newest', 'oldest'], default: 'newest' }, 'Thứ tự theo ngày gửi'),
        queryParam('page', { type: 'integer', default: 1 }, 'Trang, bắt đầu từ 1'),
        queryParam('limit', { type: 'integer', default: 20, maximum: 100 }, 'Số yêu cầu mỗi trang'),
      ],
      responses: {
        200: okPaginated('Yêu cầu khớp bộ lọc', 'Contact'),
        ...adminErrors,
        422: validationError,
      },
    },
  },

  '/api/v1/admin/contacts/stats': {
    get: {
      tags: ['Admin - Liên hệ'],
      summary: 'Đếm theo trạng thái',
      description: 'Dùng cho badge "chưa xử lý" trên menu admin.',
      security: bearer,
      responses: {
        200: okData('Số lượng theo từng trạng thái', 'ContactStats'),
        ...adminErrors,
      },
    },
  },

  '/api/v1/admin/contacts/{id}': {
    get: {
      tags: ['Admin - Liên hệ'],
      summary: 'Chi tiết một yêu cầu',
      security: bearer,
      parameters: [contactId],
      responses: {
        200: okData('Yêu cầu liên hệ', 'Contact'),
        ...adminErrors,
        404: notFound,
      },
    },
    put: {
      tags: ['Admin - Liên hệ'],
      summary: 'Cập nhật trạng thái / ghi chú',
      description: 'Chỉ gửi trường muốn đổi — sửa trạng thái không làm mất ghi chú đang có.',
      security: bearer,
      parameters: [contactId],
      requestBody: jsonBody('ContactUpdateBody'),
      responses: {
        200: okData('Yêu cầu sau khi cập nhật', 'Contact'),
        ...adminErrors,
        404: notFound,
        422: validationError,
      },
    },
    delete: {
      tags: ['Admin - Liên hệ'],
      summary: 'Xóa yêu cầu liên hệ',
      security: bearer,
      parameters: [contactId],
      responses: {
        200: okMessage('Đã xóa', 'Đã xóa yêu cầu liên hệ'),
        ...adminErrors,
        404: notFound,
      },
    },
  },
};
