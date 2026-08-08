// =============================================================
// Client gọi IKA Fashion Express API (http://localhost:4000/api/v1).
// API tách theo vai trò:
//   - Public   : /api/v1/...            (duyệt sản phẩm, danh mục, xem đánh giá, auth)
//   - Customer : /api/v1/customer/...   (giỏ, đơn của tôi, wishlist, gửi đánh giá...)
//   - Admin    : /api/v1/admin/...      (quản lý sản phẩm, đơn, user, mã, đánh giá...)
// Token lưu ở localStorage, tự gắn header Authorization cho route cần auth.
// =============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
const TOKEN_KEY = 'ika_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
}

// Trả về toàn bộ JSON { success, message, data, meta? }
async function request(path: string, { method = 'GET', body, auth = false }: RequestOptions = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `Yêu cầu thất bại (${res.status})`)
  }
  return json
}

// Lấy phần `data` cho các endpoint dạng { success, message, data }
async function getData(path: string, opts: RequestOptions = {}) {
  const json = await request(path, opts)
  return json.data
}

// ---------- Kiểu dữ liệu ----------

export interface ApiProduct {
  id: number
  name: string
  handle: string
  collection: string
  type: string
  price: number          // Giá bán cuối — dùng cho Cart & Order
  originalPrice?: number // Giá gốc trước giảm (null nếu không giảm)
  discount: number       // % giảm (0 = không giảm)
  img: string
  images: string[]
  colors: string[]
  sizes: string[]
  features: string[]
  rating: number
  sold: number
  stock: number
  description: string
  // alias để tương thích UI cũ
  title: string
  image: string
}

export interface ProductQuery {
  collection?: string
  search?: string
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'sold' | 'newest'
  page?: number
  limit?: number
  priceMin?: number
  priceMax?: number
  colors?: string
  sizes?: string
  isSale?: boolean  // true → lọc discount > 0 (tab Ưu Đãi)
}

export interface Collection {
  id: number
  slug: string
  name: string
  img: string
  productCount?: number
}

export interface CartLine {
  productId: number
  name: string
  handle: string | null
  img: string | null
  price: number
  size: string
  color: string
  quantity: number
  lineTotal: number
}
export interface Cart {
  items: CartLine[]
  subtotal: number
  totalItems: number
}

export interface Order {
  id: string
  userId: string
  items: Array<{ productId: number; name: string; img: string | null; price: number; size: string; color: string; quantity: number; lineTotal: number }>
  totalPrice: number
  discount: number
  couponCode: string
  status: string
  paymentStatus: string
  shippingAddress: string
  phone: string
  notes: string
  createdAt: string
  updatedAt: string
}

// Khóa định danh 1 dòng giỏ hàng để gọi update/remove
export const lineKey = (it: { productId: number; size: string; color: string }) =>
  `${it.productId}|${it.size}|${it.color}`

function mapProduct(p: any): ApiProduct {
  return {
    ...p,
    // snake_case → camelCase
    originalPrice: p.original_price ?? undefined,
    discount: p.discount ?? 0,
    title: p.name,
    image: p.img,
  }
}

// ---------- Products (công khai) ----------

export async function getProducts(query: ProductQuery = {}): Promise<{ items: ApiProduct[]; meta: any }> {
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  const json = await request(`/products${qs.toString() ? `?${qs}` : ''}`)
  return { items: (json.data as any[]).map(mapProduct), meta: json.meta }
}

export async function getProductByHandle(handle: string): Promise<ApiProduct> {
  return mapProduct(await getData(`/products/handle/${encodeURIComponent(handle)}`))
}

export async function getCollections(): Promise<Collection[]> {
  return getData('/collections')
}

// ---------- Products: quản trị (admin) ----------

export interface ProductInput {
  name: string
  handle: string
  collection: string
  type: string
  price: number
  original_price?: number | null
  discount?: number
  img?: string
  images?: string[]
  colors?: string[]
  sizes?: string[]
  features?: string[]
  stock?: number
  description?: string
}

export async function createProduct(body: ProductInput): Promise<ApiProduct> {
  return mapProduct(await getData('/admin/products', { method: 'POST', body, auth: true }))
}
export async function updateProduct(id: number, body: Partial<ProductInput>): Promise<ApiProduct> {
  return mapProduct(await getData(`/admin/products/${id}`, { method: 'PUT', body, auth: true }))
}
export async function deleteProduct(id: number): Promise<void> {
  await request(`/admin/products/${id}`, { method: 'DELETE', auth: true })
}

// ---------- Cart (khách hàng) ----------

