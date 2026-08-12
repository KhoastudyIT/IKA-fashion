// Schema dùng chung cho toàn bộ spec — không chứa business logic.
//
// Mọi thuộc tính đều có `example`: Scalar lấy chính các giá trị đó để điền sẵn
// khung "Test Request", nên body mẫu bấm gửi được ngay mà không phải tự gõ.
// Schema kết thúc bằng `Body` là dữ liệu GỬI LÊN, giữ đúng ràng buộc của các
// schema zod trong `src/modules/*/*.schema.js` — sửa validate thì sửa cả ở đây.

export const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT nhận từ POST /api/v1/auth/login hoặc /api/v1/auth/register',
    },
  },

  schemas: {
    // ══════════════ Vỏ response chung ══════════════
    SuccessResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: { description: 'Payload — kiểu tuỳ endpoint' },
      },
    },
    PaginationMeta: {
      type: 'object',
      properties: {
        total: { type: 'integer', example: 42 },
        page: { type: 'integer', example: 1 },
        limit: { type: 'integer', example: 12 },
        totalPages: { type: 'integer', example: 4 },
      },
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Không tìm thấy sản phẩm' },
      },
    },
    ValidationErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Dữ liệu không hợp lệ' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', example: 'price' },
              message: { type: 'string', example: 'Expected number, received string' },
            },
          },
        },
      },
    },

    // ══════════════ Thực thể ══════════════
    Product: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Áo thun cotton basic' },
        handle: { type: 'string', example: 'ao-thun-cotton-basic' },
        collection: { type: 'string', example: 'ao-thun' },
        type: { type: 'string', example: 'Áo thun' },
        price: {
          type: 'integer',
          description: 'Giá niêm yết trong bảng products (VND). Form sửa sản phẩm của admin đọc cột này.',
          example: 199000,
        },
        original_price: { type: 'integer', nullable: true, description: 'Giá gốc trước giảm', example: 249000 },
        discount: { type: 'integer', description: '% giảm ở cấp sản phẩm', example: 20 },
        effective_price: {
          type: 'integer',
          description:
            'Giá khách THẬT SỰ trả = giá flash nếu sản phẩm đang trong chương trình còn suất, '
            + 'không thì bằng `price`. Backend tính bằng đúng biểu thức dùng lúc chốt đơn.',
          example: 149000,
        },
        flash_price: {
          type: 'integer', nullable: true,
          description: 'null = sản phẩm không nằm trong flash sale nào đang chạy',
          example: 149000,
        },
        flash_remaining: { type: 'integer', nullable: true, description: 'Số suất giá flash còn lại', example: 7 },
        img: { type: 'string', example: '/products/ao-thun-trang.png' },
        images: { type: 'array', items: { type: 'string' }, example: ['/products/ao-thun-trang.png'] },
        colors: { type: 'array', items: { type: 'string' }, example: ['Trắng', 'Đen'] },
        sizes: { type: 'array', items: { type: 'string' }, example: ['M', 'L', 'XL'] },
        features: { type: 'array', items: { type: 'string' }, example: ['Cotton 100%', 'Co giãn 4 chiều'] },
        rating: { type: 'number', format: 'float', example: 4.8 },
        sold: { type: 'integer', example: 120 },
        stock: { type: 'integer', example: 50 },
        description: { type: 'string', example: 'Chất cotton mềm, thấm hút tốt, mặc mát cả ngày.' },
      },
    },
    Collection: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        slug: { type: 'string', example: 'ao-thun' },
        name: { type: 'string', example: 'Áo thun' },
        img: { type: 'string', example: '/products/ao-thun-trang.png' },
        productCount: { type: 'integer', description: 'Chỉ có ở endpoint danh sách', example: 8 },
      },
    },
    CollectionWithProducts: {
      allOf: [
        { $ref: '#/components/schemas/Collection' },
        {
          type: 'object',
          properties: {
            products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
          },
        },
      ],
    },
    NewsCategory: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        slug: { type: 'string', example: 'xu-huong' },
        name: { type: 'string', example: 'Xu hướng' },
        count: { type: 'integer', description: 'Số bài ĐÃ ĐĂNG trong danh mục', example: 4 },
      },
    },
    NewsArticle: {
      type: 'object',
      description: 'Bài viết ở dạng danh sách — không kèm `content` cho nhẹ payload.',
      properties: {
        id: { type: 'integer', example: 12 },
        title: { type: 'string', example: 'Xu hướng thời trang nam thu đông 2026' },
        slug: { type: 'string', example: 'xu-huong-thoi-trang-nam-thu-dong-2026' },
        img: { type: 'string', example: '/banners/tin-tuc/blog-thu-dong.jpeg' },
        excerpt: { type: 'string', example: 'Gam màu trầm ấm và phom dáng vừa vặn định hình mùa lạnh năm nay.' },
        author: { type: 'string', example: 'IKA Fashion' },
        status: { type: 'string', enum: ['draft', 'published'], example: 'published' },
        publishDate: { type: 'string', format: 'date', example: '2026-07-15' },
        category: { $ref: '#/components/schemas/NewsCategory' },
      },
    },
    NewsArticleDetail: {
      allOf: [
        { $ref: '#/components/schemas/NewsArticle' },
        {
          type: 'object',
          properties: {
            content: { type: 'string', example: 'Đoạn mở đầu.\n\n## Tiêu đề mục\n\n- Gạch đầu dòng' },
          },
        },
      ],
    },
    CartItem: {
      type: 'object',
      properties: {
        productId: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Áo thun cotton basic' },
        handle: { type: 'string', example: 'ao-thun-cotton-basic' },
        img: { type: 'string', example: '/products/ao-thun-trang.png' },
        price: { type: 'integer', example: 199000 },
        size: { type: 'string', example: 'M' },
        color: { type: 'string', example: 'Trắng' },
        quantity: { type: 'integer', example: 2 },
        lineTotal: { type: 'integer', description: 'price × quantity', example: 398000 },
      },
    },
    Cart: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
        subtotal: { type: 'integer', description: 'Tổng tiền trước giảm giá (VND)', example: 398000 },
        totalItems: { type: 'integer', description: 'Tổng số lượng sản phẩm', example: 2 },
      },
    },
    OrderItem: {
      type: 'object',
      description: 'Chụp lại giá và tên tại thời điểm đặt — sửa sản phẩm sau đó không làm đổi đơn cũ.',
      properties: {
        productId: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Áo thun cotton basic' },
        img: { type: 'string', example: '/products/ao-thun-trang.png' },
        price: { type: 'integer', example: 199000 },
        size: { type: 'string', example: 'M' },
        color: { type: 'string', example: 'Trắng' },
        quantity: { type: 'integer', example: 2 },
        lineTotal: { type: 'integer', example: 398000 },
      },
    },
    Order: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'DH1720051200000' },
        userId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        customerName: { type: 'string', example: 'Nguyễn Văn A' },
        customerEmail: { type: 'string', format: 'email', example: 'vana@example.com' },
        totalPrice: { type: 'integer', description: 'Đã trừ discount (VND)', example: 358200 },
        discount: { type: 'integer', example: 39800 },
        couponCode: { type: 'string', nullable: true, example: 'IKANEW10' },
        status: {
          type: 'string',
          enum: ['pending', 'confirmed', 'shipped', 'completed', 'cancelled', 'returned'],
          description:
            '`returned` chỉ đến được qua luồng duyệt yêu cầu trả hàng, không đặt tay bằng '
            + 'PUT /admin/orders/{id}/status — để không ai đổi trạng thái mà quên hoàn kho.',
          example: 'pending',
        },
        paymentStatus: {
          type: 'string',
          enum: ['unpaid', 'paid', 'refunded'],
          description:
            'Cửa hàng thu tiền khi giao, nên đơn chuyển sang `completed` sẽ tự thành `paid`. '
            + '`refunded` do luồng trả hàng đặt.',
          example: 'unpaid',
        },
        shippingAddress: { type: 'string', example: '123 Lê Lợi, Quận 1, TP.HCM' },
        phone: { type: 'string', example: '0901234567' },
        notes: { type: 'string', example: 'Giao giờ hành chính' },
        createdAt: { type: 'string', format: 'date-time', example: '2026-07-15T08:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2026-07-15T08:00:00.000Z' },
        items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
        returnRequest: {
          allOf: [{ $ref: '#/components/schemas/OrderReturn' }],
          nullable: true,
          description: 'Yêu cầu trả/đổi mới nhất của đơn. null = khách chưa gửi lần nào.',
        },
      },
    },
    Review: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 7 },
        productId: { type: 'integer', example: 1 },
        productName: { type: 'string', description: 'Chỉ có ở endpoint admin', example: 'Áo thun cotton basic' },
        userName: { type: 'string', example: 'Nguyễn Văn A' },
        rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
        comment: { type: 'string', example: 'Sản phẩm rất đẹp, vải mát!' },
        reply: { type: 'string', nullable: true, example: 'Cảm ơn bạn đã ủng hộ!' },
        approved: { type: 'boolean', description: 'Chỉ có ở endpoint admin', example: true },
        createdAt: { type: 'string', format: 'date', example: '2026-07-15' },
      },
    },
    User: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        name: { type: 'string', example: 'Nguyễn Văn A' },
        email: { type: 'string', format: 'email', example: 'a@gmail.com' },
        phone: { type: 'string', nullable: true, example: '0901234567' },
        address: { type: 'string', nullable: true, example: '123 Lê Lợi, Quận 1, TP.HCM' },
        role: { type: 'string', enum: ['customer', 'staff', 'admin'], example: 'customer' },
        isLocked: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time', example: '2026-06-16T10:00:00.000Z' },
      },
    },
    AuthResult: {
      type: 'object',
      properties: {
        user: { $ref: '#/components/schemas/User' },
        token: { type: 'string', description: 'Dán vào ô Authentication để test các endpoint có khóa', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
    },
    // ── Flash sale ─────────────────────────────────────────────────────────
    // Mỗi dòng là MỘT sản phẩm với giá ưu đãi, số suất và khung giờ riêng.
    FlashSale: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Mã chương trình, hiển thị dạng FS-0001', example: 1 },
        productId: { type: 'integer', example: 21 },
        price: { type: 'integer', description: 'Giá flash (VND)', example: 149000 },
        originalPrice: { type: 'integer', description: 'Ảnh chụp giá niêm yết lúc tạo chương trình', example: 299000 },
        stock: { type: 'integer', description: 'Tổng số suất', example: 20 },
        sold: { type: 'integer', description: 'Số suất đã bán', example: 13 },
        remaining: { type: 'integer', description: 'stock − sold', example: 7 },
        discountPercent: {
          type: 'integer',
          description: 'Tính trên giá niêm yết HIỆN TẠI của sản phẩm, không dùng originalPrice đã chụp',
          example: 50,
        },
        startsAt: { type: 'string', format: 'date-time', example: '2026-08-12T09:00:00.000Z' },
        endsAt: { type: 'string', format: 'date-time', nullable: true, description: 'null = chạy tới khi tắt tay', example: '2026-08-13T09:00:00.000Z' },
        active: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time', example: '2026-08-12T08:00:00.000Z' },
        name: { type: 'string', description: 'Tên sản phẩm đi kèm', example: 'Áo Thun Trắng Premium' },
        handle: { type: 'string', example: 'ao-thun-trang-premium' },
        img: { type: 'string', example: '/products/ao-thun-trang.png' },
        productPrice: { type: 'integer', description: 'Giá niêm yết hiện tại của sản phẩm', example: 299000 },
        productStock: { type: 'integer', example: 113 },
        orderItemCount: { type: 'integer', description: 'Số dòng đơn đã mua theo chương trình (chỉ ở danh sách admin)', example: 2 },
      },
    },
    FlashSaleCreateBody: {
      type: 'object',
      required: ['productId', 'price', 'stock'],
      properties: {
        productId: { type: 'integer', example: 21 },
        price: { type: 'integer', description: 'Phải THẤP HƠN giá đang bán của sản phẩm', example: 149000 },
        stock: { type: 'integer', minimum: 1, description: 'Số suất; bán hết là chương trình tự dừng', example: 20 },
        startsAt: { type: 'string', format: 'date-time', description: 'Bỏ trống = chạy ngay', example: '2026-08-12T09:00:00.000Z' },
        endsAt: { type: 'string', format: 'date-time', nullable: true, description: 'Bỏ trống = chạy tới khi tắt tay', example: '2026-08-13T09:00:00.000Z' },
        active: { type: 'boolean', default: true, example: true },
      },
    },
    FlashSaleUpdateBody: {
      type: 'object',
      description: 'Chỉ gửi trường muốn đổi. Chương trình ĐÃ KẾT THÚC thì không sửa được nữa.',
      properties: {
        productId: { type: 'integer', example: 21 },
        price: { type: 'integer', example: 139000 },
        stock: { type: 'integer', minimum: 1, description: 'Không được thấp hơn số suất đã bán', example: 25 },
        startsAt: { type: 'string', format: 'date-time' },
        endsAt: { type: 'string', format: 'date-time', nullable: true },
        active: { type: 'boolean', example: false },
      },
    },

    // ── Trả hàng / Đổi mới ─────────────────────────────────────────────────
    OrderReturn: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 12 },
        orderId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        type: {
          type: 'string', enum: ['return', 'exchange'],
          description: '`return` = trả hàng hoàn tiền và hoàn kho; `exchange` = đổi mới, kho không đổi',
          example: 'return',
        },
        reason: { type: 'string', example: 'Áo bị lỗi đường may ở tay phải' },
        images: {
          type: 'array', items: { type: 'string' },
          description: 'Ảnh khách gửi để cửa hàng đối chiếu với lý do',
          example: ['/uploads/returns/1786552323984-17a10225.png', '/uploads/returns/1786552323991-3ff8200f.png'],
        },
        status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'completed'], example: 'pending' },
        adminNote: { type: 'string', description: 'Phản hồi của cửa hàng, khách đọc được', example: 'Đã nhận được hàng gửi về' },
        resolvedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
        createdAt: { type: 'string', format: 'date-time', example: '2026-08-13T02:00:00.000Z' },
        orderTotal: { type: 'integer', description: 'Kèm theo ở endpoint danh sách', example: 358200 },
        orderStatus: { type: 'string', example: 'completed' },
        customerName: { type: 'string', example: 'Nguyễn Văn A' },
        customerEmail: { type: 'string', format: 'email', example: 'vana@example.com' },
        customerPhone: { type: 'string', example: '0901234567' },
      },
    },
    OrderReturnCreateBody: {
      type: 'object',
      required: ['orderId', 'type', 'reason', 'images'],
      properties: {
        orderId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        type: { type: 'string', enum: ['return', 'exchange'], example: 'return' },
        reason: { type: 'string', minLength: 10, maxLength: 500, example: 'Áo bị lỗi đường may ở tay phải' },
        images: {
          type: 'array', minItems: 2, maxItems: 5,
          items: { type: 'string', pattern: '^/uploads/returns/[\\w.-]+$' },
          description:
            'BẮT BUỘC ít nhất 2 ảnh. Chỉ nhận đường dẫn do POST /customer/uploads/returns sinh ra, '
            + 'không nhận URL ngoài.',
          example: ['/uploads/returns/a.png', '/uploads/returns/b.png'],
        },
      },
    },
    OrderReturnStatusBody: {
      type: 'object',
      properties: {
        status: {
          type: 'string', enum: ['pending', 'approved', 'rejected', 'completed'],
          description: 'Chỉ đi tới được: pending → approved|rejected, approved → completed|rejected',
          example: 'approved',
        },
        adminNote: { type: 'string', maxLength: 500, example: 'Đã nhận được hàng gửi về' },
      },
    },

    // ── Liên hệ ────────────────────────────────────────────────────────────
    Contact: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 5 },
        name: { type: 'string', example: 'Nguyễn Văn A' },
        email: { type: 'string', format: 'email', example: 'vana@example.com' },
        phone: { type: 'string', example: '0901234567' },
        subject: { type: 'string', example: 'Hỏi về chính sách đổi trả' },
        message: { type: 'string', example: 'Cho mình hỏi áo mua hôm qua đổi size được không ạ?' },
        status: { type: 'string', enum: ['new', 'processing', 'resolved'], example: 'new' },
        adminNote: { type: 'string', example: '' },
        createdAt: { type: 'string', format: 'date-time', example: '2026-08-13T02:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2026-08-13T02:00:00.000Z' },
      },
    },
    ContactCreateBody: {
      type: 'object',
      required: ['name', 'email', 'subject', 'message'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100, example: 'Nguyễn Văn A' },
        email: { type: 'string', format: 'email', maxLength: 150, example: 'vana@example.com' },
        phone: {
          type: 'string',
          description: 'Không bắt buộc, nhưng đã nhập thì phải gồm 10 chữ số bắt đầu bằng 03/05/07/08/09',
          example: '0901234567',
        },
        subject: { type: 'string', maxLength: 100, example: 'Hỏi về chính sách đổi trả' },
        message: { type: 'string', minLength: 10, maxLength: 2000, example: 'Cho mình hỏi áo mua hôm qua đổi size được không ạ?' },
      },
    },
    ContactUpdateBody: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['new', 'processing', 'resolved'], example: 'processing' },
        adminNote: { type: 'string', maxLength: 1000, example: 'Đã gọi lại cho khách' },
      },
    },
    ContactStats: {
      type: 'object',
      properties: {
        total: { type: 'integer', example: 42 },
        new: { type: 'integer', example: 5 },
        processing: { type: 'integer', example: 3 },
        resolved: { type: 'integer', example: 34 },
      },
    },

    Coupon: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 3 },
        code: { type: 'string', example: 'IKANEW10' },
        type: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
        value: { type: 'integer', description: 'percentage → phần trăm; fixed → số tiền VND', example: 10 },
        minOrder: { type: 'integer', description: 'Giá trị đơn tối thiểu để dùng mã (VND)', example: 200000 },
        quantity: { type: 'integer', description: 'Số lượt còn lại', example: 100 },
        active: { type: 'boolean', example: true },
        expiryDate: { type: 'string', format: 'date', example: '2026-12-31' },
      },
    },
    CouponPreview: {
      type: 'object',
      description: 'Kết quả xem trước khi áp mã — chưa trừ tiền, chỉ để hiển thị ở màn checkout.',
      properties: {
        code: { type: 'string', example: 'IKANEW10' },
        type: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
        value: { type: 'integer', example: 10 },
        minOrder: { type: 'integer', example: 200000 },
        discount: { type: 'integer', description: 'Số tiền được giảm tính trên subtotal đã gửi lên', example: 39800 },
      },
    },
    ProductRef: {
      type: 'object',
      nullable: true,
      description: 'Thẻ sản phẩm rút gọn nhúng kèm tin nhắn — nhìn id trần thì không biết khách đang hỏi mẫu nào.',
      properties: {
        id: { type: 'integer', example: 5 },
        name: { type: 'string', example: 'Áo polo pique' },
        handle: { type: 'string', example: 'ao-polo-pique' },
        price: { type: 'integer', example: 259000 },
        img: { type: 'string', example: '/products/ao-polo.png' },
      },
    },
    Message: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012' },
        conversationId: { type: 'string', format: 'uuid', example: 'c3d4e5f6-a7b8-9012-cdef-345678901234' },
        senderId: { type: 'string', format: 'uuid', nullable: true, description: 'null với tin do bot sinh', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        senderRole: { type: 'string', enum: ['customer', 'admin', 'ai'], example: 'customer' },
        senderName: { type: 'string', example: 'Nguyễn Văn A' },
        content: { type: 'string', example: 'Cho mình hỏi size L còn không ạ?' },
        productId: { type: 'integer', nullable: true, example: 5 },
        product: { $ref: '#/components/schemas/ProductRef' },
        suggestions: { type: 'array', items: { type: 'string' }, description: 'Câu gợi ý bot đề xuất cho lượt tiếp theo', example: ['Xem bảng size', 'Còn màu nào?'] },
        intent: { type: 'string', description: 'Ý định bot nhận diện được', example: 'hoi_size' },
        isRead: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time', example: '2026-07-15T08:00:00.000Z' },
      },
    },
    Conversation: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', example: 'c3d4e5f6-a7b8-9012-cdef-345678901234' },
        customerId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        customerName: { type: 'string', example: 'Nguyễn Văn A' },
        customerEmail: { type: 'string', format: 'email', example: 'a@gmail.com' },
        lastMessage: { type: 'string', example: 'Cho mình hỏi size L còn không ạ?' },
        lastMessageAt: { type: 'string', format: 'date-time', example: '2026-07-15T08:00:00.000Z' },
        unreadByAdmin: { type: 'integer', example: 2 },
        unreadByCustomer: { type: 'integer', example: 0 },
        aiEnabled: { type: 'boolean', description: 'Bot tự tắt khi admin trả lời tay', example: true },
        lastProductId: { type: 'integer', nullable: true, example: 5 },
        lastProduct: { $ref: '#/components/schemas/ProductRef' },
        createdAt: { type: 'string', format: 'date-time', example: '2026-07-15T08:00:00.000Z' },
      },
    },
    UploadResult: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Đường dẫn tương đối để lưu vào DB', example: '/uploads/news/1720051200000-abc123.jpg' },
        size: { type: 'integer', description: 'Byte', example: 245678 },
        mimeType: { type: 'string', example: 'image/jpeg' },
      },
    },

    StoreSettings: {
      type: 'object',
      description: 'Cấu hình toàn cục của cửa hàng — bảng chỉ có đúng một dòng.',
      properties: {
        storeName: { type: 'string', example: 'IKA Fashion' },
        logo: { type: 'string', description: 'Đường dẫn ảnh, rỗng thì FE hiện chữ thay logo', example: '/uploads/settings/1720051200000-logo.png' },
        hotline: { type: 'string', example: '0987 654 321' },
        email: { type: 'string', format: 'email', example: 'support@ika-fashion.vn' },
        address: { type: 'string', example: 'Số 123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh' },
        workingHours: { type: 'string', example: 'T2–T6: 9:00 – 18:00 · T7: 10:00 – 16:00' },
        facebookUrl: { type: 'string', example: 'https://facebook.com/ikafashion' },
        instagramUrl: { type: 'string', example: 'https://instagram.com/ikafashion' },
        tiktokUrl: { type: 'string', example: 'https://tiktok.com/@ikafashion' },
        updatedAt: { type: 'string', format: 'date-time', example: '2026-08-08T08:00:00.000Z' },
      },
    },
    StoreSettingsUpdateBody: {
      type: 'object',
      description: 'Mọi trường đều tuỳ chọn — chỉ gửi cái muốn đổi. Link mạng xã hội nhận chuỗi rỗng (chưa khai báo) hoặc URL hợp lệ.',
      properties: {
        storeName: { type: 'string', minLength: 1, maxLength: 150, example: 'IKA Fashion' },
        logo: { type: 'string', maxLength: 500, example: '/uploads/settings/1720051200000-logo.png' },
        hotline: { type: 'string', maxLength: 30, example: '0987 654 321' },
        email: { type: 'string', format: 'email', maxLength: 150, example: 'support@ika-fashion.vn' },
        address: { type: 'string', maxLength: 255, example: 'Số 123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh' },
        workingHours: { type: 'string', maxLength: 255, example: 'T2–T6: 9:00 – 18:00 · T7: 10:00 – 16:00' },
        facebookUrl: { type: 'string', maxLength: 300, example: 'https://facebook.com/ikafashion' },
        instagramUrl: { type: 'string', maxLength: 300, example: 'https://instagram.com/ikafashion' },
        tiktokUrl: { type: 'string', maxLength: 300, example: 'https://tiktok.com/@ikafashion' },
      },
    },

    // ══════════════ Body gửi lên — Xác thực ══════════════
    RegisterBody: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100, example: 'Nguyễn Văn A' },
        email: { type: 'string', format: 'email', example: 'a@gmail.com' },
        password: { type: 'string', minLength: 6, maxLength: 100, example: '123456' },
      },
    },
    LoginBody: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'admin@ika.vn' },
        password: { type: 'string', minLength: 1, example: 'admin123' },
      },
    },
    UpdateProfileBody: {
      type: 'object',
      description: 'Chỉ gửi trường muốn đổi — trường bỏ trống giữ nguyên giá trị cũ.',
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100, example: 'Nguyễn Văn A' },
        phone: { type: 'string', maxLength: 20, example: '0901234567' },
        address: { type: 'string', maxLength: 255, example: '123 Lê Lợi, Quận 1, TP.HCM' },
      },
    },

    // ══════════════ Body gửi lên — Giỏ hàng ══════════════
    CartAddItemBody: {
      type: 'object',
      required: ['productId', 'size', 'color'],
      description: 'Size và màu phải nằm trong danh sách `sizes`/`colors` của sản phẩm, không thì trả 400.',
      properties: {
        productId: { type: 'integer', minimum: 1, example: 1 },
        size: { type: 'string', minLength: 1, example: 'M' },
        color: { type: 'string', minLength: 1, example: 'Trắng' },
        quantity: { type: 'integer', minimum: 1, maximum: 99, default: 1, example: 2 },
      },
    },
    CartUpdateItemBody: {
      type: 'object',
      required: ['quantity'],
      properties: {
        quantity: { type: 'integer', minimum: 1, maximum: 99, example: 3 },
      },
    },

    // ══════════════ Body gửi lên — Đơn hàng ══════════════
    OrderCreateBody: {
      type: 'object',
      required: ['shippingAddress', 'phone'],
      description: 'Sản phẩm lấy thẳng từ giỏ hàng của người gửi, không truyền items.',
      properties: {
        shippingAddress: { type: 'string', minLength: 5, maxLength: 255, example: '123 Lê Lợi, Quận 1, TP.HCM' },
        phone: { type: 'string', minLength: 8, maxLength: 20, example: '0901234567' },
        notes: { type: 'string', maxLength: 500, default: '', example: 'Giao giờ hành chính, gọi trước 15 phút' },
        couponCode: { type: 'string', maxLength: 50, example: 'IKANEW10' },
      },
    },
    OrderUpdateStatusBody: {
      type: 'object',
      description: 'Gửi một hoặc cả hai trường.',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'],
          description: '`returned` KHÔNG có ở đây — chỉ đặt được qua luồng duyệt yêu cầu trả hàng',
          example: 'completed',
        },
        paymentStatus: { type: 'string', enum: ['unpaid', 'paid', 'refunded'], example: 'paid' },
      },
    },

    // ══════════════ Body gửi lên — Yêu thích & mã giảm giá ══════════════
    WishlistAddBody: {
      type: 'object',
      required: ['productId'],
      properties: {
        productId: { type: 'integer', minimum: 1, example: 1 },
      },
    },
    CouponApplyBody: {
      type: 'object',
      required: ['code', 'subtotal'],
      properties: {
        code: { type: 'string', minLength: 1, maxLength: 50, example: 'IKANEW10' },
        subtotal: { type: 'integer', minimum: 0, description: 'Tổng tiền giỏ hàng trước giảm giá (VND)', example: 398000 },
      },
    },
    CouponCreateBody: {
      type: 'object',
      required: ['code', 'type', 'value', 'expiryDate'],
      properties: {
        code: { type: 'string', minLength: 1, maxLength: 50, example: 'CHAOHE' },
        type: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
        value: { type: 'integer', minimum: 1, description: 'percentage → phần trăm; fixed → số tiền VND', example: 15 },
        minOrder: { type: 'integer', minimum: 0, default: 0, example: 200000 },
        quantity: { type: 'integer', minimum: 0, default: 100, example: 100 },
        active: { type: 'boolean', default: true, example: true },
        expiryDate: { type: 'string', format: 'date', pattern: '^\\d{4}-\\d{2}-\\d{2}$', example: '2026-12-31' },
      },
    },
    CouponUpdateBody: {
      type: 'object',
      description: 'Mọi trường đều tuỳ chọn — chỉ gửi cái muốn đổi.',
      properties: {
        code: { type: 'string', minLength: 1, maxLength: 50, example: 'CHAOHE' },
        type: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
        value: { type: 'integer', minimum: 1, example: 20 },
        minOrder: { type: 'integer', minimum: 0, example: 300000 },
        quantity: { type: 'integer', minimum: 0, example: 50 },
        active: { type: 'boolean', example: true },
        expiryDate: { type: 'string', format: 'date', pattern: '^\\d{4}-\\d{2}-\\d{2}$', example: '2027-01-31' },
      },
    },

    // ══════════════ Body gửi lên — Đánh giá ══════════════
    ReviewCreateBody: {
      type: 'object',
      required: ['productId', 'rating'],
      properties: {
        productId: { type: 'integer', minimum: 1, example: 1 },
        rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
        comment: { type: 'string', maxLength: 2000, default: '', example: 'Sản phẩm rất đẹp, vải mát!' },
      },
    },
    ReviewReplyBody: {
      type: 'object',
      description: 'Gửi chuỗi rỗng để xoá phản hồi cũ.',
      properties: {
        reply: { type: 'string', maxLength: 2000, default: '', example: 'Cảm ơn bạn đã ủng hộ shop!' },
      },
    },

    // ══════════════ Body gửi lên — Tin nhắn ══════════════
    MessageSendBody: {
      type: 'object',
      required: ['content'],
      description: 'Khách bỏ trống `conversationId` thì server tự tạo hội thoại mới. Admin bắt buộc truyền để biết trả lời vào đâu.',
      properties: {
        content: { type: 'string', minLength: 1, maxLength: 2000, example: 'Cho mình hỏi size L còn không ạ?' },
        conversationId: { type: 'string', format: 'uuid', example: 'c3d4e5f6-a7b8-9012-cdef-345678901234' },
        productId: { type: 'integer', minimum: 1, nullable: true, description: 'Sản phẩm khách đang xem lúc nhắn', example: 5 },
      },
    },
    MessageToggleBotBody: {
      type: 'object',
      required: ['aiEnabled'],
      properties: {
        aiEnabled: { type: 'boolean', example: true },
      },
    },

    // ══════════════ Body gửi lên — Tin tức ══════════════
    NewsCreateBody: {
      type: 'object',
      required: ['title', 'content'],
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 300, example: 'Xu hướng thời trang nam thu đông 2026' },
        slug: { type: 'string', maxLength: 350, description: 'Bỏ trống thì tự sinh từ tiêu đề (bỏ dấu tiếng Việt, trùng thì thêm hậu tố -2)', example: 'xu-huong-thoi-trang-nam-thu-dong-2026' },
        img: { type: 'string', maxLength: 500, default: '', example: '/uploads/news/anh-bia.jpg' },
        excerpt: { type: 'string', maxLength: 500, default: '', example: 'Gam màu trầm ấm và phom dáng vừa vặn định hình mùa lạnh năm nay.' },
        content: { type: 'string', minLength: 1, description: 'Markdown. Thẻ HTML bị loại bỏ khi lưu.', example: 'Đoạn mở đầu.\n\n## Tiêu đề mục\n\n- Gạch đầu dòng\n\n> Trích dẫn' },
        author: { type: 'string', maxLength: 100, example: 'IKA Fashion' },
        categoryId: { type: 'integer', minimum: 1, nullable: true, example: 1 },
        status: { type: 'string', enum: ['draft', 'published'], default: 'draft', example: 'published' },
        date: { type: 'string', description: "Nhận cả 'yyyy-mm-dd' lẫn 'dd/mm/yyyy'", example: '2026-07-15' },
      },
    },
    NewsUpdateBody: {
      type: 'object',
      description: 'Mọi trường đều tuỳ chọn. Slug chỉ đổi khi truyền `slug` — sửa tiêu đề không phá URL đã công khai.',
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 300, example: 'Xu hướng thời trang nam thu đông 2026 (cập nhật)' },
        slug: { type: 'string', maxLength: 350, example: 'xu-huong-thoi-trang-nam-thu-dong-2026' },
        img: { type: 'string', maxLength: 500, example: '/uploads/news/anh-bia-moi.jpg' },
        excerpt: { type: 'string', maxLength: 500, example: 'Bản cập nhật tháng 8 với vài gợi ý phối đồ mới.' },
        content: { type: 'string', minLength: 1, example: 'Đoạn mở đầu đã sửa.\n\n## Tiêu đề mục' },
        author: { type: 'string', maxLength: 100, example: 'IKA Fashion' },
        categoryId: { type: 'integer', minimum: 1, nullable: true, example: 1 },
        status: { type: 'string', enum: ['draft', 'published'], example: 'published' },
        date: { type: 'string', example: '2026-08-01' },
      },
    },
    NewsStatusBody: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['draft', 'published'], example: 'published' },
      },
    },

    // ══════════════ Body gửi lên — Sản phẩm & danh mục ══════════════
    ProductCreateBody: {
      type: 'object',
      required: ['name', 'handle', 'collection', 'type', 'price'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 200, example: 'Áo thun cotton basic' },
        handle: { type: 'string', minLength: 1, maxLength: 200, description: 'Định danh trên URL, phải là duy nhất', example: 'ao-thun-cotton-basic' },
        collection: { type: 'string', minLength: 1, maxLength: 100, description: 'slug danh mục: ao-thun | ao-polo | quan', example: 'ao-thun' },
        type: { type: 'string', minLength: 1, maxLength: 100, example: 'Áo thun' },
        price: { type: 'integer', minimum: 1, description: 'Đơn vị VND', example: 199000 },
        img: { type: 'string', default: '/products/placeholder.png', example: '/uploads/products/ao-thun.jpg' },
        images: { type: 'array', items: { type: 'string' }, default: [], example: ['/uploads/products/ao-thun-1.jpg', '/uploads/products/ao-thun-2.jpg'] },
        colors: { type: 'array', items: { type: 'string' }, default: [], example: ['Trắng', 'Đen'] },
        sizes: { type: 'array', items: { type: 'string' }, default: [], example: ['M', 'L', 'XL'] },
        features: { type: 'array', items: { type: 'string' }, default: [], example: ['Cotton 100%', 'Co giãn 4 chiều'] },
        stock: { type: 'integer', minimum: 0, default: 0, example: 50 },
        description: { type: 'string', maxLength: 1000, default: '', example: 'Chất cotton mềm, thấm hút tốt, mặc mát cả ngày.' },
      },
    },
    ProductUpdateBody: {
      type: 'object',
      description: 'Mọi trường đều tuỳ chọn — chỉ gửi cái muốn đổi.',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 200, example: 'Áo thun cotton basic 2026' },
        handle: { type: 'string', minLength: 1, maxLength: 200, example: 'ao-thun-cotton-basic' },
        collection: { type: 'string', minLength: 1, maxLength: 100, example: 'ao-thun' },
        type: { type: 'string', minLength: 1, maxLength: 100, example: 'Áo thun' },
        price: { type: 'integer', minimum: 1, example: 179000 },
        img: { type: 'string', example: '/uploads/products/ao-thun.jpg' },
        images: { type: 'array', items: { type: 'string' }, example: ['/uploads/products/ao-thun-1.jpg'] },
        colors: { type: 'array', items: { type: 'string' }, example: ['Trắng', 'Đen', 'Xám'] },
        sizes: { type: 'array', items: { type: 'string' }, example: ['M', 'L', 'XL'] },
        features: { type: 'array', items: { type: 'string' }, example: ['Cotton 100%'] },
        stock: { type: 'integer', minimum: 0, example: 80 },
        description: { type: 'string', maxLength: 1000, example: 'Mô tả đã cập nhật.' },
      },
    },
    CollectionCreateBody: {
      type: 'object',
      required: ['name', 'slug'],
      properties: {
        name: { type: 'string', example: 'Áo khoác' },
        slug: { type: 'string', description: 'Phải là duy nhất, trùng thì trả 409', example: 'ao-khoac' },
        img: { type: 'string', description: 'Bỏ trống thì dùng ảnh mặc định', example: '/uploads/collections/ao-khoac.jpg' },
      },
    },
    CollectionUpdateBody: {
      type: 'object',
      description: 'Trường bỏ trống giữ nguyên giá trị cũ (COALESCE ở tầng service).',
      properties: {
        name: { type: 'string', example: 'Áo khoác nam' },
        slug: { type: 'string', example: 'ao-khoac-nam' },
        img: { type: 'string', example: '/uploads/collections/ao-khoac.jpg' },
      },
    },

    // ══════════════ Body gửi lên — Người dùng ══════════════
    UserRoleBody: {
      type: 'object',
      required: ['role'],
      properties: {
        role: { type: 'string', enum: ['customer', 'staff', 'admin'], example: 'staff' },
      },
    },
    ChangePasswordBody: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string', example: 'matkhaucu123' },
        newPassword: { type: 'string', minLength: 6, maxLength: 100, example: 'matkhaumoi456' },
      },
    },
    CreateUserBody: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100, example: 'Trần Thu Hà' },
        email: { type: 'string', format: 'email', example: 'ha.tran@ika.vn' },
        password: { type: 'string', minLength: 6, maxLength: 100, example: 'nhanvien123' },
        role: {
          type: 'string',
          enum: ['customer', 'staff', 'admin'],
          default: 'staff',
          example: 'staff',
        },
      },
    },
  },

  responses: {
    Unauthorized: {
      description: 'Thiếu token, token sai hoặc đã hết hạn',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Token không hợp lệ hoặc đã hết hạn' } } },
    },
    Forbidden: {
      description: 'Đã đăng nhập nhưng không đủ quyền',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Bạn không có quyền truy cập' } } },
    },
    NotFound: {
      description: 'Không tìm thấy tài nguyên',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Không tìm thấy' } } },
    },
    Conflict: {
      description: 'Trùng dữ liệu đã tồn tại',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Dữ liệu đã tồn tại' } } },
    },
    ValidationError: {
      description: 'Body không qua được vòng kiểm tra zod',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } },
    },
  },
};
