import * as productService from './product.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export async function list(req, res) {
  const result = await productService.listProducts(req.query);
  res.status(200).json({ success: true, ...result });
}

export async function getById(req, res) {
  ok(res, await productService.getProductById(req.params.id));
}

export async function getByHandle(req, res) {
  ok(res, await productService.getProductByHandle(req.params.handle));
}

export async function create(req, res) {
  const product = await productService.createProduct(req.body);
  created(res, product, 'Sản phẩm đã được tạo');
}

export async function update(req, res) {
  const product = await productService.updateProduct(req.params.id, req.body);
  ok(res, product, 'Sản phẩm đã được cập nhật');
}

export async function updateVariantStock(req, res) {
  const product = await productService.setVariantStock(req.params.id, req.body.variantStock);
  ok(res, product, 'Đã cập nhật tồn kho theo size và màu');
}

export async function remove(req, res) {
  await productService.deleteProduct(req.params.id);
  noContent(res);
}
