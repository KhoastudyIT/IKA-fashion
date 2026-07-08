// =============================================================
// Client gọi IKA Fashion Express API (http://localhost:4000/api/v1).
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
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
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
  price: number
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
  return { ...p, title: p.name, image: p.img }
}

// ---------- Products ----------

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

// ---------- Products: quản trị (cần token admin) ----------

export interface ProductInput {
  name: string
  handle: string
  collection: string
  type: string
  price: number
  img?: string
  images?: string[]
  colors?: string[]
  sizes?: string[]
  features?: string[]
  stock?: number
  description?: string
}

export async function createProduct(body: ProductInput): Promise<ApiProduct> {
  return mapProduct(await getData('/products', { method: 'POST', body, auth: true }))
}
export async function updateProduct(id: number, body: Partial<ProductInput>): Promise<ApiProduct> {
  return mapProduct(await getData(`/products/${id}`, { method: 'PUT', body, auth: true }))
}
export async function deleteProduct(id: number): Promise<void> {
  await request(`/products/${id}`, { method: 'DELETE', auth: true })
}

// ---------- Cart (cần đăng nhập) ----------

export function getCart(): Promise<Cart> {
  return getData('/cart', { auth: true })
}
export function addToCart(item: { productId: number; size: string; color: string; quantity?: number }): Promise<Cart> {
  return getData('/cart/items', { method: 'POST', body: item, auth: true })
}
export function updateCartItem(key: string, quantity: number): Promise<Cart> {
  return getData(`/cart/items/${encodeURIComponent(key)}`, { method: 'PUT', body: { quantity }, auth: true })
}
export function removeCartItem(key: string): Promise<Cart> {
  return getData(`/cart/items/${encodeURIComponent(key)}`, { method: 'DELETE', auth: true })
}
export function clearCart(): Promise<Cart> {
  return getData('/cart', { method: 'DELETE', auth: true })
}

// ---------- Wishlist (cần đăng nhập) ----------

export function getWishlist(): Promise<ApiProduct[]> {
  return getData('/wishlist', { auth: true }).then((arr: any[]) => arr.map(mapProduct))
}
export function addWishlist(productId: number): Promise<ApiProduct[]> {
  return getData('/wishlist', { method: 'POST', body: { productId }, auth: true }).then((arr: any[]) => arr.map(mapProduct))
}
export function removeWishlist(productId: number): Promise<ApiProduct[]> {
  return getData(`/wishlist/${productId}`, { method: 'DELETE', auth: true }).then((arr: any[]) => arr.map(mapProduct))
}

// ---------- Orders (cần đăng nhập) ----------

export function createOrder(body: { shippingAddress: string; phone: string; notes?: string }): Promise<Order> {
  return getData('/orders', { method: 'POST', body, auth: true })
}
export function getMyOrders(): Promise<Order[]> {
  return getData('/orders', { auth: true })
}

// ---------- Admin API Endpoints ----------

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
  return getData(`/orders/all${status ? `?status=${status}` : ''}`, { auth: true })
}

export function updateOrderStatus(id: string, body: { status: string; paymentStatus?: string }): Promise<Order> {
  return getData(`/orders/${id}/status`, { method: 'PUT', body, auth: true })
}

export function getAdminCustomers(): Promise<ApiUser[]> {
  return getData('/auth/users', { auth: true })
}

export function deleteCustomer(id: string): Promise<void> {
  return request(`/auth/users/${id}`, { method: 'DELETE', auth: true }).then(() => {})
}

export function toggleLockCustomer(id: string): Promise<ApiUser> {
  return getData(`/auth/users/${id}/toggle-lock`, { method: 'PUT', auth: true })
}

export function updateUserRole(id: string, role: string): Promise<ApiUser> {
  return getData(`/auth/users/${id}/role`, { method: 'PUT', body: { role }, auth: true })
}

export function createCollection(body: { name: string; slug: string; img?: string }): Promise<Collection> {
  return getData('/collections', { method: 'POST', body, auth: true })
}

export function updateCollection(id: number, body: Partial<{ name: string; slug: string; img: string }>): Promise<Collection> {
  return getData(`/collections/${id}`, { method: 'PUT', body, auth: true })
}

export function deleteCollection(id: number): Promise<void> {
  return request(`/collections/${id}`, { method: 'DELETE', auth: true }).then(() => {})
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

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderRole: 'admin' | 'customer'
  senderName: string
  content: string
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
  createdAt: string
}

/** Admin: lấy tất cả conversations */
export function getAdminConversations(): Promise<Conversation[]> {
  return getData('/messages/conversations', { auth: true })
}

/** Admin: lấy số tin nhắn chưa đọc */
export function getUnreadMessageCount(): Promise<{ count: number }> {
  return getData('/messages/unread-count', { auth: true })
}

/** Customer: lấy conversation của mình */
export function getMyConversation(): Promise<Conversation | null> {
  return getData('/messages/my', { auth: true })
}

/** Lấy tin nhắn của 1 conversation */
export function getConversationMessages(conversationId: string): Promise<Message[]> {
  return getData(`/messages/${conversationId}/messages`, { auth: true })
}

/** Gửi tin nhắn
 * - Customer: chỉ cần { content }
 * - Admin: cần { content, conversationId }
 */
export function sendMessage(body: { content: string; conversationId?: string }): Promise<{ message: Message; conversation: Conversation }> {
  return getData('/messages', { method: 'POST', body, auth: true })
}

/** Đánh dấu conversation đã đọc */
export function markConversationRead(conversationId: string): Promise<Conversation> {
  return getData(`/messages/${conversationId}/read`, { method: 'PUT', auth: true })
}

/** Admin: xóa 1 tin nhắn */
export function deleteMessage(messageId: string): Promise<void> {
  return request(`/messages/${messageId}`, { method: 'DELETE', auth: true }).then(() => {})
}

