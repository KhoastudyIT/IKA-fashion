import * as orderService from './order.service.js';
import { ok, created } from '../../utils/response.js';

export function create(req, res) {
  const order = orderService.createOrder(req.user.id, req.body);
  created(res, order, 'Đặt hàng thành công');
}

export function listMine(req, res) {
  ok(res, orderService.listMyOrders(req.user.id));
}

export function getById(req, res) {
  ok(res, orderService.getOrder(req.params.id, req.user));
}

export function listAll(req, res) {
  ok(res, orderService.listAllOrders(req.query));
}

export function updateStatus(req, res) {
  const order = orderService.updateOrderStatus(req.params.id, req.body);
  ok(res, order, 'Đã cập nhật đơn hàng');
}
