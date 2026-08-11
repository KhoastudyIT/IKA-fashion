// Cache trong bộ nhớ tiến trình, dùng cho dữ liệu đọc nhiều - ghi rất ít.
//
// Trường hợp cần: GET /settings bị gọi lại trên MỌI lượt tải trang của khách
// (SettingsProvider fetch một lần cho Header, Footer, trang Liên hệ), trong khi
// bảng store_settings chỉ có đúng một dòng và cả tháng mới sửa một lần.
//
// Lưu ý: cache nằm trong RAM của tiến trình, không chia sẻ giữa nhiều instance.
// Chạy nhiều backend song song thì mỗi tiến trình giữ bản sao riêng, và bản
// nào không nhận lệnh ghi sẽ còn dữ liệu cũ cho tới khi hết TTL.

class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  /** Trả về giá trị còn hạn, hoặc null nếu chưa có / đã hết hạn. */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  /** ttlMs = 0 nghĩa là không hết hạn. Mặc định 5 phút. */
  set(key, value, ttlMs = 300000) {
    this.cache.set(key, { value, expiry: ttlMs ? Date.now() + ttlMs : null });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const dbCache = new MemoryCache();
