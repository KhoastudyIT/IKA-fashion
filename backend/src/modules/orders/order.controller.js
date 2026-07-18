import * as orderService from './order.service.js';
import { ok, created } from '../../utils/response.js';

export async function create(req, res) {
  const order = await orderService.createOrder(req.user.id, req.body);
  created(res, order, 'Đặt hàng thành công');
}

export async function listMine(req, res) {
  ok(res, await orderService.listMyOrders(req.user.id));
}

export async function getById(req, res) {
  ok(res, await orderService.getOrder(req.params.id, req.user));
}

export async function listAll(req, res) {
  ok(res, await orderService.listAllOrders(req.query));
}

export async function updateStatus(req, res) {
  const order = await orderService.updateOrderStatus(req.params.id, req.body);
  ok(res, order, 'Đã cập nhật đơn hàng');
}
