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
  price: number          // Giá niêm yết trong bảng products (form admin sửa cột này)
  originalPrice?: number // Giá gốc trước giảm (null nếu không giảm)
  discount: number       // % giảm (0 = không giảm)
  // Giá khách thật sự trả = giá flash nếu đang có chương trình, không thì `price`.
  // Backend tính bằng cùng biểu thức dùng lúc chốt đơn nên hai nơi không lệch nhau.
  effectivePrice: number
  flashPrice?: number     // null = sản phẩm không nằm trong flash sale nào đang chạy
  flashRemaining?: number // số suất giá flash còn lại
  isFlashSale: boolean
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
  price: number           // Giá bán cuối (sau giảm cá nhân)
  originalPrice: number | null  // Giá gốc trước giảm (null nếu không giảm)
  size: string
  color: string
  quantity: number
  lineTotal: number         // price × quantity
  originalLineTotal: number // originalPrice (hoặc price) × quantity
  isFlashSale?: boolean
}
export interface Cart {
  items: CartLine[]
  subtotal: number          // Tổng price (giá sau giảm cá nhân)
  originalSubtotal: number  // Tổng originalPrice (giá gốc, trước giảm cá nhân)
  totalItems: number
}

export interface Order {
  id: string
  userId: string
  customerName: string
  customerEmail: string
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
  /** Yêu cầu trả/đổi mới nhất của đơn — null nếu khách chưa gửi lần nào. */
  returnRequest: OrderReturn | null
}

// ---------- Trả hàng / Đổi mới ----------
// Mỗi yêu cầu áp cho CẢ ĐƠN. Một đơn chỉ có một yêu cầu đang mở tại một thời điểm.

export type ReturnType = 'return' | 'exchange'
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export interface OrderReturn {
  id: number
  orderId: string
  type: ReturnType
  reason: string
  /** Ảnh khách đính kèm để cửa hàng đối chiếu với lý do. */
  images: string[]
  status: ReturnStatus
  adminNote: string
  createdAt: string
  resolvedAt: string | null
  // Kèm theo khi lấy từ danh sách quản trị
  orderTotal?: number
  orderStatus?: string
  orderCreatedAt?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
}

/** Số ngày kể từ khi đơn hoàn thành mà khách còn được yêu cầu — khớp với backend. */
export const RETURN_WINDOW_DAYS = 7

export const RETURN_TYPE_LABEL: Record<ReturnType, string> = {
  return: 'Trả hàng',
  exchange: 'Đổi mới',
}

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  completed: 'Đã xử lý xong',
}

/** Đơn có còn trong hạn đổi trả không — đối xứng với kiểm tra ở backend. */
export function canRequestReturn(order: Order) {
  if (order.status !== 'completed') return false
  if (order.returnRequest && ['pending', 'approved'].includes(order.returnRequest.status)) return false
  const days = (Date.now() - new Date(order.updatedAt).getTime()) / 86400000
  return days <= RETURN_WINDOW_DAYS
}

export function createReturnRequest(body: {
  orderId: string
  type: ReturnType
  reason: string
  images?: string[]
}): Promise<OrderReturn> {
  return getData('/customer/returns', { method: 'POST', body, auth: true })
}

export function getMyReturns(): Promise<OrderReturn[]> {
  return getData('/customer/returns', { auth: true })
}

export async function getAdminReturns(
  query: { status?: ReturnStatus; page?: number; limit?: number } = {},
): Promise<{ items: OrderReturn[]; pagination: any }> {
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v))
  })
  const json = await request(`/admin/returns${qs.toString() ? `?${qs}` : ''}`, { auth: true })
  const items = json.data?.data || json.data || []
  return { items: items as OrderReturn[], pagination: json.data?.pagination || json.pagination || {} }
}

export function updateReturnStatus(
  id: number,
  body: { status?: ReturnStatus; adminNote?: string },
): Promise<OrderReturn> {
  return getData(`/admin/returns/${id}/status`, { method: 'PUT', body, auth: true })
}

// Khóa định danh 1 dòng giỏ hàng để gọi update/remove
export const lineKey = (it: { productId: number; size: string; color: string }) =>
  `${it.productId}|${it.size}|${it.color}`

