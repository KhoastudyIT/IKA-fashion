import {
  bearer, pathParam, queryParam, jsonBody,
  okData, okList, okPaginated, createdData,
  adminErrors, unauthorized, forbidden, notFound, conflict, validationError,
} from '../helpers.js';

const returnId = pathParam('id', { type: 'integer', example: 12 });

export const returnPaths = {
  // ══════════════ Khách hàng ══════════════
  '/api/v1/customer/returns': {
    get: {
      tags: ['Tài khoản - Trả / Đổi hàng'],
      summary: 'Yêu cầu trả/đổi của tôi',
      security: bearer,
      responses: {
        200: okList('Toàn bộ yêu cầu của khách đang đăng nhập', 'OrderReturn'),
        401: unauthorized,
        403: forbidden,
      },
    },
    post: {
      tags: ['Tài khoản - Trả / Đổi hàng'],
      summary: 'Gửi yêu cầu trả hàng hoặc đổi mới',
      description:
        'Điều kiện: đơn phải ở trạng thái `completed` và trong vòng **7 ngày** kể từ khi đơn '
        + 'hoàn tất (tính theo `updatedAt`, không phải ngày đặt). Mỗi đơn chỉ được có MỘT yêu cầu '
        + 'đang mở (`pending` hoặc `approved`); yêu cầu bị từ chối thì gửi lại được. '
        + 'Bắt buộc đính kèm ít nhất 2 ảnh đã tải qua `POST /customer/uploads/returns`.',
      security: bearer,
      requestBody: jsonBody('OrderReturnCreateBody'),
      responses: {
        201: createdData('Yêu cầu vừa gửi', 'OrderReturn'),
        400: {
          description: 'Đơn chưa hoàn thành, hoặc đã quá hạn 7 ngày',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Chỉ đơn hàng đã hoàn thành mới yêu cầu trả hoặc đổi được.' },
            },
          },
        },
        401: unauthorized,
        403: {
          description: 'Đơn hàng không thuộc về khách đang đăng nhập',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Bạn không có quyền thao tác trên đơn hàng này' },
            },
          },
        },
        404: notFound,
        409: {
          description: 'Đơn đang có một yêu cầu chờ xử lý',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Đơn hàng này đang có một yêu cầu chờ xử lý' },
            },
          },
        },
        422: validationError,
      },
    },
  },

  '/api/v1/customer/returns/{id}/cancel': {
    patch: {
      tags: ['Tài khoản - Trả / Đổi hàng'],
      summary: 'Rút lại yêu cầu trả / đổi',
      description:
        'Chỉ rút được yêu cầu của chính mình và chỉ khi còn `pending` — cửa hàng đã duyệt hoặc '
        + 'đã xử lý xong thì phải liên hệ cửa hàng.\n\n'
        + 'Yêu cầu chuyển sang `cancelled`; trạng thái này không tính là "đang mở" nên khách gửi '
        + 'yêu cầu mới được ngay, miễn là đơn còn trong hạn 7 ngày.',
      security: bearer,
      parameters: [returnId],
      responses: {
        200: okData('Yêu cầu sau khi hủy', 'OrderReturn'),
        400: {
          description: 'Yêu cầu đã được cửa hàng xử lý hoặc đã hủy trước đó',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Cửa hàng đã xử lý yêu cầu này nên bạn không tự hủy được nữa. Vui lòng liên hệ cửa hàng nếu cần thay đổi.' },
            },
          },
        },
        401: unauthorized,
        403: {
          description: 'Yêu cầu không thuộc về khách đang đăng nhập',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Bạn không có quyền hủy yêu cầu này' },
            },
          },
        },
        404: notFound,
      },
    },
  },

  // ══════════════ Admin / nhân viên ══════════════
  '/api/v1/admin/returns': {
    get: {
      tags: ['Admin - Trả / Đổi hàng'],
      summary: 'Danh sách yêu cầu',
      description: 'Nhân viên xử lý được như admin vì đây là một phần của quản lý đơn hàng.',
      security: bearer,
      parameters: [
        queryParam('status', { type: 'string', enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'] }, 'Lọc theo trạng thái'),
        queryParam('page', { type: 'integer', default: 1 }, 'Trang, bắt đầu từ 1'),
        queryParam('limit', { type: 'integer', default: 15, maximum: 100 }, 'Số yêu cầu mỗi trang'),
      ],
      responses: {
        200: okPaginated('Yêu cầu khớp bộ lọc, mới nhất lên trước', 'OrderReturn'),
        ...adminErrors,
        422: validationError,
      },
    },
  },

  '/api/v1/admin/returns/{id}': {
    get: {
      tags: ['Admin - Trả / Đổi hàng'],
      summary: 'Chi tiết một yêu cầu',
      security: bearer,
      parameters: [returnId],
      responses: {
        200: okData('Yêu cầu kèm thông tin đơn và khách', 'OrderReturn'),
        ...adminErrors,
        404: notFound,
      },
    },
  },

  '/api/v1/admin/returns/{id}/status': {
    put: {
      tags: ['Admin - Trả / Đổi hàng'],
      summary: 'Duyệt / từ chối / hoàn tất',
      description:
        'Chỉ đi tới được: `pending → approved | rejected`, `approved → completed | rejected`. '
        + 'Yêu cầu đã chốt (`completed`/`rejected`) thì không đổi được nữa.\n\n'
        + '**Hoàn tất một yêu cầu loại `return`** sẽ: hoàn tồn kho, hoàn suất flash sale (nếu có), '
        + 'chuyển đơn sang `returned` và thanh toán sang `refunded`.\n\n'
        + '**Loại `exchange`** không đụng kho (một sản phẩm nhận về, một sản phẩm gửi đi) và đơn '
        + 'vẫn giữ trạng thái `completed`.',
      security: bearer,
      parameters: [returnId],
      requestBody: jsonBody('OrderReturnStatusBody'),
      responses: {
        200: okData('Yêu cầu sau khi cập nhật', 'OrderReturn'),
        400: {
          description: 'Bước chuyển trạng thái không hợp lệ',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Không thể chuyển yêu cầu từ "pending" sang "completed"' },
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
