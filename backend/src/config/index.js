const nodeEnv = process.env.NODE_ENV ?? 'development';

// Secret ký JWT không được có giá trị mặc định trong mã nguồn: ai đọc được repo
// là ký được token admin giả. Ở production thiếu biến thì dừng hẳn chứ không
// chạy tiếp với giá trị đoán được; ở máy dev vẫn cho một giá trị tạm để khỏi
// phải cấu hình gì mới chạy được.
if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
  throw new Error(
    'Thiếu biến môi trường JWT_SECRET. Khi NODE_ENV=production bắt buộc phải đặt '
    + 'một chuỗi bí mật riêng — xem .env.example để biết cách tạo.',
  );
}

const config = {
  port:           parseInt(process.env.PORT          ?? '4000', 10),
  jwtSecret:      process.env.JWT_SECRET             ?? 'ika-fashion-local-dev-only',
  jwtExpiresIn:   process.env.JWT_EXPIRES_IN         ?? '7d',
  nodeEnv,
  isProduction:   nodeEnv === 'production',
  // Trang /api-docs phơi toàn bộ sơ đồ API nên mặc định TẮT ở production và BẬT
  // ở máy dev. Biến môi trường đặt tường minh thì luôn thắng.
  openapiEnabled: process.env.OPENAPI_ENABLED != null
    ? process.env.OPENAPI_ENABLED === 'true'
    : nodeEnv !== 'production',
  corsOrigin:     process.env.CORS_ORIGIN            ?? 'http://localhost:3000',
  databaseUrl:    process.env.DATABASE_URL           ?? 'postgresql://postgres:postgres@localhost:5432/ika_fashion',
};

export default config;
