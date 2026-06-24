import { apiReference } from '@scalar/express-api-reference';

const bearer = [{ bearerAuth: [] }];

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'IKA Fashion — Store API',
    version: '1.0.0',
    description: `## API thương mại điện tử thời trang **IKA Fashion**

### Tính năng
- Xác thực người dùng với JWT Bearer Token
- Quản lý sản phẩm & danh mục (Áo Thun, Áo Polo, Quần)
- Giỏ hàng, đặt hàng, danh sách yêu thích
- Phân quyền customer / admin

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
    { name: 'Auth',        description: 'Đăng ký, đăng nhập, hồ sơ tài khoản' },
    { name: 'Products',    description: 'Sản phẩm — xem & quản lý (admin)' },
    { name: 'Collections', description: 'Danh mục sản phẩm' },
    { name: 'Cart',        description: 'Giỏ hàng — yêu cầu đăng nhập' },
    { name: 'Orders',      description: 'Đơn hàng — yêu cầu đăng nhập' },
    { name: 'Wishlist',    description: 'Danh sách yêu thích — yêu cầu đăng nhập' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/api/health': {
      get: { tags: ['Auth'], summary: 'Health check', responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Đăng ký tài khoản',
        requestBody: { required: true, content: { 'application/json': { example: { name: 'Nguyễn Văn A', email: 'a@gmail.com', password: '123456' } } } },
        responses: { 201: { description: 'Đăng ký thành công' }, 409: { description: 'Email đã tồn tại' } },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Đăng nhập',
        requestBody: { required: true, content: { 'application/json': { example: { email: 'admin@ika.vn', password: 'admin123' } } } },
        responses: { 200: { description: 'Trả về user + token' }, 401: { description: 'Sai thông tin' } },
      },
    },
    '/api/v1/auth/me': {
      get: { tags: ['Auth'], summary: 'Thông tin tài khoản hiện tại', security: bearer, responses: { 200: { description: 'OK' } } },
      put: { tags: ['Auth'], summary: 'Cập nhật hồ sơ', security: bearer, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/products': {
      get: {
        tags: ['Products'], summary: 'Danh sách sản phẩm (lọc/sắp xếp/phân trang)',
        parameters: [
          { name: 'collection', in: 'query', schema: { type: 'string' }, description: 'ao-thun | ao-polo | quan' },
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
      post: { tags: ['Products'], summary: 'Tạo sản phẩm (admin)', security: bearer, responses: { 201: { description: 'Created' } } },
    },
    '/api/v1/products/{id}': {
      get:    { tags: ['Products'], summary: 'Chi tiết theo id', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      put:    { tags: ['Products'], summary: 'Cập nhật (admin)', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Products'], summary: 'Xóa (admin)', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 204: { description: 'No content' } } },
    },
    '/api/v1/products/handle/{handle}': {
      get: { tags: ['Products'], summary: 'Chi tiết theo handle', parameters: [{ name: 'handle', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/collections': {
      get: { tags: ['Collections'], summary: 'Danh sách danh mục', responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/collections/{slug}': {
      get: { tags: ['Collections'], summary: 'Danh mục + sản phẩm', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/cart': {
      get:    { tags: ['Cart'], summary: 'Xem giỏ hàng', security: bearer, responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Cart'], summary: 'Xóa toàn bộ giỏ', security: bearer, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/cart/items': {
      post: { tags: ['Cart'], summary: 'Thêm sản phẩm', security: bearer, requestBody: { content: { 'application/json': { example: { productId: 1, size: 'M', color: 'Trắng', quantity: 2 } } } }, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/cart/items/{key}': {
      put:    { tags: ['Cart'], summary: 'Cập nhật số lượng (key = productId|size|color)', security: bearer, parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Cart'], summary: 'Xóa 1 dòng', security: bearer, parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/orders': {
      get:  { tags: ['Orders'], summary: 'Đơn hàng của tôi', security: bearer, responses: { 200: { description: 'OK' } } },
      post: { tags: ['Orders'], summary: 'Đặt hàng (từ giỏ)', security: bearer, requestBody: { content: { 'application/json': { example: { shippingAddress: '123 Lê Lợi, Q1, TP.HCM', phone: '0901234567', notes: 'Giao giờ hành chính' } } } }, responses: { 201: { description: 'Created' } } },
    },
    '/api/v1/orders/all': {
      get: { tags: ['Orders'], summary: 'Tất cả đơn hàng (admin)', security: bearer, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/orders/{id}': {
      get: { tags: ['Orders'], summary: 'Chi tiết đơn', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/orders/{id}/status': {
      put: { tags: ['Orders'], summary: 'Cập nhật trạng thái (admin)', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { example: { status: 'confirmed', paymentStatus: 'paid' } } } }, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/wishlist': {
      get:  { tags: ['Wishlist'], summary: 'Danh sách yêu thích', security: bearer, responses: { 200: { description: 'OK' } } },
      post: { tags: ['Wishlist'], summary: 'Thêm sản phẩm', security: bearer, requestBody: { content: { 'application/json': { example: { productId: 1 } } } }, responses: { 200: { description: 'OK' } } },
    },
    '/api/v1/wishlist/{productId}': {
      delete: { tags: ['Wishlist'], summary: 'Xóa sản phẩm', security: bearer, parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
    },
  },
};

export function setupDocs(app) {
  app.get('/openapi.json', (_req, res) => res.json(spec));
  app.use('/api-docs', apiReference({ url: '/openapi.json' }));
}