export function getCart(): Promise<Cart> {
  return getData('/customer/cart', { auth: true })
}
export function addToCart(item: { productId: number; size: string; color: string; quantity?: number }): Promise<Cart> {
  return getData('/customer/cart/items', { method: 'POST', body: item, auth: true })
}
export function updateCartItem(key: string, quantity: number): Promise<Cart> {
  return getData(`/customer/cart/items/${encodeURIComponent(key)}`, { method: 'PUT', body: { quantity }, auth: true })
}
export function removeCartItem(key: string): Promise<Cart> {
  return getData(`/customer/cart/items/${encodeURIComponent(key)}`, { method: 'DELETE', auth: true })
}
export function clearCart(): Promise<Cart> {
  return getData('/customer/cart', { method: 'DELETE', auth: true })
}

// ---------- Wishlist (khách hàng) ----------

export function getWishlist(): Promise<ApiProduct[]> {
  return getData('/customer/wishlist', { auth: true }).then((arr: any[]) => arr.map(mapProduct))
}
export function addWishlist(productId: number): Promise<ApiProduct[]> {
  return getData('/customer/wishlist', { method: 'POST', body: { productId }, auth: true }).then((arr: any[]) => arr.map(mapProduct))
}
export function removeWishlist(productId: number): Promise<ApiProduct[]> {
  return getData(`/customer/wishlist/${productId}`, { method: 'DELETE', auth: true }).then((arr: any[]) => arr.map(mapProduct))
}

// ---------- Orders (khách hàng) ----------

export function createOrder(body: { shippingAddress: string; phone: string; notes?: string; couponCode?: string }): Promise<Order> {
  return getData('/customer/orders', { method: 'POST', body, auth: true })
}
export function getMyOrders(): Promise<Order[]> {
  return getData('/customer/orders', { auth: true })
}

// ---------- Admin ----------

export interface ApiUser {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  address?: string
  isLocked?: boolean
  createdAt: string
}

export function getAdminOrders(status?: string): Promise<Order[]> {
  return getData(`/admin/orders${status ? `?status=${status}` : ''}`, { auth: true })
}

export function updateOrderStatus(id: string, body: { status: string; paymentStatus?: string }): Promise<Order> {
  return getData(`/admin/orders/${id}/status`, { method: 'PUT', body, auth: true })
}

export function getAdminCustomers(): Promise<ApiUser[]> {
  return getData('/admin/users', { auth: true })
}

export function deleteCustomer(id: string): Promise<void> {
  return request(`/admin/users/${id}`, { method: 'DELETE', auth: true }).then(() => { })
}

export function toggleLockCustomer(id: string): Promise<ApiUser> {
  return getData(`/admin/users/${id}/toggle-lock`, { method: 'PUT', auth: true })
}

export function updateUserRole(id: string, role: string): Promise<ApiUser> {
  return getData(`/admin/users/${id}/role`, { method: 'PUT', body: { role }, auth: true })
}

export function createCollection(body: { name: string; slug: string; img?: string }): Promise<Collection> {
  return getData('/admin/collections', { method: 'POST', body, auth: true })
}

export function updateCollection(id: number, body: Partial<{ name: string; slug: string; img: string }>): Promise<Collection> {
  return getData(`/admin/collections/${id}`, { method: 'PUT', body, auth: true })
}

export function deleteCollection(id: number): Promise<void> {
  return request(`/admin/collections/${id}`, { method: 'DELETE', auth: true }).then(() => { })
}

// ---------- Auth (dùng bởi auth-client) ----------

export function apiLogin(body: { email: string; password: string }) {
  return getData('/auth/login', { method: 'POST', body })
}
export function apiRegister(body: { name: string; email: string; password: string }) {
  return getData('/auth/register', { method: 'POST', body })
}
export function apiLogout() {
  return request('/auth/logout', { method: 'POST', auth: true })
}

// ---------- Messages ----------

/** Thẻ sản phẩm bot đính kèm câu trả lời */
export interface ProductSuggestion {
  id: number
  name: string
  handle: string
  price: number
  img: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string | null
  senderRole: 'admin' | 'customer' | 'ai'
  senderName: string
  content: string
  productId: number | null
  product: ProductSuggestion | null
  suggestions: ProductSuggestion[]
  intent: string
  createdAt: string
  isRead: boolean
}

export interface Conversation {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  lastMessage: string
  lastMessageAt: string
  unreadByAdmin: number
  unreadByCustomer: number
  aiEnabled: boolean
  lastProductId: number | null
  lastProduct: ProductSuggestion | null
  createdAt: string
}
type MsgScope = 'customer' | 'admin'
const msgBase = (scope: MsgScope) => `/${scope}/messages`

/** Admin: lấy tất cả conversations */
export function getAdminConversations(): Promise<Conversation[]> {
  return getData('/admin/messages/conversations', { auth: true })
}

