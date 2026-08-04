import { apiReference } from '@scalar/express-api-reference';

const bearer = [{ bearerAuth: [] }];

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'IKA Fashion — Store API',
    version: '1.0.0',
    description: `## API thương mại điện tử thời trang **IKA Fashion**

API được tách theo **vai trò**:
- **Public** \`/api/v1/...\` — duyệt sản phẩm, danh mục, xem đánh giá, đăng ký/đăng nhập
- **Customer** \`/api/v1/customer/...\` — giỏ hàng, đơn của tôi, wishlist, áp mã, gửi đánh giá, nhắn tin
- **Admin** \`/api/v1/admin/...\` — quản lý sản phẩm, danh mục, đơn hàng, người dùng, mã giảm giá, đánh giá, tin nhắn

### Xác thực
Các endpoint có **khóa** yêu cầu header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
Token nhận được từ \`POST /api/v1/auth/login\` hoặc \`POST /api/v1/auth/register\`.`,
    contact: { name: 'IKA Fashion Support', email: 'support@ika.vn' },
  },
  servers: [{ url: 'http://localhost:4000', description: 'Development' }],
  tags: [
    { name: 'Public',   description: 'Không cần đăng nhập — duyệt sản phẩm, danh mục, xem đánh giá, auth' },
    { name: 'Customer', description: 'Khách hàng đã đăng nhập — /api/v1/customer/*' },
    { name: 'Admin',    description: 'Quản trị viên — /api/v1/admin/*' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    // ══════════════ PUBLIC ══════════════
    '/api/health': {
      get: { tags: ['Public'], summary: 'Health check', responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/auth/register': {
      post: { tags: ['Public'], summary: 'Đăng ký tài khoản', requestBody: { required: true, content: { 'application/json': { example: { name: 'Nguyễn Văn A', email: 'a@gmail.com', password: '123456' } } } }, responses: { 201: { description: 'Đăng ký thành công' }, 409: { description: 'Email đã tồn tại' } } },
    },
    '/api/v1/auth/login': {
      post: { tags: ['Public'], summary: 'Đăng nhập', requestBody: { required: true, content: { 'application/json': { example: { email: 'admin@ika.vn', password: 'admin123' } } } }, responses: { 200: { description: 'Trả về user + token' }, 401: { description: 'Sai thông tin' } } },
    },
    '/api/v1/auth/me': {
      get: { tags: ['Public'], summary: 'Thông tin tài khoản hiện tại', security: bearer, responses: { 200: { description: 'OK' } } },
      put: { tags: ['Public'], summary: 'Cập nhật hồ sơ', security: bearer, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/auth/logout': {
      post: { tags: ['Public'], summary: 'Đăng xuất', security: bearer, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/products': {
      get: {
        tags: ['Public'], summary: 'Danh sách sản phẩm (lọc/sắp xếp/phân trang)',
        parameters: [
          { name: 'collection', in: 'query', schema: { type: 'string' }, description: 'ao-thun | ao-polo | quan | sale' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'rating', 'sold', 'newest'] } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'priceMin', in: 'query', schema: { type: 'integer' } },
          { name: 'priceMax', in: 'query', schema: { type: 'integer' } },
          { name: 'colors', in: 'query', schema: { type: 'string' }, description: 'CSV: Đen,Trắng' },
          { name: 'sizes', in: 'query', schema: { type: 'string' }, description: 'CSV: M,L' },
        ],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/v1/products/{id}': {
      get: { tags: ['Public'], summary: 'Chi tiết theo id', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
    },
    '/api/v1/products/handle/{handle}': {
      get: { tags: ['Public'], summary: 'Chi tiết theo handle', parameters: [{ name: 'handle', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/collections': {
      get: { tags: ['Public'], summary: 'Danh sách danh mục', responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/collections/{slug}': {
      get: { tags: ['Public'], summary: 'Danh mục + sản phẩm', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/reviews/product/{productId}': {
      get: { tags: ['Public'], summary: 'Đánh giá đã duyệt của 1 sản phẩm', parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
    },

    // ══════════════ CUSTOMER ══════════════
    '/api/v1/customer/cart': {
      get:    { tags: ['Customer'], summary: 'Xem giỏ hàng', security: bearer, responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Customer'], summary: 'Xóa toàn bộ giỏ', security: bearer, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/customer/cart/items': {
      post: { tags: ['Customer'], summary: 'Thêm sản phẩm vào giỏ', security: bearer, requestBody: { content: { 'application/json': { example: { productId: 1, size: 'M', color: 'Trắng', quantity: 2 } } } }, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/customer/cart/items/{key}': {
      put:    { tags: ['Customer'], summary: 'Cập nhật số lượng (key = productId|size|color)', security: bearer, parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Customer'], summary: 'Xóa 1 dòng giỏ', security: bearer, parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/customer/orders': {
      get:  { tags: ['Customer'], summary: 'Đơn hàng của tôi', security: bearer, responses: { 200: { description: 'OK' } } },
      post: { tags: ['Customer'], summary: 'Đặt hàng (từ giỏ)', security: bearer, requestBody: { content: { 'application/json': { example: { shippingAddress: '123 Lê Lợi, Q1, TP.HCM', phone: '0901234567', notes: 'Giao giờ hành chính', couponCode: 'IKANEW10' } } } }, responses: { 201: { description: 'Created' } } },
    },
    '/api/v1/customer/orders/{id}': {
      get: { tags: ['Customer'], summary: 'Chi tiết đơn của tôi', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/customer/wishlist': {
      get:  { tags: ['Customer'], summary: 'Danh sách yêu thích', security: bearer, responses: { 200: { description: 'OK' } } },
      post: { tags: ['Customer'], summary: 'Thêm vào yêu thích', security: bearer, requestBody: { content: { 'application/json': { example: { productId: 1 } } } }, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/customer/wishlist/{productId}': {
      delete: { tags: ['Customer'], summary: 'Xóa khỏi yêu thích', security: bearer, parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/customer/coupons/apply': {
      post: { tags: ['Customer'], summary: 'Áp mã lúc checkout (xem trước số tiền giảm)', security: bearer, requestBody: { content: { 'application/json': { example: { code: 'IKANEW10', subtotal: 300000 } } } }, responses: { 200: { description: 'OK — { code, type, value, minOrder, discount }' }, 400: { description: 'Mã không hợp lệ / chưa đủ điều kiện' } } },
    },
    '/api/v1/customer/reviews/eligibility/{productId}': {
      get: { tags: ['Customer'], summary: 'Kiểm tra có được đánh giá không (đã mua + nhận hàng)', security: bearer, parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK — { canReview: boolean }' } } },
    },
    '/api/v1/customer/reviews': {
      post: { tags: ['Customer'], summary: 'Gửi đánh giá (chỉ khách đã mua + nhận hàng)', security: bearer, requestBody: { content: { 'application/json': { example: { productId: 1, rating: 5, comment: 'Sản phẩm rất đẹp!' } } } }, responses: { 201: { description: 'Created — chờ admin duyệt' }, 403: { description: 'Chưa mua/nhận hàng sản phẩm này' } } },
    },
    '/api/v1/customer/messages/my': {
      get: { tags: ['Customer'], summary: 'Hội thoại của tôi (ensure=1 để tạo mới kèm lời chào của bot)', security: bearer, parameters: [{ name: 'ensure', in: 'query', schema: { type: 'string', enum: ['1'] } }], responses: { 200: { description: 'OK — null nếu chưa có hội thoại và không truyền ensure' } } },
    },
    '/api/v1/customer/messages': {
      post: { tags: ['Customer'], summary: 'Gửi tin nhắn tới shop (bot trả lời ngay trong response qua trường botMessage)', security: bearer, requestBody: { content: { 'application/json': { example: { content: 'Cho mình hỏi size L còn không ạ?', productId: 5 } } } }, responses: { 201: { description: 'Created — { message, botMessage, conversation }' } } },
    },
    '/api/v1/customer/messages/{conversationId}/messages': {
      get: { tags: ['Customer'], summary: 'Tin nhắn trong hội thoại của tôi', security: bearer, parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/customer/messages/{conversationId}/read': {
      put: { tags: ['Customer'], summary: 'Đánh dấu đã đọc', security: bearer, parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },

    // ══════════════ ADMIN ══════════════
    '/api/v1/admin/products': {
      post: { tags: ['Admin'], summary: 'Tạo sản phẩm', security: bearer, responses: { 201: { description: 'Created' } } },
    },
    '/api/v1/admin/products/{id}': {
      put:    { tags: ['Admin'], summary: 'Cập nhật sản phẩm', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Admin'], summary: 'Xóa sản phẩm', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 204: { description: 'No content' } } },
    },
    '/api/v1/admin/collections': {
      post: { tags: ['Admin'], summary: 'Tạo danh mục', security: bearer, responses: { 201: { description: 'Created' } } },
    },
    '/api/v1/admin/collections/{id}': {
      put:    { tags: ['Admin'], summary: 'Cập nhật danh mục', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Admin'], summary: 'Xóa danh mục', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/orders': {
      get: { tags: ['Admin'], summary: 'Tất cả đơn hàng (lọc ?status=)', security: bearer, parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'] } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/orders/{id}': {
      get: { tags: ['Admin'], summary: 'Chi tiết 1 đơn bất kỳ', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/orders/{id}/status': {
      put: { tags: ['Admin'], summary: 'Cập nhật trạng thái đơn', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { example: { status: 'completed', paymentStatus: 'paid' } } } }, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/users': {
      get: { tags: ['Admin'], summary: 'Danh sách người dùng', security: bearer, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/users/{id}': {
      delete: { tags: ['Admin'], summary: 'Xóa người dùng', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/users/{id}/toggle-lock': {
      put: { tags: ['Admin'], summary: 'Khóa / mở khóa tài khoản', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/users/{id}/role': {
      put: { tags: ['Admin'], summary: 'Đổi vai trò (customer/admin)', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { example: { role: 'admin' } } } }, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/coupons': {
      get:  { tags: ['Admin'], summary: 'Danh sách mã giảm giá', security: bearer, responses: { 200: { description: 'OK' } } },
      post: { tags: ['Admin'], summary: 'Tạo mã giảm giá', security: bearer, requestBody: { content: { 'application/json': { example: { code: 'CHAOHE', type: 'percentage', value: 15, minOrder: 200000, quantity: 100, active: true, expiryDate: '2026-12-31' } } } }, responses: { 201: { description: 'Created' } } },
    },
    '/api/v1/admin/coupons/{id}': {
      put:    { tags: ['Admin'], summary: 'Cập nhật mã', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Admin'], summary: 'Xóa mã', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/coupons/{id}/toggle': {
      put: { tags: ['Admin'], summary: 'Bật/tắt mã', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/reviews': {
      get: { tags: ['Admin'], summary: 'Tất cả đánh giá (có cả chưa duyệt)', security: bearer, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/reviews/{id}/approve': {
      put: { tags: ['Admin'], summary: 'Duyệt / ẩn đánh giá', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/reviews/{id}/reply': {
      put: { tags: ['Admin'], summary: 'Phản hồi đánh giá', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { content: { 'application/json': { example: { reply: 'Cảm ơn bạn đã ủng hộ!' } } } }, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/reviews/{id}': {
      delete: { tags: ['Admin'], summary: 'Xóa đánh giá', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/messages/conversations': {
      get: { tags: ['Admin'], summary: 'Tất cả hội thoại', security: bearer, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/messages/unread-count': {
      get: { tags: ['Admin'], summary: 'Tổng số chưa đọc', security: bearer, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/messages': {
      post: { tags: ['Admin'], summary: 'Trả lời khách (cần conversationId)', security: bearer, requestBody: { content: { 'application/json': { example: { content: 'Chào bạn, size L còn hàng nhé!', conversationId: '<uuid>' } } } }, responses: { 201: { description: 'Created' } } },
    },
    '/api/v1/admin/messages/{conversationId}/messages': {
      get: { tags: ['Admin'], summary: 'Tin nhắn trong 1 hội thoại', security: bearer, parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/messages/{conversationId}/read': {
      put: { tags: ['Admin'], summary: 'Đánh dấu đã đọc', security: bearer, parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/messages/{conversationId}/bot': {
      patch: { tags: ['Admin'], summary: 'Bật/tắt bot cho 1 hội thoại (bot tự tắt khi admin trả lời)', security: bearer, parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { example: { aiEnabled: true } } } }, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/admin/messages/{id}': {
      delete: { tags: ['Admin'], summary: 'Xóa tin nhắn', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
  },
};

export function setupDocs(app) {
  app.get('/openapi.json', (_req, res) => res.json(spec));
  app.use('/api-docs', apiReference({ url: '/openapi.json' }));
}