function mapProduct(p: any): ApiProduct {
  const price = Number(p.price ?? 0)
  const flashPrice = p.flash_price != null ? Number(p.flash_price) : undefined
  return {
    ...p,
    price,
    // snake_case → camelCase
    originalPrice: p.original_price ?? undefined,
    discount: p.discount ?? 0,
    // Endpoint cũ chưa trả effective_price thì lùi về giá niêm yết, không để undefined
    // lọt xuống phần hiển thị tiền.
    effectivePrice: p.effective_price != null ? Number(p.effective_price) : price,
    flashPrice,
    flashRemaining: p.flash_remaining != null ? Number(p.flash_remaining) : undefined,
    isFlashSale: flashPrice != null,
    title: p.name,
    image: p.img,
  }
}

// ---------- Products (công khai) ----------

export async function getProducts(query: ProductQuery = {}): Promise<{ items: ApiProduct[]; pagination: any }> {
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  const json = await request(`/products${qs.toString() ? `?${qs}` : ''}`)
  const items = json.data?.data || json.data || []
  return { items: (items as any[]).map(mapProduct), pagination: json.data?.pagination || json.pagination || {} }
}

export async function getProductByHandle(handle: string): Promise<ApiProduct> {
  return mapProduct(await getData(`/products/handle/${encodeURIComponent(handle)}`))
}

export async function getCollections(query: CustomerQuery = {}): Promise<{ items: Collection[]; pagination: any }> {
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  const json = await request(`/collections${qs.toString() ? `?${qs}` : ''}`)
  const items = json.data?.data || json.data || []
  return { items: items as Collection[], pagination: json.data?.pagination || json.pagination || {} }
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

export interface AdminOrderQuery {
  status?: string
  /** Tìm trên toàn bộ đơn: mã đơn, SĐT, địa chỉ, tên và email khách. */
  search?: string
  page?: number
  limit?: number
}

/**
 * Thống kê kèm theo danh sách đơn — tính trên TOÀN BỘ đơn khớp bộ lọc, không
 * phải trang đang xem. `revenue` chỉ gồm đơn đã hoàn thành, giống trang Tổng Quan.
 */
export interface AdminOrderSummary {
  total: number
  pending: number
  completed: number
  revenue: number
}

export async function getAdminOrders(
  query: AdminOrderQuery = {},
): Promise<{ items: Order[]; pagination: any; summary: AdminOrderSummary }> {
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  const json = await request(`/admin/orders${qs.toString() ? `?${qs}` : ''}`, { auth: true })
  const items = json.data?.data || json.data || []
  return {
    items: items as Order[],
    pagination: json.data?.pagination || json.pagination || {},
    summary: json.summary ?? { total: 0, pending: 0, completed: 0, revenue: 0 },
  }
}

export function updateOrderStatus(id: string, body: { status: string; paymentStatus?: string }): Promise<Order> {
  return getData(`/admin/orders/${id}/status`, { method: 'PUT', body, auth: true })
}

export interface CustomerQuery {
  page?: number
  limit?: number
  role?: string
}

export interface AdminUserQuery {
  page?: number
  limit?: number
  /** Nhiều vai trò cùng lúc — backend nhận chuỗi phân tách bằng dấu phẩy. */
  roles?: string[]
}

/**
 * Danh sách tài khoản. Tài khoản khách hàng và tài khoản nội bộ là hai nhóm
 * tách bạch, nên mỗi trang truyền đúng nhóm mình cần:
 *   getAdminUsers({ roles: ['customer'] })        — trang Khách Hàng
 *   getAdminUsers({ roles: ['staff', 'admin'] })  — trang Nhân Viên
 */
export async function getAdminUsers(
  query: AdminUserQuery = {},
): Promise<{ items: ApiUser[]; pagination: any }> {
  const { roles, ...rest } = query
  const qs = new URLSearchParams()
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v))
  })
  if (roles?.length) qs.set('role', roles.join(','))
  const json = await request(`/admin/users${qs.toString() ? `?${qs}` : ''}`, { auth: true })
  const items = json.data?.data || json.data || []
  return { items: items as ApiUser[], pagination: json.data?.pagination || json.pagination || {} }
}