/** Admin: lấy số tin nhắn chưa đọc */
export function getUnreadMessageCount(): Promise<{ count: number }> {
  return getData('/admin/messages/unread-count', { auth: true })
}

/**
 * Customer: lấy conversation của mình.
 * `ensure` = khách vừa mở khung chat → tạo hội thoại kèm lời chào của bot.
 * Khi chỉ poll badge thì để mặc định, tránh đẻ hội thoại rỗng cho mọi khách.
 */
export function getMyConversation(ensure = false): Promise<Conversation | null> {
  return getData(`/customer/messages/my${ensure ? '?ensure=1' : ''}`, { auth: true })
}

/** Lấy tin nhắn của 1 conversation (mặc định phía khách) */
export function getConversationMessages(conversationId: string, scope: MsgScope = 'customer'): Promise<Message[]> {
  return getData(`${msgBase(scope)}/${conversationId}/messages`, { auth: true })
}

/**
 * Gửi tin nhắn — Customer: { content, productId? }; Admin: { content, conversationId }.
 * `botMessage` là câu trả lời tự động, null khi bot đang tắt hoặc admin gửi.
 */
export function sendMessage(
  body: { content: string; conversationId?: string; productId?: number | null },
  scope: MsgScope = 'customer',
): Promise<{ message: Message; botMessage: Message | null; conversation: Conversation }> {
  return getData(msgBase(scope), { method: 'POST', body, auth: true })
}

/** Đánh dấu conversation đã đọc */
export function markConversationRead(conversationId: string, scope: MsgScope = 'customer'): Promise<Conversation> {
  return getData(`${msgBase(scope)}/${conversationId}/read`, { method: 'PUT', auth: true })
}

/** Admin: bật/tắt bot cho 1 conversation */
export function toggleConversationBot(conversationId: string, aiEnabled: boolean): Promise<Conversation> {
  return getData(`/admin/messages/${conversationId}/bot`, { method: 'PATCH', body: { aiEnabled }, auth: true })
}

/** Admin: xóa 1 tin nhắn */
export function deleteMessage(messageId: string): Promise<void> {
  return request(`/admin/messages/${messageId}`, { method: 'DELETE', auth: true }).then(() => { })
}

// ---------- Khuyến mãi / Coupon ----------

export interface Coupon {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrder: number
  quantity: number
  used: number
  active: boolean
  expiryDate: string
}
export interface CouponInput {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrder?: number
  quantity?: number
  active?: boolean
  expiryDate: string
}
export interface AppliedCoupon {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrder: number
  discount: number
}

/** Khách: áp mã lúc checkout (xem trước số tiền giảm) */
export function applyCoupon(code: string, subtotal: number): Promise<AppliedCoupon> {
  return getData('/customer/coupons/apply', { method: 'POST', body: { code, subtotal }, auth: true })
}
/** Admin: danh sách mã giảm giá */
export function getAdminCoupons(): Promise<Coupon[]> {
  return getData('/admin/coupons', { auth: true })
}
export function createCoupon(body: CouponInput): Promise<Coupon> {
  return getData('/admin/coupons', { method: 'POST', body, auth: true })
}
export function updateCoupon(id: number, body: Partial<CouponInput>): Promise<Coupon> {
  return getData(`/admin/coupons/${id}`, { method: 'PUT', body, auth: true })
}
export function toggleCoupon(id: number): Promise<Coupon> {
  return getData(`/admin/coupons/${id}/toggle`, { method: 'PUT', auth: true })
}
export function deleteCoupon(id: number): Promise<void> {
  return request(`/admin/coupons/${id}`, { method: 'DELETE', auth: true }).then(() => { })
}

// ---------- Đánh giá / Reviews ----------

export interface Review {
  id: number
  productId?: number
  userName: string
  productName?: string
  rating: number
  comment: string
  approved?: boolean
  reply: string | null
  createdAt: string
}

/** Công khai: đánh giá đã duyệt của 1 sản phẩm */
export function getProductReviews(productId: number): Promise<Review[]> {
  return getData(`/reviews/product/${productId}`)
}
/** Khách đã đăng nhập: có đủ điều kiện đánh giá không (đã mua + nhận hàng hoàn thành) */
export function canReviewProduct(productId: number): Promise<{ canReview: boolean }> {
  return getData(`/customer/reviews/eligibility/${productId}`, { auth: true })
}
/** Khách đã đăng nhập: gửi đánh giá */
export function createReview(body: { productId: number; rating: number; comment?: string }): Promise<Review> {
  return getData('/customer/reviews', { method: 'POST', body, auth: true })
}
/** Admin: tất cả đánh giá */
export function getAdminReviews(): Promise<Review[]> {
  return getData('/admin/reviews', { auth: true })
}
export function approveReview(id: number): Promise<{ id: number; approved: boolean }> {
  return getData(`/admin/reviews/${id}/approve`, { method: 'PUT', auth: true })
}
export function replyReview(id: number, reply: string): Promise<{ id: number; reply: string | null }> {
  return getData(`/admin/reviews/${id}/reply`, { method: 'PUT', body: { reply }, auth: true })
}
export function deleteReview(id: number): Promise<void> {
  return request(`/admin/reviews/${id}`, { method: 'DELETE', auth: true }).then(() => { })
}

