import {
  bearer, pathParam, queryParam, jsonBody,
  okData, okList, okMessage,
  adminErrors, unauthorized, forbidden, notFound, validationError,
} from '../helpers.js';

const conversationId = pathParam('conversationId', {
  example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
});

const sendMessageResult = {
  description: 'Tin vừa gửi, câu trả lời của bot (null nếu bot đang tắt) và hội thoại liên quan',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  message: { $ref: '#/components/schemas/Message' },
                  botMessage: { allOf: [{ $ref: '#/components/schemas/Message' }], nullable: true },
                  conversation: { $ref: '#/components/schemas/Conversation' },
                },
              },
            },
          },
        ],
      },
    },
  },
};

export const messagePaths = {
  // ══════════════ Khách hàng ══════════════
  '/api/v1/customer/messages/my': {
    get: {
      tags: ['Tài khoản - Tin nhắn'],
      summary: 'Hội thoại của tôi',
      description: 'Truyền `ensure=1` để tạo mới kèm lời chào của bot nếu khách chưa từng nhắn. Không truyền mà chưa có hội thoại thì `data` là null.',
      security: bearer,
      parameters: [queryParam('ensure', { type: 'string', enum: ['1'] }, 'Tạo hội thoại nếu chưa có')],
      responses: {
        200: okData('Hội thoại của khách, hoặc null', 'Conversation'),
        401: unauthorized,
      403: forbidden,
      },
    },
  },

  '/api/v1/customer/messages': {
    post: {
      tags: ['Tài khoản - Tin nhắn'],
      summary: 'Gửi tin nhắn tới shop',
      description: 'Bỏ trống `conversationId` thì server tự tạo hội thoại. Bot trả lời ngay trong response qua trường `botMessage`.',
      security: bearer,
      requestBody: jsonBody('MessageSendBody'),
      responses: {
        201: sendMessageResult,
        401: unauthorized,
        403: forbidden,
        422: validationError,
      },
    },
  },

  '/api/v1/customer/messages/{conversationId}/messages': {
    get: {
      tags: ['Tài khoản - Tin nhắn'],
      summary: 'Tin nhắn trong hội thoại của tôi',
      description: 'Xem hội thoại của người khác thì trả 403.',
      security: bearer,
      parameters: [conversationId],
      responses: {
        200: okList('Tin nhắn theo thứ tự thời gian', 'Message'),
        401: unauthorized,
       403: forbidden,
        403: forbidden,
        404: notFound,
      },
    },
  },

  '/api/v1/customer/messages/{conversationId}/read': {
    put: {
      tags: ['Tài khoản - Tin nhắn'],
      summary: 'Đánh dấu đã đọc',
      description: 'Chỉ xoá bộ đếm chưa đọc phía khách, không đụng bộ đếm phía admin.',
      security: bearer,
      parameters: [conversationId],
      responses: {
        200: okData('Hội thoại sau khi đánh dấu', 'Conversation'),
        401: unauthorized,
        403: forbidden,
        404: notFound,
      },
    },
  },

  // ══════════════ Admin ══════════════
  '/api/v1/admin/messages/conversations': {
    get: {
      tags: ['Admin - Tin nhắn'],
      summary: 'Tất cả hội thoại',
      description: 'Kèm `unreadCount` để đánh dấu hội thoại chưa xử lý.',
      security: bearer,
      responses: {
        200: okList('Toàn bộ hội thoại', 'Conversation'),
        ...adminErrors,
      },
    },
  },

  '/api/v1/admin/messages/unread-count': {
    get: {
      tags: ['Admin - Tin nhắn'],
      summary: 'Tổng số tin chưa đọc',
      description: 'Cho chấm đỏ trên icon tin nhắn của dashboard.',
      security: bearer,
      responses: {
        200: {
          description: 'Tổng số chưa đọc',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { type: 'object', properties: { count: { type: 'integer', example: 5 } } } } },
                ],
              },
            },
          },
        },
        ...adminErrors,
      },
    },
  },

  '/api/v1/admin/messages': {
    post: {
      tags: ['Admin - Tin nhắn'],
      summary: 'Trả lời khách',
      description: 'Bắt buộc truyền `conversationId` để biết trả lời vào hội thoại nào. Admin trả lời tay thì bot tự tắt cho hội thoại đó.',
      security: bearer,
      requestBody: jsonBody('MessageSendBody'),
      responses: {
        201: sendMessageResult,
        ...adminErrors,
        404: notFound,
        422: validationError,
      },
    },
  },

  '/api/v1/admin/messages/{conversationId}/messages': {
    get: {
      tags: ['Admin - Tin nhắn'],
      summary: 'Tin nhắn trong một hội thoại',
      security: bearer,
      parameters: [conversationId],
      responses: {
        200: okList('Tin nhắn theo thứ tự thời gian', 'Message'),
        ...adminErrors,
        404: notFound,
      },
    },
  },

  '/api/v1/admin/messages/{conversationId}/read': {
    put: {
      tags: ['Admin - Tin nhắn'],
      summary: 'Đánh dấu đã đọc',
      description: 'Chỉ xoá bộ đếm chưa đọc phía admin.',
      security: bearer,
      parameters: [conversationId],
      responses: {
        200: okData('Hội thoại sau khi đánh dấu', 'Conversation'),
        ...adminErrors,
        404: notFound,
      },
    },
  },

  '/api/v1/admin/messages/{conversationId}/bot': {
    patch: {
      tags: ['Admin - Tin nhắn'],
      summary: 'Bật / tắt bot cho một hội thoại',
      description: 'Bật lại sau khi đã tiếp quản thủ công.',
      security: bearer,
      parameters: [conversationId],
      requestBody: jsonBody('MessageToggleBotBody'),
      responses: {
        200: okData('Hội thoại sau khi đổi', 'Conversation'),
        ...adminErrors,
        404: notFound,
        422: validationError,
      },
    },
  },

  '/api/v1/admin/messages/{id}': {
    delete: {
      tags: ['Admin - Tin nhắn'],
      summary: 'Xóa một tin nhắn',
      security: bearer,
      parameters: [pathParam('id', { example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012' })],
      responses: {
        200: okMessage('Đã xóa tin nhắn', 'Đã xóa tin nhắn'),
        ...adminErrors,
        404: notFound,
      },
    },
  },
};