export function getAdminCustomers(
  query: Omit<AdminUserQuery, 'roles'> = {},
): Promise<{ items: ApiUser[]; pagination: any }> {
  return getAdminUsers({ ...query, roles: ['customer'] })
}

/** Admin tạo thẳng tài khoản nội bộ. Bỏ trống `role` thì backend mặc định 'staff'. */
export function createStaffAccount(body: {
  name: string
  email: string
  password: string
  role?: string
}): Promise<ApiUser> {
  return getData('/admin/users', { method: 'POST', body, auth: true })
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
export function updateProfile(body: { name?: string; phone?: string; address?: string; city?: string }) {
  return getData('/auth/me', { method: 'PUT', body, auth: true })
}
// Không trả data — chỉ cần biết thành công hay không, lỗi ném ra qua request()
export function changePassword(body: { currentPassword: string; newPassword: string }) {
  return request('/auth/password', { method: 'PUT', body, auth: true })
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
export function getAdminCoupons(query: CustomerQuery = {}): Promise<{ items: Coupon[]; pagination: any }> {
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  return request(`/admin/coupons${qs.toString() ? `?${qs}` : ''}`, { auth: true }).then(json => {
    const items = json.data?.data || json.data || []
    return { items: items as Coupon[], pagination: json.data?.pagination || json.pagination || {} }
  })
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
/**
 * Đánh giá của chính khách về sản phẩm này, KỂ CẢ cái chưa được duyệt.
 * Danh sách công khai lọc `approved` nên khách vừa gửi xong sẽ không thấy bài
 * của mình nếu chỉ dựa vào getProductReviews().
 */
export function getMyProductReviews(productId: number): Promise<Review[]> {
  return getData(`/customer/reviews/mine/${productId}`, { auth: true })
}
/** Khách đã đăng nhập: gửi đánh giá */
export function createReview(body: { productId: number; rating: number; comment?: string }): Promise<Review> {
  return getData('/customer/reviews', { method: 'POST', body, auth: true })
}
/** Admin: tất cả đánh giá */
export function getAdminReviews(query: CustomerQuery = {}): Promise<{ items: Review[]; pagination: any }> {
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  return request(`/admin/reviews${qs.toString() ? `?${qs}` : ''}`, { auth: true }).then(json => {
    const items = json.data?.data || json.data || []
    return { items: items as Review[], pagination: json.data?.pagination || json.pagination || {} }
  })
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

// ---------- Cấu hình cửa hàng ----------

/** Thông tin cửa hàng dùng chung cho Header, Footer và trang Liên hệ. */
export type StoreSettings = {
  storeName: string
  logo: string
  hotline: string
  email: string
  address: string
  mapUrl: string
  workingHours: string
  facebookUrl: string
  instagramUrl: string
  tiktokUrl: string
  youtubeUrl: string
  updatedAt?: string
}

export const MAP_EMBED_PREFIX = 'https://www.google.com/maps/embed'

/** Admin thường dán nguyên thẻ <iframe> từ Google Maps — rút lấy src. */
export function normalizeMapEmbed(value: string): string {
  const iframe = String(value ?? '').match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)
  return (iframe ? iframe[1] : String(value ?? '')).trim()
}

export function isMapEmbed(url: string): boolean {
  return String(url ?? '').startsWith(MAP_EMBED_PREFIX)
}

/**
 * Dự phòng khi admin chưa nhập mã nhúng: dựng bản đồ từ chính địa chỉ cửa hàng.
 * Dạng ?output=embed không cần API key, nhưng kém chính xác hơn mã nhúng thật
 * vì Google phải tự đoán vị trí từ chuỗi địa chỉ.
 */
export function mapEmbedFromAddress(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address || '')}&output=embed`
}

/** Giá trị hiển thị khi chưa gọi được API — khớp dòng seed trong ika_database.sql. */
export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'IKA Fashion',
  logo: '',
  hotline: '0987 654 321',
  email: 'support@ika-fashion.vn',
  address: 'Số 123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
  mapUrl: '',
  workingHours: 'T2–T6: 9:00 – 18:00 · T7: 10:00 – 16:00',
  facebookUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
}

/** Thay đổi: endpoint settings hiện tại yêu cầu auth */
export async function getSettings(): Promise<StoreSettings> {
  const res = await request('/settings', { auth: true })
  return res.data?.data || res.data || {}
}

export function updateSettings(body: Partial<StoreSettings>): Promise<StoreSettings> {
  return getData('/admin/settings', { method: 'PUT', body, auth: true })
}

// ---------- Liên hệ ----------

export type ContactStatus = 'new' | 'processing' | 'resolved'

export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
  new:        'Mới',
  processing: 'Đang xử lý',
  resolved:   'Đã xử lý',
}

export interface ContactRequest {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: ContactStatus
  adminNote: string
  createdAt: string
  updatedAt: string
}

export interface ContactInput {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export interface ContactQuery {
  page?: number
  limit?: number
  status?: ContactStatus
  search?: string
  sort?: 'newest' | 'oldest'
}

/** Công khai — khách chưa đăng nhập vẫn gửi được. */
export function createContact(body: ContactInput): Promise<ContactRequest> {
  return getData('/contacts', { method: 'POST', body })
}

export async function getContacts(
  query: ContactQuery = {},
): Promise<{ items: ContactRequest[]; pagination: any }> {
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  const json = await request(`/admin/contacts${qs.toString() ? `?${qs}` : ''}`, { auth: true })
  
  // Mạng lưới an toàn: trích xuất mảng từ data property, fallback empty array
  const items = json.data?.data || json.data || []
  return { items, pagination: json.data?.pagination || json.pagination || {} }
}

export async function getContactStats(): Promise<{ total: number; new: number; processing: number; resolved: number }> {
  const res = await request('/admin/contacts/stats', { auth: true })
  return res.data?.data || res.data || { total: 0, new: 0, processing: 0, resolved: 0 }
}

export function updateContact(
  id: string,
  body: { status?: ContactStatus; adminNote?: string },
): Promise<ContactRequest> {
  return getData(`/admin/contacts/${id}`, { method: 'PUT', body, auth: true })
}

export function deleteContact(id: string) {
  return request(`/admin/contacts/${id}`, { method: 'DELETE', auth: true })
}

// ---------- Tải ảnh (admin) ----------

// 'returns' là thư mục duy nhất khách hàng được ghi vào (ảnh kèm yêu cầu
// trả/đổi); các thư mục còn lại chỉ admin tải được.
export type UploadType = 'news' | 'products' | 'collections' | 'settings' | 'returns'

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
  // Ảnh yêu cầu trả/đổi do chính khách tải nên đi qua router của khách hàng.
  const scope = type === 'returns' ? 'customer' : 'admin'
  const res = await fetch(`${API_URL}/${scope}/uploads/${type}`, {
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
export async function getNews(query: NewsQuery = {}): Promise<{ items: Article[]; pagination: any }> {
  const json = await request(`/news${newsQueryString(query)}`)
  const items = json.data?.data || json.data || []
  return { items: items as Article[], pagination: json.data?.pagination || json.pagination || {} }
}
export function getArticle(idOrSlug: string | number): Promise<Article> {
  return getData(`/news/${encodeURIComponent(String(idOrSlug))}`)
}
export function getNewsCategories(): Promise<NewsCategory[]> {
  return getData('/news/categories')
}

/** Admin: danh sách gồm cả bài nháp */
export async function getAdminNews(query: NewsQuery = {}): Promise<{ items: Article[]; pagination: any }> {
  const json = await request(`/admin/news${newsQueryString(query)}`, { auth: true })
  const items = json.data?.data || json.data || []
  return { items: items as Article[], pagination: json.data?.pagination || json.pagination || {} }
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

// ---------- Flash Sales ----------
// Mỗi flash sale gắn với ĐÚNG MỘT sản phẩm, có giá ưu đãi, số suất và khung
// giờ riêng.

export interface FlashSale {
  id: number
  productId: number
  price: number          // giá flash
  originalPrice: number  // ảnh chụp giá niêm yết lúc tạo chương trình
  stock: number          // tổng số suất
  sold: number
  remaining: number
  discountPercent: number // tính trên giá niêm yết HIỆN TẠI của sản phẩm
  startsAt: string
  endsAt: string | null   // null = chạy tới khi tắt tay
  active: boolean
  createdAt: string
  // Thông tin sản phẩm đi kèm
  name: string
  handle: string
  img: string
  productPrice: number
  productStock: number
  orderItemCount?: number
}

export interface FlashSaleInput {
  productId: number
  price: number
  stock: number
  startsAt?: string
  endsAt?: string | null
  active?: boolean
}

/** Công khai — các suất đang chạy, dùng cho khối Flash Sale phía khách. */
export function getActiveFlashSales(): Promise<FlashSale[]> {
  return getData('/flash-sales/active')
}

export function getAdminFlashSales(): Promise<FlashSale[]> {
  return getData('/admin/flash-sales', { auth: true })
}
export function createFlashSale(body: FlashSaleInput): Promise<FlashSale> {
  return getData('/admin/flash-sales', { method: 'POST', body, auth: true })
}
export function updateFlashSale(id: number, body: Partial<FlashSaleInput>): Promise<FlashSale> {
  return getData(`/admin/flash-sales/${id}`, { method: 'PUT', body, auth: true })
}
/**
 * Bật / tạm ngưng (tắt tạm, bật lại được).
 *
 * Không có hàm xóa flash sale — đơn hàng cũ trỏ về chương trình để giải thích
 * đơn giá, xóa đi là mất dấu vết đó.
 */
export function toggleFlashSale(id: number): Promise<FlashSale> {
  return getData(`/admin/flash-sales/${id}/toggle`, { method: 'PATCH', auth: true })
}

/** Kết thúc ngay — chốt `endsAt`, sau đó chương trình không sửa được nữa. */
export function endFlashSale(id: number): Promise<FlashSale> {
  return getData(`/admin/flash-sales/${id}/end`, { method: 'PATCH', auth: true })
}

/** Đã kết thúc thì đóng băng: không sửa, không bật/tắt được nữa. */
export function isFlashSaleEditable(fs: FlashSale) {
  return !(fs.endsAt && new Date(fs.endsAt).getTime() <= Date.now())
}

/** Trạng thái hiển thị của một suất — đối xứng với activeFlashWhere() ở backend. */
export type FlashTone = 'live' | 'pending' | 'expired' | 'soldout' | 'off'

export function flashStatus(fs: FlashSale, now = Date.now()): { label: string; tone: FlashTone } {
  const starts = fs.startsAt ? new Date(fs.startsAt).getTime() : null
  const ends = fs.endsAt ? new Date(fs.endsAt).getTime() : null
  if (!fs.active) return { label: 'Tạm ngưng', tone: 'off' }
  if (starts && starts > now) return { label: 'Chưa bắt đầu', tone: 'pending' }
  if (ends && ends < now) return { label: 'Đã kết thúc', tone: 'expired' }
  if (fs.remaining <= 0) return { label: 'Hết suất', tone: 'soldout' }
  return { label: 'Đang chạy', tone: 'live' }
}

// ---------- Thống kê / Báo cáo ----------
// Backend tính sẵn trên toàn bộ đơn trong kỳ nên số liệu không phụ thuộc trang
// đang xem như cách tính tay từ /admin/orders trước đây.

export interface StatsSummary {
  /**
   * Doanh thu trong kỳ = tiền THỰC THU, chỉ tính đơn đã hoàn thành. Cửa hàng
   * thu tiền khi giao nên đơn chưa giao xong chưa mang lại đồng nào.
   */
  revenue: number
  orders: number
  cancelledOrders: number
  completedOrders: number
  returnedOrders: number
  /** Tiền của đơn đã đặt nhưng chưa giao xong — chưa tính vào `revenue`. */
  pendingRevenue: number
  pendingOrders: number
  /** Số món đã bán, cũng chỉ tính trên đơn đã hoàn thành. */
  itemsSold: number
  newCustomers: number
  /** Doanh thu chia cho số đơn đã hoàn thành. */
  avgOrderValue: number
  // Số liệu toàn thời gian, không đổi theo kỳ báo cáo
  totalProducts: number
  lowStockCount: number
  totalCustomers: number
  totalOrders: number
  /** Doanh thu toàn thời gian, cũng chỉ tính đơn đã hoàn thành. */
  totalRevenue: number
}

export interface StatsReport {
  range: { from: string; to: string }
  summary: StatsSummary
  revenueByDay: Array<{ date: string; orders: number; revenue: number }>
  topProducts: Array<{ name: string; collection: string; sold: number; revenue: number; stock: number }>
  orders: Array<{
    id: string; createdAt: string; total: number; discount: number; couponCode: string
    status: string; paymentStatus: string; phone: string; shippingAddress: string
    customerName: string | null; customerEmail: string | null; itemCount: number
  }>
  ordersByStatus: Array<{ status: string; count: number; revenue: number }>
  revenueByCollection: Array<{ collection: string; sold: number; revenue: number }>
  topCustomers: Array<{ name: string; phone: string; email: string; orders: number; spent: number }>
  returns: Array<{
    createdAt: string; type: string; reason: string; status: string
    adminNote: string; orderTotal: number; customerName: string | null
  }>
  lowStock: Array<{ name: string; handle: string; collection: string; stock: number; sold: number }>
}

/** Số liệu báo cáo của một kỳ. Ngày dạng 'YYYY-MM-DD', tính CẢ ngày `to`. */
export function getStatsReport(
  { from, to }: { from?: string; to?: string } = {},
): Promise<StatsReport> {
  const qs = new URLSearchParams()
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  return getData(`/admin/stats/report${qs.toString() ? `?${qs}` : ''}`, { auth: true })
}

// ---------- Tệp tải về: hóa đơn PDF & báo cáo Excel ----------

/**
 * Tải tệp nhị phân (PDF, Excel) từ API.
 *
 * Không dùng thẻ `<a href>` trực tiếp được vì các tuyến này đòi Bearer token —
 * trình duyệt sẽ không tự gắn header. Vì vậy phải fetch kèm token rồi tạo URL
 * tạm từ blob nhận về.
 */
async function fetchFile(
  path: string,
  fallbackName: string,
): Promise<{ url: string; fileName: string; revoke: () => void }> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!res.ok) {
    // Lỗi trả về vẫn là JSON nên đọc ra để hiện đúng thông báo cho người dùng.
    let message = `Tải tệp thất bại (HTTP ${res.status}).`
    try {
      message = (await res.json())?.message || message
    } catch {
      /* giữ thông báo mặc định */
    }
    throw new Error(message)
  }

  // Ưu tiên tên tệp do server đặt trong Content-Disposition.
  const disposition = res.headers.get('Content-Disposition') || ''
  const matched = disposition.match(/filename="?([^";]+)"?/)
  const fileName = matched ? matched[1] : fallbackName

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  return { url, fileName, revoke: () => URL.revokeObjectURL(url) }
}

/**
 * Mở hóa đơn PDF của một đơn ở tab mới để xem rồi in hoặc lưu lại.
 *
 * `admin = true` gọi tuyến quản trị (in được đơn của mọi khách), mặc định là
 * tuyến của khách — chỉ in được đơn của chính mình.
 */
export async function openOrderInvoice(orderId: string, { admin = false } = {}) {
  const base = admin ? '/admin/orders' : '/customer/orders'
  const { url, revoke } = await fetchFile(`${base}/${orderId}/invoice`, 'hoa-don.pdf')
  const win = window.open(url, '_blank')
  if (!win) throw new Error('Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép rồi thử lại.')
  // Giữ URL đủ lâu cho tab mới nạp xong rồi mới thu hồi.
  setTimeout(revoke, 60_000)
}

/** Tải báo cáo thống kê Excel về máy. Ngày dạng 'YYYY-MM-DD', tính cả ngày `to`. */
export async function downloadStatsExcel({ from, to }: { from?: string; to?: string } = {}) {
  const qs = new URLSearchParams()
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  const { url, fileName, revoke } = await fetchFile(
    `/admin/stats/export${qs.toString() ? `?${qs}` : ''}`,
    'thong-ke.xlsx',
  )
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  revoke()
}