// ---------- Tải ảnh (admin) ----------

export type UploadType = 'news' | 'products' | 'collections'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/** Trả về thông báo lỗi, hoặc null nếu file hợp lệ. Kiểm tra trước khi gửi lên server. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Ảnh chỉ chấp nhận JPG, PNG hoặc WEBP'
  if (file.size > MAX_IMAGE_BYTES) return 'Ảnh vượt quá dung lượng cho phép (tối đa 5MB)'
  return null
}

/**
 * Tải ảnh lên backend, trả về đường dẫn tương đối dạng /uploads/<type>/<file>.
 * Không dùng `request()` vì multipart phải để trình duyệt tự đặt Content-Type
 * kèm boundary — đặt tay 'application/json' là server không parse được.
 */
export async function uploadImage(file: File, type: UploadType): Promise<string> {
  const invalid = validateImageFile(file)
  if (invalid) throw new Error(invalid)

  const body = new FormData()
  body.append('file', file)

  const token = getToken()
  const res = await fetch(`${API_URL}/admin/uploads/${type}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `Tải ảnh thất bại (${res.status})`)
  }
  return json.data.url as string
}

/** Xoá ảnh đã tải lên. Chỉ dùng được với đường dẫn /uploads/... */
export function deleteUploadedImage(url: string): Promise<void> {
  return request(`/admin/uploads?url=${encodeURIComponent(url)}`, { method: 'DELETE', auth: true }).then(() => { })
}

// ---------- Tin tức / News ----------

export interface NewsCategory {
  id: number
  name: string
  slug: string
  sortOrder: number
  articleCount: number
}

export interface Article {
  id: number
  title: string
  slug: string
  img: string
  excerpt: string
  /** Chỉ có ở API chi tiết, danh sách không trả về cho nhẹ */
  content?: string
  author: string
  category: { id: number; name: string; slug: string } | null
  status: 'draft' | 'published'
  publishDate: string          // 'yyyy-mm-dd'
  createdAt: string
  updatedAt: string
}

export interface ArticleInput {
  title: string
  slug?: string
  img?: string
  excerpt?: string
  content: string
  author?: string
  categoryId?: number | null
  status?: 'draft' | 'published'
  date?: string                // 'yyyy-mm-dd'
}

export interface NewsQuery {
  search?: string
  category?: string
  status?: 'draft' | 'published'
  sort?: 'newest' | 'oldest'
  page?: number
  limit?: number
}

function newsQueryString(query: NewsQuery): string {
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  return qs.toString() ? `?${qs}` : ''
}

/** Công khai: danh sách bài đã đăng */
export async function getNews(query: NewsQuery = {}): Promise<{ items: Article[]; meta: any }> {
  const json = await request(`/news${newsQueryString(query)}`)
  return { items: json.data as Article[], meta: json.meta }
}
export function getArticle(idOrSlug: string | number): Promise<Article> {
  return getData(`/news/${encodeURIComponent(String(idOrSlug))}`)
}
export function getNewsCategories(): Promise<NewsCategory[]> {
  return getData('/news/categories')
}

/** Admin: danh sách gồm cả bài nháp */
export async function getAdminNews(query: NewsQuery = {}): Promise<{ items: Article[]; meta: any }> {
  const json = await request(`/admin/news${newsQueryString(query)}`, { auth: true })
  return { items: json.data as Article[], meta: json.meta }
}
export function getAdminArticle(id: number): Promise<Article> {
  return getData(`/admin/news/${id}`, { auth: true })
}
export function createArticle(body: ArticleInput): Promise<Article> {
  return getData('/admin/news', { method: 'POST', body, auth: true })
}
export function updateArticle(id: number, body: Partial<ArticleInput>): Promise<Article> {
  return getData(`/admin/news/${id}`, { method: 'PUT', body, auth: true })
}
export function updateArticleStatus(id: number, status: 'draft' | 'published'): Promise<Article> {
  return getData(`/admin/news/${id}/status`, { method: 'PATCH', body: { status }, auth: true })
}
export function deleteArticle(id: number): Promise<void> {
  return request(`/admin/news/${id}`, { method: 'DELETE', auth: true }).then(() => { })
}
