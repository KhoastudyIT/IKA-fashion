// Hàm dựng mảnh spec lặp đi lặp lại ở mọi file trong paths/.
//
// Toàn bộ API trả về cùng một vỏ response (xem src/utils/response.js):
//   { success, message, data }        — ok() / created()
//   { success, data, meta }           — paginated()
// nên gói lại ở đây thay vì chép tay allOf ở từng endpoint.

export const bearer = [{ bearerAuth: [] }];

/** Tham số trên path, mặc định kiểu chuỗi. */
export const pathParam = (name, { type = 'string', example, description } = {}) => ({
  name, in: 'path', required: true, schema: { type }, ...(example !== undefined && { example }), ...(description && { description }),
});

/** Tham số query, luôn tuỳ chọn. */
export const queryParam = (name, schema, description) => ({
  name, in: 'query', schema, ...(description && { description }),
});

/** requestBody JSON trỏ tới một schema trong components. */
export const jsonBody = (schemaName, { required = true } = {}) => ({
  required,
  content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } },
});

const envelope = (dataSchema) => ({
  allOf: [
    { $ref: '#/components/schemas/SuccessResponse' },
    { type: 'object', properties: { data: dataSchema } },
  ],
});

const ref = (schemaName) => ({ $ref: `#/components/schemas/${schemaName}` });

/** 200 — data là một object. */
export const okData = (description, schemaName) => ({
  description,
  content: { 'application/json': { schema: envelope(ref(schemaName)) } },
});

/** 200 — data là mảng object. */
export const okList = (description, schemaName) => ({
  description,
  content: { 'application/json': { schema: envelope({ type: 'array', items: ref(schemaName) }) } },
});

/** 201 — data là một object vừa tạo. */
export const createdData = (description, schemaName) => ({
  description,
  content: { 'application/json': { schema: envelope(ref(schemaName)) } },
});

/** 200 — mảng kèm meta phân trang, dùng cho các endpoint có ?page&limit. */
export const okPaginated = (description, schemaName) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: ref(schemaName) },
          meta: ref('PaginationMeta'),
        },
      },
    },
  },
});

/** 200 — chỉ có thông báo, data rỗng (các endpoint xoá/đánh dấu). */
export const okMessage = (description, message) => ({
  description,
  content: {
    'application/json': {
      schema: ref('SuccessResponse'),
      example: { success: true, message, data: null },
    },
  },
});

// Lỗi dùng chung — viết tắt cho gọn ở phần responses của từng endpoint.
export const unauthorized = { $ref: '#/components/responses/Unauthorized' };
export const forbidden = { $ref: '#/components/responses/Forbidden' };
export const notFound = { $ref: '#/components/responses/NotFound' };
export const conflict = { $ref: '#/components/responses/Conflict' };
export const validationError = { $ref: '#/components/responses/ValidationError' };

export const adminErrors = { 401: unauthorized, 403: forbidden };
