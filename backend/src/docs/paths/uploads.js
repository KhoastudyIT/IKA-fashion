import { bearer, createdData, okMessage, adminErrors, notFound, unauthorized, forbidden } from '../helpers.js';

export const uploadPaths = {
  // Khách hàng chỉ được ghi vào đúng thư mục 'returns' (ảnh kèm yêu cầu trả/đổi).
  '/api/v1/customer/uploads/{type}': {
    post: {
      tags: ['Tài khoản - Tải ảnh'],
      summary: 'Khách tải ảnh cho yêu cầu trả/đổi (multipart)',
      description:
        'Chỉ nhận `type = returns`; mọi thư mục khác trả 403 và chặn TRƯỚC khi ghi file. '
        + 'Đường dẫn trả về dùng làm phần tử của mảng `images` khi gọi `POST /customer/returns`.',
      security: bearer,
      parameters: [
        {
          name: 'type', in: 'path', required: true,
          schema: { type: 'string', enum: ['returns'] },
          example: 'returns',
          description: 'Thư mục đích — khách chỉ được ghi vào returns',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: { type: 'string', format: 'binary', description: 'JPG / PNG / WEBP, tối đa 5MB' },
              },
            },
          },
        },
      },
      responses: {
        201: createdData('Ảnh đã lưu', 'UploadResult'),
        400: {
          description: 'Sai định dạng hoặc quá 5MB',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Ảnh chỉ chấp nhận JPG, PNG hoặc WEBP' } } },
        },
        401: unauthorized,
        403: {
          description: 'Cố ghi vào thư mục không dành cho khách',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Bạn không được tải ảnh vào mục này' } } },
        },
      },
    },
  },

  '/api/v1/admin/uploads/{type}': {
    post: {
      tags: ['Admin - Tải ảnh'],
      summary: 'Tải ảnh lên (multipart)',
      description: 'Trả về đường dẫn tương đối `/uploads/<type>/<tên-do-server-sinh>` để lưu vào DB. Tên file client gửi lên bị bỏ qua nên không lo trùng hay path traversal. Ảnh được phục vụ tĩnh ngay tại đường dẫn đó.',
      security: bearer,
      parameters: [
        {
          name: 'type', in: 'path', required: true,
          schema: { type: 'string', enum: ['news', 'products', 'collections', 'settings', 'returns'] },
          example: 'news',
          description: 'Thư mục đích — khớp với IMAGE_FOLDERS ở upload.service.js',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: { type: 'string', format: 'binary', description: 'JPG / PNG / WEBP, tối đa 5MB' },
              },
            },
          },
        },
      },
      responses: {
        201: createdData('Ảnh đã lưu', 'UploadResult'),
        400: {
          description: 'Sai định dạng, quá 5MB, hoặc `type` không nằm trong news | products | collections',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Ảnh vượt quá dung lượng cho phép (tối đa 5MB)' } } },
        },
        ...adminErrors,
      },
    },
  },

  '/api/v1/admin/uploads': {
    delete: {
      tags: ['Admin - Tải ảnh'],
      summary: 'Xóa ảnh đã tải lên',
      description: 'Chỉ xóa được file nằm trong thư mục uploads — đường dẫn ngoài phạm vi đó bị từ chối.',
      security: bearer,
      parameters: [
        {
          name: 'url', in: 'query', required: true,
          schema: { type: 'string' },
          example: '/uploads/news/1720051200000-abc123.jpg',
          description: 'Đường dẫn ảnh trả về lúc upload',
        },
      ],
      responses: {
        200: okMessage('Đã xóa ảnh', 'Đã xóa ảnh'),
        400: {
          description: 'Đường dẫn không hợp lệ',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Đường dẫn không hợp lệ' } } },
        },
        ...adminErrors,
        404: notFound,
      },
    },
  },
};
