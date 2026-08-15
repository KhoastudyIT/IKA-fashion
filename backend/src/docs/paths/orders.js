import {
  bearer, pathParam, queryParam, jsonBody,
  okData, okList, okPaginated, createdData,
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

  '/api/v1/customer/orders/{id}/invoice': {
    get: {
      tags: ['Tài khoản - Đơn hàng'],
      summary: 'Hoá đơn PDF của đơn',
      description:
        'Trả về file PDF (không phải JSON) nên phải gọi bằng fetch kèm token rồi mở blob — '
        + 'thẻ `<a href>` sẽ không gắn được header Authorization.\n\n'
        + 'Hoá đơn in tên cửa hàng, thông tin người nhận, bảng sản phẩm kèm mức giảm của từng '
        + 'dòng và tổng thanh toán. Khách chỉ in được đơn của mình.',
      security: bearer,
      parameters: [pathParam('id', { example: 'd73020c9-1f5e-4c2a-9a10-2b7f6c8e4d11' })],
      responses: {
        200: {
          description: 'File PDF hoá đơn',
          content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
        },
        401: unauthorized,
        403: forbidden,
        404: notFound,
      },
    },
  },

  '/api/v1/customer/orders/{id}/cancel': {
    patch: {
      tags: ['Tài khoản - Đơn hàng'],
      summary: 'Khách tự hủy đơn',
      description:
        'Chỉ hủy được đơn của chính mình và chỉ khi đơn còn ở `pending` hoặc `confirmed` — '
        + 'hàng chưa rời cửa hàng.\n\n'
        + '- `shipped`: phải liên hệ cửa hàng, không tự hủy được.\n'
        + '- `completed`: dùng luồng trả / đổi hàng (`POST /customer/returns`).\n\n'
        + 'Hủy thành công sẽ HOÀN tồn kho và hoàn suất flash sale, giống hệt khi admin hủy đơn; '
        + 'bấm nhiều lần cũng chỉ hoàn một lần. Lượt dùng mã giảm giá KHÔNG được trả lại.',
      security: bearer,
      parameters: [pathParam('id', { example: 'd73020c9-1f5e-4c2a-9a10-2b7f6c8e4d11' })],
      requestBody: jsonBody('OrderCancelBody'),
      responses: {
        200: okData('Đơn hàng sau khi hủy', 'Order'),
        400: {
          description: 'Đơn ở trạng thái không tự hủy được',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Đơn đã được giao cho đơn vị vận chuyển nên không tự hủy được. Vui lòng liên hệ cửa hàng để được hỗ trợ.' },
            },
          },
        },
        401: unauthorized,
        403: {
          description: 'Đơn hàng không thuộc về khách đang đăng nhập',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Bạn không có quyền hủy đơn hàng này' },
            },
          },
        },
        404: notFound,
        422: validationError,
      },
    },
  },

  // ══════════════ Admin ══════════════
  '/api/v1/admin/orders': {
    get: {
      tags: ['Admin - Đơn hàng'],
      summary: 'Tất cả đơn hàng',
      description:
        'Tìm kiếm chạy ở SERVER trên toàn bộ đơn, không phải lọc trong trang đang xem — '
        + 'nên tra được đơn nằm ở trang bất kỳ.',
      security: bearer,
      parameters: [
        queryParam(
          'status',
          { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'completed', 'cancelled', 'returned'] },
          'Bỏ trống thì lấy hết',
        ),
        queryParam(
          'search',
          { type: 'string', example: 'D73020C9' },
          'Tìm theo mã đơn (8 ký tự đầu hoặc UUID đầy đủ, có thể kèm dấu #), SĐT, địa chỉ, tên hoặc email khách',
        ),
        queryParam('page', { type: 'integer', default: 1 }, 'Trang, bắt đầu từ 1'),
        queryParam('limit', { type: 'integer', default: 15, maximum: 100 }, 'Số đơn mỗi trang'),
      ],
      responses: {
        200: {
          description: 'Đơn hàng khớp bộ lọc, mới nhất lên trước',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 15 },
                      total: { type: 'integer', example: 81 },
                      totalPages: { type: 'integer', example: 6 },
                    },
                  },
                  summary: {
                    type: 'object',
                    description:
                      'Thống kê trên TOÀN BỘ đơn khớp bộ lọc (không phải trang đang xem), '
                      + 'cho các thẻ ở đầu trang quản lý đơn. `revenue` chỉ tính đơn đã hoàn thành.',
                    properties: {
                      total: { type: 'integer', example: 81 },
                      pending: { type: 'integer', example: 1 },
                      completed: { type: 'integer', example: 28 },
                      revenue: { type: 'integer', example: 15249000 },
                    },
                  },
                },
              },
            },
          },
        },
        ...adminErrors,
        422: validationError,
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

  '/api/v1/admin/orders/{id}/invoice': {
    get: {
      tags: ['Admin - Đơn hàng'],
      summary: 'Hoá đơn PDF của một đơn bất kỳ',
      description: 'Giống bản của khách nhưng admin và nhân viên in được mọi đơn.',
      security: bearer,
      parameters: [pathParam('id', { example: 'd73020c9-1f5e-4c2a-9a10-2b7f6c8e4d11' })],
      responses: {
        200: {
          description: 'File PDF hoá đơn',
          content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
        },
        ...adminErrors,
        404: notFound,
      },
    },
  },

  '/api/v1/admin/orders/{id}/status': {
    put: {
      tags: ['Admin - Đơn hàng'],
      summary: 'Cập nhật trạng thái đơn',
      description:
        'Gửi `status`, `paymentStatus`, hoặc cả hai.\n\n'
        + '- Chuyển sang `cancelled` sẽ HOÀN tồn kho và hoàn suất flash sale; chỉ hoàn một lần '
        + 'kể cả bấm nhiều lần.\n'
        + '- Chuyển sang `completed` tự đặt `paymentStatus = paid` (cửa hàng thu tiền khi giao). '
        + 'Ngược lại, gỡ thanh toán của đơn đã hoàn thành bị từ chối.\n'
        + '- KHÔNG đặt được `returned` ở đây — trạng thái đó chỉ đến qua luồng duyệt yêu cầu '
        + 'trả hàng, để không ai đổi trạng thái mà quên hoàn kho.',
      security: bearer,
      parameters: [pathParam('id', { example: 'DH1720051200000' })],
      requestBody: jsonBody('OrderUpdateStatusBody'),
      responses: {
        200: okData('Đơn hàng sau khi cập nhật', 'Order'),
        400: {
          description: 'Gỡ thanh toán của đơn đã hoàn thành',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Đơn đã hoàn thành thì phải ở trạng thái đã thanh toán. Nếu cần hoàn tiền, hãy xử lý qua yêu cầu trả hàng.' },
            },
          },
        },
        ...adminErrors,
        404: notFound,
        422: validationError,
      },
    },
  },
};
