import * as reviewService from './review.service.js';
import * as authService from '../auth/auth.service.js';
import { ok, created } from '../../utils/response.js';

export async function listByProduct(req, res) {
  ok(res, await reviewService.listProductReviews(req.params.productId));
}

// Khách đã đăng nhập: kiểm tra có đủ điều kiện đánh giá không (đã mua + nhận hàng)
export async function eligibility(req, res) {
  const canReview = await reviewService.hasCompletedPurchase(req.user.id, req.params.productId);
  ok(res, { canReview });
}

export async function create(req, res) {
  // Tên hiển thị lấy từ hồ sơ người dùng đang đăng nhập
  const me = await authService.getMe(req.user.id);
  const review = await reviewService.createReview({
    productId: req.body.productId,
    userId:    req.user.id,
    userName:  me.name || me.email,
    rating:    req.body.rating,
    comment:   req.body.comment,
  });
  created(res, review, 'Cảm ơn bạn đã gửi đánh giá! Đánh giá sẽ hiển thị sau khi được duyệt.');
}

// ─── Admin ──────────────────────────────────────────────────────────────────
export async function listAll(_req, res) {
  ok(res, await reviewService.listAllReviews());
}

export async function toggleApprove(req, res) {
  const r = await reviewService.toggleApprove(req.params.id);
  ok(res, r, r.approved ? 'Đã duyệt đánh giá' : 'Đã ẩn đánh giá');
}

export async function reply(req, res) {
  const r = await reviewService.setReply(req.params.id, req.body.reply);
  ok(res, r, 'Đã lưu phản hồi');
}

export async function remove(req, res) {
  await reviewService.deleteReview(req.params.id);
  ok(res, null, 'Đã xóa đánh giá');
}
