import * as productService from './product.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export function list(req, res) {
  const result = productService.listProducts(req.query);
  res.status(200).json({ success: true, ...result });
}

export function getById(req, res) {
  ok(res, productService.getProductById(req.params.id));
}

export function getByHandle(req, res) {
  ok(res, productService.getProductByHandle(req.params.handle));
}

export function create(req, res) {
  const product = productService.createProduct(req.body);
  created(res, product, 'Sản phẩm đã được tạo');
}

export function update(req, res) {
  const product = productService.updateProduct(req.params.id, req.body);
  ok(res, product, 'Sản phẩm đã được cập nhật');
}

export function remove(req, res) {
  productService.deleteProduct(req.params.id);
  noContent(res);
}
