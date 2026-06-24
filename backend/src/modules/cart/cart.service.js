import { carts, products } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

// Khóa định danh 1 dòng giỏ hàng = product + size + color
const lineKey = (productId, size, color) => `${productId}|${size}|${color}`;

function getRaw(userId) {
  if (!carts.has(userId)) carts.set(userId, { items: [] });
  return carts.get(userId);
}

// Gắn thông tin sản phẩm + tính tổng để trả cho client
function present(cart) {
  const items = cart.items.map(it => {
    const product = products.get(it.productId);
    const price = product?.price ?? 0;
    return {
      productId: it.productId,
      name:      product?.name ?? 'Sản phẩm không tồn tại',
      handle:    product?.handle ?? null,
      img:       product?.img ?? null,
      price,
      size:      it.size,
      color:     it.color,
      quantity:  it.quantity,
      lineTotal: price * it.quantity,
    };
  });
  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const totalItems = items.reduce((s, it) => s + it.quantity, 0);
  return { items, subtotal, totalItems };
}

export function getCart(userId) {
  return present(getRaw(userId));
}

export function addItem(userId, { productId, size, color, quantity }) {
  const product = products.get(Number(productId));
  if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);
  if (!product.sizes.includes(size)) throw new AppError('Size không hợp lệ', 400);
  if (!product.colors.includes(color)) throw new AppError('Màu không hợp lệ', 400);

  const cart = getRaw(userId);
  const key = lineKey(Number(productId), size, color);
  const existing = cart.items.find(it => lineKey(it.productId, it.size, it.color) === key);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId: Number(productId), size, color, quantity });
  }
  return present(cart);
}

export function updateItem(userId, key, quantity) {
  const cart = getRaw(userId);
  const item = cart.items.find(it => lineKey(it.productId, it.size, it.color) === key);
  if (!item) throw new AppError('Không tìm thấy sản phẩm trong giỏ', 404);
  item.quantity = quantity;
  return present(cart);
}

export function removeItem(userId, key) {
  const cart = getRaw(userId);
  const before = cart.items.length;
  cart.items = cart.items.filter(it => lineKey(it.productId, it.size, it.color) !== key);
  if (cart.items.length === before) throw new AppError('Không tìm thấy sản phẩm trong giỏ', 404);
  return present(cart);
}

export function clearCart(userId) {
  carts.set(userId, { items: [] });
  return present(getRaw(userId));
}
