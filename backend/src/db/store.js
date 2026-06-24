// =============================================================
// IKA Fashion — In-memory data store (runtime).
// Dữ liệu sản phẩm seed sẵn; users/carts/orders/wishlist rỗng
// lúc khởi động và được điền qua API. Tham khảo database/migration.sql
// để triển khai PostgreSQL thật.
// =============================================================

const T_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const P_SIZES = ['28', '30', '32', '34', '36', '38'];
const SHIRT_FEAT = ['Vải Premium', 'Nhanh Khô', 'Thoáng Khí', 'Không Phai'];
const POLO_FEAT = ['Vải Piqué', 'Kháng Nhăn', 'Khí Chất', 'Bền Lâu'];

export const products = new Map([
  [1,  { id: 1,  name: 'Áo Thun Trắng Premium', handle: 'ao-thun-trang', collection: 'ao-thun', type: 'Áo Thun', price: 299000, img: '/products/ao-thun-trang.png', images: ['/products/ao-thun-trang.png'], colors: ['Trắng'],     sizes: T_SIZES, features: SHIRT_FEAT, rating: 4.8, sold: 152, stock: 120, description: 'Áo thun trắng tinh khôi, vải 100% cotton, thoáng khí, nhanh khô với công nghệ AirDry™' }],
  [2,  { id: 2,  name: 'Áo Thun Đen Premium',   handle: 'ao-thun-den',   collection: 'ao-thun', type: 'Áo Thun', price: 299000, img: '/products/ao-thun-den.png',   images: ['/products/ao-thun-den.png'],   colors: ['Đen'],       sizes: T_SIZES, features: SHIRT_FEAT, rating: 4.9, sold: 203, stock: 100, description: 'Áo thun đen đẹp, vải 100% cotton, thoáng khí, nhanh khô với công nghệ AirDry™' }],
  [3,  { id: 3,  name: 'Áo Thun Xanh Navy',     handle: 'ao-thun-xanh',  collection: 'ao-thun', type: 'Áo Thun', price: 299000, img: '/products/ao-thun-xanh.png',  images: ['/products/ao-thun-xanh.png'],  colors: ['Xanh Navy'], sizes: T_SIZES, features: SHIRT_FEAT, rating: 4.7, sold: 98,  stock: 80,  description: 'Áo thun xanh navy lịch sự, vải 100% cotton, thoáng khí, nhanh khô' }],
  [4,  { id: 4,  name: 'Áo Thun Xám',           handle: 'ao-thun-xam',   collection: 'ao-thun', type: 'Áo Thun', price: 299000, img: '/products/ao-thun-xam.png',   images: ['/products/ao-thun-xam.png'],   colors: ['Xám'],       sizes: T_SIZES, features: SHIRT_FEAT, rating: 4.6, sold: 74,  stock: 90,  description: 'Áo thun xám trung tính, vải 100% cotton, thoáng khí, nhanh khô' }],

  [5,  { id: 5,  name: 'Áo Polo Trắng',     handle: 'ao-polo-trang', collection: 'ao-polo', type: 'Áo Polo', price: 399000, img: '/products/ao-polo-white.png', images: ['/products/ao-polo-white.png'], colors: ['Trắng'],     sizes: T_SIZES, features: POLO_FEAT, rating: 4.8, sold: 110, stock: 70, description: 'Áo polo trắng sang trọng, vải piqué cao cấp, phù hợp mặc đi làm' }],
  [6,  { id: 6,  name: 'Áo Polo Xanh Navy', handle: 'ao-polo-xanh',  collection: 'ao-polo', type: 'Áo Polo', price: 399000, img: '/products/ao-polo-blue.png',  images: ['/products/ao-polo-blue.png'],  colors: ['Xanh Navy'], sizes: T_SIZES, features: POLO_FEAT, rating: 4.7, sold: 87,  stock: 65, description: 'Áo polo xanh navy lịch sự, vải piqué cao cấp, phù hợp mặc đi làm' }],
  [7,  { id: 7,  name: 'Áo Polo Đỏ',        handle: 'ao-polo-do',    collection: 'ao-polo', type: 'Áo Polo', price: 399000, img: '/products/ao-polo-red.png',   images: ['/products/ao-polo-red.png'],   colors: ['Đỏ'],        sizes: T_SIZES, features: POLO_FEAT, rating: 4.6, sold: 63,  stock: 55, description: 'Áo polo đỏ nổi bật, vải piqué cao cấp, phù hợp mặc dạo phố' }],
  [8,  { id: 8,  name: 'Áo Polo Đen',       handle: 'ao-polo-den',   collection: 'ao-polo', type: 'Áo Polo', price: 399000, img: '/products/ao-polo-black.png', images: ['/products/ao-polo-black.png'], colors: ['Đen'],       sizes: T_SIZES, features: POLO_FEAT, rating: 4.9, sold: 134, stock: 60, description: 'Áo polo đen thanh lịch, vải piqué cao cấp, phù hợp mặc đi làm' }],

  [9,  { id: 9,  name: 'Quần Đen Slim Fit',   handle: 'quan-den',  collection: 'quan', type: 'Quần', price: 499000, img: '/products/quan-den.png',  images: ['/products/quan-den.png'],  colors: ['Đen'],       sizes: P_SIZES, features: ['Slim Fit', 'Co Giãn', 'Tôn Dáng', 'Bền Lâu'],          rating: 4.8, sold: 91, stock: 50, description: 'Quần đen slim fit hiện đại, tôn dáng, công nghệ co giãn FlexFit™' }],
  [10, { id: 10, name: 'Quần Jean Xanh Navy', handle: 'quan-xanh', collection: 'quan', type: 'Quần', price: 599000, img: '/products/quan-xanh.png', images: ['/products/quan-xanh.png'], colors: ['Xanh Navy'], sizes: P_SIZES, features: ['Jean Premium', 'Co Giãn', 'Thoải Mái', 'Bền Lâu'],     rating: 4.7, sold: 68, stock: 45, description: 'Quần jean xanh navy chất lượng cao, co giãn thoải mái' }],
  [11, { id: 11, name: 'Quần Kaki Casual',    handle: 'quan-kaki', collection: 'quan', type: 'Quần', price: 449000, img: '/products/quan-kaki.png', images: ['/products/quan-kaki.png'], colors: ['Kaki'],      sizes: P_SIZES, features: ['Casual', 'Thoải Mái', 'Dễ Chăm Sóc', 'Bền Lâu'],        rating: 4.6, sold: 57, stock: 60, description: 'Quần kaki casual thoải mái, phù hợp mặc hàng ngày' }],
  [12, { id: 12, name: 'Quần Xám Formal',     handle: 'quan-xam',  collection: 'quan', type: 'Quần', price: 549000, img: '/products/quan-xam.png',  images: ['/products/quan-xam.png'],  colors: ['Xám'],       sizes: P_SIZES, features: ['Formal', 'Sang Trọng', 'Chất Vải Tốt', 'Bền Lâu'],      rating: 4.7, sold: 44, stock: 40, description: 'Quần xám formal sang trọng, phù hợp mặc đi làm và dự tiệc' }],
]);

export const collections = [
  { id: 1, slug: 'ao-thun', name: 'Áo Thun', img: '/products/ao-thun-trang.png' },
  { id: 2, slug: 'ao-polo', name: 'Áo Polo', img: '/products/ao-polo-white.png' },
  { id: 3, slug: 'quan',    name: 'Quần',    img: '/products/quan-den.png' },
];

// Runtime stores (rỗng lúc khởi động, điền qua API)
export const users = new Map();         // id -> user
export const carts = new Map();         // userId -> { items: [{ productId, size, color, quantity }] }
export const orders = new Map();        // id -> order
export const wishlist = new Map();      // userId -> Set<productId>
