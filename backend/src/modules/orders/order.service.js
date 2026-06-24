import { randomUUID } from 'crypto';
import { orders, products } from '../../db/store.js';
import { getCart, clearCart } from '../cart/cart.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export function createOrder(userId, { shippingAddress, phone, notes }) {
  const cart = getCart(userId);
  if (!cart.items.length) throw new AppError('Giỏ hàng đang trống', 400);

  // Kiểm tra tồn kho
  for (const it of cart.items) {
    const product = products.get(it.productId);
    if (!product) throw new AppError(`Sản phẩm #${it.productId} không tồn tại`, 400);
    if (product.stock < it.quantity) {
      throw new AppError(`Sản phẩm "${product.name}" không đủ hàng (còn ${product.stock})`, 400);
    }
  }

  // Trừ kho, tăng số đã bán
  for (const it of cart.items) {
    const product = products.get(it.productId);
    product.stock -= it.quantity;
    product.sold  += it.quantity;
  }

  const order = {
    id: randomUUID(),
    userId,
    items: cart.items.map(it => ({
      productId: it.productId,
      name:      it.name,
      img:       it.img,
      price:     it.price,
      size:      it.size,
      color:     it.color,
      quantity:  it.quantity,
      lineTotal: it.lineTotal,
    })),
    totalPrice:      cart.subtotal,
    status:          'pending',
    paymentStatus:   'unpaid',
    shippingAddress,
    phone,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.set(order.id, order);

  clearCart(userId);
  return order;
}

export function listMyOrders(userId) {
  return [...orders.values()]
    .filter(o => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getOrder(id, user) {
  const order = orders.get(id);
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
  if (user.role !== 'admin' && order.userId !== user.id) {
    throw new AppError('Bạn không có quyền xem đơn hàng này', 403);
  }
  return order;
}

export function listAllOrders({ status } = {}) {
  let items = [...orders.values()];
  if (status) items = items.filter(o => o.status === status);
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function updateOrderStatus(id, data) {
  const order = orders.get(id);
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
  const updated = { ...order, ...data, updatedAt: new Date().toISOString() };
  orders.set(id, updated);
  return updated;
}
