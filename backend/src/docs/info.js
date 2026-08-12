// Lớp tài liệu OpenAPI — không chứa business logic.

export const meta = {
  info: {
    title: 'IKA Fashion — Store API',
    version: '1.0.0',
    description: `## API thương mại điện tử thời trang **IKA Fashion**

API được tách theo **vai trò**:
- **Public** \`/api/v1/...\` — duyệt sản phẩm, danh mục, tin tức, xem đánh giá, đăng ký/đăng nhập
- **Customer** \`/api/v1/customer/...\` — giỏ hàng, đơn của tôi, wishlist, áp mã, gửi đánh giá, nhắn tin
- **Admin** \`/api/v1/admin/...\` — quản lý sản phẩm, danh mục, đơn hàng, người dùng, mã giảm giá, đánh giá, tin nhắn, tin tức, tải ảnh

### Xác thực
Các endpoint có **khóa** yêu cầu header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
Token nhận được từ \`POST /api/v1/auth/login\` hoặc \`POST /api/v1/auth/register\`.

### Thử API ngay trên trang này
Mỗi endpoint có nút **Test Request**. Body mẫu đã điền sẵn theo đúng schema
kiểm tra dữ liệu ở backend, chỉ cần sửa giá trị rồi bấm gửi. Với endpoint có
khóa, dán token vào ô Authentication ở đầu trang một lần là dùng được cho mọi
endpoint bên dưới.`,
    contact: { name: 'IKA Fashion Support', email: 'support@ika.vn' },
  },

  servers: [{ url: 'http://localhost:4000', description: 'Development' }],

  tags: [
    // ── Khách chưa đăng nhập ───────────────────────────────────────────────
    { name: 'Hệ thống', description: 'Health check cho load balancer và script deploy' },
    { name: 'Cửa hàng - Sản phẩm', description: 'Trang chủ & trang Sản phẩm — danh sách có lọc/sắp xếp/phân trang, chi tiết theo id hoặc handle. Không cần đăng nhập.' },
    { name: 'Cửa hàng - Danh mục', description: 'Dữ liệu cho bộ lọc danh mục và trang /collections. Không cần đăng nhập.' },
    { name: 'Cửa hàng - Tin tức', description: 'Trang Tin tức — danh sách bài đã đăng, chi tiết theo id hoặc slug, danh mục bài viết. Không cần đăng nhập.' },
    { name: 'Cửa hàng - Đánh giá', description: 'Khối đánh giá trong trang chi tiết sản phẩm — chỉ hiện đánh giá đã được duyệt. Không cần đăng nhập.' },
    { name: 'Cửa hàng - Thông tin', description: 'Logo, tên, hotline, địa chỉ, giờ làm việc, mạng xã hội — Header, Footer và trang Liên hệ đọc từ đây. Không cần đăng nhập.' },
    { name: 'Cửa hàng - Flash Sale', description: 'Khối Flash Sale ngoài trang Ưu Đãi — các chương trình đang chạy còn suất. Không cần đăng nhập.' },
    { name: 'Cửa hàng - Liên hệ', description: 'Form Liên hệ — khách vãng lai gửi được, không cần đăng nhập.' },

    // ── Khu vực tài khoản ──────────────────────────────────────────────────
    { name: 'Xác thực', description: 'Đăng ký · Đăng nhập · Đăng xuất · Hồ sơ — lấy Bearer token dùng cho mọi mục bên dưới' },
    { name: 'Tài khoản - Giỏ hàng', description: 'Trang Giỏ hàng — thêm, sửa số lượng, xoá từng dòng hoặc xoá sạch' },
    { name: 'Tài khoản - Đơn hàng', description: 'Trang Đơn hàng — đặt hàng từ giỏ, xem lịch sử và chi tiết từng đơn' },
    { name: 'Tài khoản - Yêu thích', description: 'Nút tim trên thẻ sản phẩm và trang Yêu thích' },
    { name: 'Tài khoản - Mã giảm giá', description: 'Ô nhập mã lúc checkout — xem trước số tiền được giảm trước khi đặt' },
    { name: 'Tài khoản - Đánh giá', description: 'Form đánh giá sau khi nhận hàng — kiểm tra quyền đánh giá và gửi bài' },
    { name: 'Tài khoản - Tin nhắn', description: 'Khung chat với shop — bot trả lời tự động ngay trong response' },
    { name: 'Tài khoản - Trả / Đổi hàng', description: 'Gửi yêu cầu trả hàng hoặc đổi mới sau khi nhận hàng, kèm ảnh sản phẩm — mỗi đơn một yêu cầu đang mở' },
    { name: 'Tài khoản - Tải ảnh', description: 'Khách tải ảnh đính kèm yêu cầu trả/đổi — chỉ ghi được vào thư mục returns' },

    // ── Admin dashboard ────────────────────────────────────────────────────
    { name: 'Admin - Sản phẩm', description: 'Tab Sản phẩm — thêm, sửa, xoá' },
    { name: 'Admin - Danh mục', description: 'Tab Danh mục — thêm, sửa, xoá' },
    { name: 'Admin - Tin tức', description: 'Tab Tin tức — soạn bài, xem cả bản nháp, đổi trạng thái nháp/đăng' },
    { name: 'Admin - Đơn hàng', description: 'Tab Đơn hàng — xem toàn bộ đơn và cập nhật trạng thái giao/thanh toán' },
    { name: 'Admin - Người dùng', description: 'Tab Người dùng — danh sách, phân quyền, khoá/mở tài khoản' },
    { name: 'Admin - Mã giảm giá', description: 'Tab Khuyến mãi — tạo mã, bật/tắt, sửa hạn dùng' },
    { name: 'Admin - Flash Sale', description: 'Tab Flash Sale — mỗi chương trình áp cho một sản phẩm; tạm ngưng hoặc kết thúc, không xoá được để giữ lịch sử giá' },
    { name: 'Admin - Trả / Đổi hàng', description: 'Tab Trả / Đổi Hàng — duyệt, từ chối, hoàn tất yêu cầu của khách; hoàn tất trả hàng sẽ hoàn kho và hoàn tiền' },
    { name: 'Admin - Liên hệ', description: 'Tab Liên hệ — đọc và xử lý tin nhắn gửi từ form Liên hệ' },
    { name: 'Admin - Đánh giá', description: 'Tab Đánh giá — duyệt/ẩn, phản hồi khách, xoá' },
    { name: 'Admin - Tin nhắn', description: 'Tab Tin nhắn — xem hội thoại, tiếp quản trả lời thay bot' },
    { name: 'Admin - Cài đặt', description: 'Tab Cài Đặt Hệ Thống — sửa logo, tên cửa hàng, hotline và các thông tin khách hàng nhìn thấy trên web' },
    { name: 'Admin - Tải ảnh', description: 'Dùng chung cho mọi form có ảnh — upload multipart, trả về đường dẫn để lưu vào DB' },
  ],
};
