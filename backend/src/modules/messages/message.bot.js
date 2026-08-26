/**
 * Bot tư vấn theo luật (rule-based), không gọi API AI bên ngoài: mọi con số
 * đều đọc từ DB thật. Tra không ra thì nói thẳng là chưa có thông tin và mời
 * gặp nhân viên, hơn là bịa một câu nghe hợp lý nhưng sai giá, sai tồn kho.
 */
import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';
import { activeFlashWhere, discountPercent } from '../../utils/price.js';
import { CUSTOMER_CANCELLABLE } from '../orders/order.service.js';
import { SHIPPING_METHODS } from '../orders/shipping.js';

/**
 * Teencode → chữ đủ. Khách gõ trên điện thoại rất hay viết tắt ("bn tiền v",
 * "còn ko sh"), mà bảng từ khoá bên dưới chỉ có dạng đầy đủ — không mở rộng ở
 * đây thì hơn một phần ba câu hỏi thật rơi vào nhánh "em chưa hiểu".
 *
 * Chỉ thay khi TRÙNG NGUYÊN MỘT TIẾNG. Thay theo chuỗi con sẽ phá vỡ những từ
 * chứa chúng: 'k' nằm trong 'kg', 'r' nằm trong 'rẻ'.
 */
const SLANG = {
  k: 'khong', ko: 'khong', kh: 'khong', khg: 'khong', hok: 'khong', hong: 'khong',
  kg: 'khong', kko: 'khong', kb: 'khong biet',
  bn: 'bao nhieu', bnhieu: 'bao nhieu', bnhiu: 'bao nhieu', nhiu: 'nhieu', bnh: 'bao nhieu',
  sp: 'san pham', ntn: 'nhu the nao', nt: 'nhu the nao',
  z: 'vay', vs: 'voi', dc: 'duoc', đc: 'duoc', mik: 'minh', mn: 'moi nguoi',
  ad: 'admin', add: 'admin', nv: 'nhan vien', cskh: 'cham soc khach hang',
  hnay: 'hom nay', hqua: 'hom qua', sdt: 'so dien thoai', stk: 'so tai khoan',
  ship: 'giao hang', freeship: 'mien phi giao hang', order: 'don hang',
  size: 'size', hdsd: 'huong dan su dung', bh: 'bao hanh', hd: 'hoa don',
  ce: 'chi em', ae: 'anh em', tks: 'cam on', thanks: 'cam on', ok: 'oke',
};

/**
 * Bỏ dấu để khách gõ không dấu vẫn khớp từ khoá, rồi giãn teencode.
 *
 * `kg` được dịch thành 'khong' nên mọi chỗ đọc cân nặng phải chạy TRƯỚC bước
 * này — xem `parseBodyMeasures`, nó nhận chuỗi đã bỏ dấu nhưng chưa giãn.
 */
export function stripAccents(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function expandSlang(accentless) {
  return accentless
    .split(' ')
    .map(w => SLANG[w] ?? w)
    .join(' ');
}

export function normalize(text) {
  return expandSlang(stripAccents(text));
}

const vnd = (n) => Number(n || 0).toLocaleString('vi-VN');

/** Phí ship dạng chữ: 0 đồng thì nói "miễn phí" chứ không in "0 đ". */
const feeText = (fee) => (fee > 0 ? `${vnd(fee)} đ` : 'miễn phí');

/**
 * Quét theo thứ tự và lấy cái khớp ĐẦU TIÊN, nên trật tự ở đây chính là mức độ
 * ưu tiên. Từ khoá một tiếng ('gia', 'mau', 'size') bắt rất nhiều câu nên phải
 * nằm dưới cùng: để 'price' lên trên 'shipping' thì "phí ship bao nhiêu" cũng
 * bị hiểu thành hỏi giá.
 */
const INTENTS = [
  // ── Ưu tiên tuyệt đối: phải tới tay người thật ───────────────────────────
  { key: 'handoff',      keywords: ['gap nhan vien', 'gap nguoi', 'nguoi that', 'tu van vien', 'nhan vien tu van', 'gap tu van', 'noi chuyen voi nguoi', 'chat voi nhan vien', 'can nguoi ho tro', 'admin oi', 'nhan vien oi', 'co ai khong', 'goi nhan vien'] },
  // Khách đang bực: trả lời chính sách lúc này chỉ làm họ bực thêm.
  { key: 'complaint',    keywords: ['giao sai', 'giao nham', 'giao thieu', 'hang loi', 'bi loi', 'bi rach', 'bi ban', 'bi hong', 'khong giong hinh', 'lua dao', 'lua khach', 'that vong', 'khieu nai', 'phan anh', 'te qua', 'do qua', 'chan qua', 'buc minh', 'kem chat luong', 'hang gia', 'bot ngu', 'tra loi ngu', 'khong hieu gi'] },

  { key: 'greeting',     keywords: ['xin chao', 'chao shop', 'chao ban', 'hello', 'helo', 'hi', 'hey', 'alo', 'hi shop', 'chao em', 'chao a'] },
  { key: 'thanks',       keywords: ['cam on', 'thank you', 'cam on em', 'cam on shop', 'ty', 'thankyou'] },

  // ── Việc gắn với đơn hàng cụ thể ─────────────────────────────────────────
  // 'huy don' phải đứng trước 'order', nếu không "huỷ đơn hàng" chỉ nhận được
  // bản tin tình trạng đơn thay vì hướng dẫn huỷ.
  { key: 'order_cancel', keywords: ['huy don', 'huy dat hang', 'huy hang', 'khong mua nua', 'khong lay nua', 'muon huy', 'huy giup', 'bo don'] },
  { key: 'order_change', keywords: ['doi dia chi', 'sua dia chi', 'thay dia chi', 'doi so dien thoai', 'sua so dien thoai', 'sua thong tin don', 'doi thong tin don', 'them san pham vao don', 'doi san pham trong don'] },
  { key: 'return_status',keywords: ['yeu cau tra hang', 'yeu cau doi tra', 'yeu cau doi hang', 'tra hang cua toi', 'duyet chua', 'hoan tien chua', 'da hoan tien', 'xu ly den dau', 'tra hang den dau'] },
  { key: 'returns',      keywords: ['doi tra', 'hoan tien', 'tra lai hang', 'tra hang', 'doi hang', 'chinh sach doi', 'doi size', 'doi san pham', 'tra lai', 'khong vua muon doi'] },
  { key: 'order',        keywords: ['don hang', 'don cua toi', 'tra cuu don', 'kiem tra don', 'don toi dau', 'ma don', 'khi nao nhan duoc', 'bao gio nhan duoc', 'giao toi dau', 'don moi nhat', 'don da giao chua'] },

  // ── Chính sách ───────────────────────────────────────────────────────────
  { key: 'shipping_intl',keywords: ['giao hang quoc te', 'quoc te', 'nuoc ngoai', 'gui ra nuoc ngoai', 'ship sang', 'giao hang sang'] },
  // payment trước shipping: "có ship cod không" là câu hỏi thanh toán.
  { key: 'payment',      keywords: ['thanh toan', 'chuyen khoan', 'cod', 'tra sau', 'quet the', 'momo', 'vnpay', 'tra gop', 'so tai khoan', 'tra tien'] },
  { key: 'shipping',     keywords: ['giao hang', 'van chuyen', 'phi giao hang', 'mien phi giao hang', 'mien phi van chuyen', 'giao bao lau', 'bao lau den', 'may ngay den', 'ship'] },
  { key: 'promo',        keywords: ['khuyen mai', 'giam gia', 'uu dai', 'sale', 'ma giam', 'voucher', 'coupon', 'ma giam gia', 'flash sale', 'san sale', 'deal'] },
  { key: 'care',         keywords: ['giat', 'bao quan', 'ui do', 'la ui', 'co ra mau', 'co xu long', 'co bi co', 'huong dan giat'] },
  { key: 'warranty',     keywords: ['bao hanh', 'doi neu hong', 'loi nha san xuat'] },
  { key: 'wholesale',    keywords: ['ban si', 'gia si', 'lay si', 'mua si', 'dai ly', 'so luong lon', 'ctv', 'cong tac vien', 'nhap hang'] },
  { key: 'invoice',      keywords: ['hoa don do', 'hoa don vat', 'xuat hoa don', 'hoa don dien tu', 'hoa don cong ty'] },
  // store_hours trước contact: "shop mở cửa mấy giờ" có cả 'cua hang' lẫn giờ.
  { key: 'store_hours',  keywords: ['may gio', 'gio mo cua', 'gio lam viec', 'mo cua luc nao', 'dong cua luc nao', 'lam viec thu may', 'chu nhat co lam'] },
  { key: 'contact',      keywords: ['hotline', 'so dien thoai', 'lien he', 'email', 'cua hang', 'dia chi', 'o dau', 'chi nhanh', 'showroom'] },
  { key: 'how_to_order', keywords: ['dat hang nhu the nao', 'cach dat hang', 'mua nhu the nao', 'cach mua', 'dat hang sao', 'huong dan mua', 'gio hang'] },
  { key: 'account',      keywords: ['quen mat khau', 'dang nhap khong duoc', 'khong dang nhap duoc', 'tao tai khoan', 'dang ky tai khoan', 'doi mat khau'] },

  // ── Khám phá sản phẩm ────────────────────────────────────────────────────
  { key: 'new_arrival',  keywords: ['hang moi', 'moi ve', 'mau moi', 'bo suu tap moi', 'co gi moi', 'san pham moi', 'moi nhat'] },
  { key: 'size_advice',  keywords: ['tu van size', 'mac size nao', 'chon size', 'size nao vua', 'size nao phu hop', 'nen lay size', 'bang size', 'huong dan size', 'size gi thi vua'] },
  // Cụm gợi ý rõ nghĩa phải chặn trước 'color', nếu không "tư vấn mẫu nào đẹp"
  // dính từ khoá 'mau nao' và thành câu hỏi màu sắc.
  { key: 'suggest',      keywords: ['goi y', 'nen mua', 'recommend', 'mau nao dep', 'ban chay', 'hot nhat', 'co gi', 'co ban', 'shop co'] },

  // ── Thuộc tính sản phẩm ──────────────────────────────────────────────────
  { key: 'size',         keywords: ['con size', 'size nao', 'co size', 'nhung size', 'size gi', 'du size', 'size'] },
  { key: 'material',     keywords: ['chat lieu', 'chat vai', 'lam bang gi', 'vai gi', 'cotton', 'co day khong', 'co nong khong', 'nong khong', 'co mat khong', 'chat luong vai', 'nguyen lieu', 'vai the nao'] },
  { key: 'color',        keywords: ['mau sac', 'mau gi', 'co mau', 'mau nao', 'nhung mau', 'mau'] },
  { key: 'stock',        keywords: ['con hang', 'con khong', 'con hay het', 'het hang', 'ton kho', 'san co', 'con bao nhieu cai', 'co san', 'con khong shop', 'het chua'] },
  { key: 'price',        keywords: ['gia bao nhieu', 'bao nhieu tien', 'gia the nao', 'gia sao', 'gia', 'bao nhieu', 'mac khong', 're khong', 'nhieu tien'] },

  // ── Chung chung nhất, chỉ khớp khi không còn gì khác ─────────────────────
  { key: 'ack',          keywords: ['oke', 'okie', 'okey', 'vang', 'da vang', 'uh', 'um', 'duoc roi', 'hieu roi', 'biet roi', 'de xem', 'de minh xem'] },
  { key: 'suggest',      keywords: ['tu van', 'phu hop'] },
];

/**
 * Trả về key ý định đầu tiên khớp, hoặc '' nếu không nhận ra.
 *
 * So khớp theo TỪ chứ không theo chuỗi con, và bỏ dấu câu trước khi so. Nếu
 * so chuỗi con thì "chính sách giao hàng" sẽ dính từ khoá 'gia' nằm trong
 * "giao" và bị hiểu nhầm thành câu hỏi giá.
 */
export function detectIntent(normalizedText) {
  const haystack = ` ${normalizedText.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  for (const { key, keywords } of INTENTS) {
    if (keywords.some(kw => haystack.includes(` ${kw} `))) return key;
  }
  return '';
}

/** Ý định chỉ trả lời được khi biết đang hỏi sản phẩm nào. */
const PRODUCT_INTENTS = new Set(['price', 'stock', 'size', 'color', 'material']);

/**
 * Từ dừng: loại khỏi câu hỏi trước khi đem đi tìm sản phẩm, nếu không thì
 * "cái áo này giá bao nhiêu" sẽ đi tìm sản phẩm tên "cái" hoặc "này".
 */
const STOP_WORDS = new Set([
  'cho', 'toi', 'minh', 'ban', 'shop', 'em', 'anh', 'chi', 'a', 'the', 'la', 'co', 'khong',
  'gia', 'bao', 'nhieu', 'tien', 'nay', 'kia', 'do', 'nhu', 'nao', 'gi', 'va', 'voi', 'cai',
  'chiec', 'bo', 'muon', 'can', 'hoi', 'xin', 'duoc', 'o', 'tai', 've', 'con', 'hang', 'san',
  'pham', 'mua', 'xem', 'tu', 'van', 'giup', 'ap', 'thi', 'ma', 'de', 'khi', 'sao', 'size',
  'mac', 'lay', 'con', 'hon', 'nua', 'them', 'chat', 'luong', 'mau', 'vay', 'oke', 'duoi',
  'tren', 'khoang', 'tam', 'den', 'moi', 'nguoi', 'admin', 'dep', 're',
]);

function keywordTokens(normalizedText) {
  return normalizedText
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(' ')
    .filter(t => t.length >= 2 && !STOP_WORDS.has(t));
}

/**
 * Rút khoảng giá khách nêu: "dưới 300k", "từ 200k đến 500k", "khoảng 1 triệu".
 * Trả null khi câu không nhắc tới ngân sách nào.
 */
export function parsePriceRange(normalizedText) {
  const UNIT = { k: 1000, nghin: 1000, ngan: 1000, tr: 1000000, trieu: 1000000, m: 1000000 };
  const toVnd = (num, unit) => {
    const n = Number(num);
    if (unit) return n * UNIT[unit];
    // Số trần: "300" trong ngữ cảnh giá là 300 nghìn, còn "300000" là chính nó.
    return n < 1000 ? n * 1000 : n;
  };
  const NUM = '(\\d+(?:[.,]\\d+)?)\\s*(k|nghin|ngan|tr|trieu|m)?';

  const between = normalizedText.match(new RegExp(`tu\\s*${NUM}\\s*(?:den|toi|-)\\s*${NUM}`));
  if (between) {
    return { min: toVnd(between[1], between[2]), max: toVnd(between[3], between[4]) };
  }
  const under = normalizedText.match(new RegExp(`(?:duoi|it hon|khong qua|toi da|be hon)\\s*${NUM}`));
  if (under) return { min: 0, max: toVnd(under[1], under[2]) };

  const over = normalizedText.match(new RegExp(`(?:tren|hon|toi thieu|tu)\\s*${NUM}\\s*(?:tro len)?`));
  if (over && /tro len|tren|toi thieu/.test(normalizedText)) {
    return { min: toVnd(over[1], over[2]), max: Number.MAX_SAFE_INTEGER };
  }
  const around = normalizedText.match(new RegExp(`(?:khoang|tam|co)\\s*${NUM}`));
  if (around && around[2]) {
    const mid = toVnd(around[1], around[2]);
    return { min: Math.round(mid * 0.75), max: Math.round(mid * 1.25) };
  }
  return null;
}

// ── Truy vấn sản phẩm ────────────────────────────────────────────────────────

/**
 * Giá bot báo phải đúng bằng giá khách thấy trên web: flash sale đang chạy đè
 * lên giá niêm yết. Trước đây bot đọc thẳng `products.price` nên trong đợt
 * flash sale nó báo cao hơn giá thật.
 */
const FLASH_JOIN = `
  LEFT JOIN LATERAL (
    SELECT fs.price, fs.stock - fs.sold AS remaining, fs.ends_at
    FROM flash_sales fs
    WHERE fs.product_id = p.id AND ${activeFlashWhere('fs')}
    ORDER BY fs.price ASC
    LIMIT 1
  ) active_flash ON TRUE`;

const PRODUCT_COLS = `
  p.id, p.name, p.handle, p.collection, p.type, p.price, p.original_price, p.discount,
  p.img, p.colors, p.sizes, p.features, p.rating::float AS rating, p.sold, p.stock,
  p.description, p.created_at,
  active_flash.price     AS flash_price,
  active_flash.remaining AS flash_remaining,
  active_flash.ends_at   AS flash_ends_at,
  COALESCE(active_flash.price, p.price) AS effective_price
`;

const PRODUCT_FROM = `FROM products p ${FLASH_JOIN}`;

function toCard(p) {
  return {
    id: p.id,
    name: p.name,
    handle: p.handle,
    price: Number(p.effective_price ?? p.price),
    img: p.img,
  };
}

async function findProductById(id) {
  const res = await db.query(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE p.id = $1`, [id]);
  return res.rows[0] ?? null;
}

/**
 * Catalog dùng cho việc so khớp tên. Mỗi tin nhắn quét lại toàn bảng, mà khách
 * gõ liên tục — cache ngắn để một đợt chat không thành một đợt full scan.
 */
const CATALOG_KEY = 'bot:catalog';
const CATALOG_TTL = 60000;

async function catalog() {
  const cached = dbCache.get(CATALOG_KEY);
  if (cached) return cached;
  const res = await db.query(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM}`);
  dbCache.set(CATALOG_KEY, res.rows, CATALOG_TTL);
  return res.rows;
}

/**
 * Chấm điểm trong Node chứ không so khớp bằng SQL: bỏ dấu tiếng Việt trong
 * Postgres cần extension `unaccent`, mà extension đó phải cài bằng quyền
 * superuser. Catalog chỉ vài chục dòng nên lọc trong Node là đủ.
 */
async function searchProducts(normalizedText, limit = 4) {
  const tokens = keywordTokens(normalizedText);
  if (tokens.length === 0) return [];

  const rows = await catalog();

  const scored = rows.map((p) => {
    const haystack = stripAccents(`${p.name} ${p.type} ${p.collection}`);
    // Mỗi token khớp được 1 điểm.
    let score = tokens.reduce((sum, t) => sum + (haystack.includes(t) ? 1 : 0), 0);
    // Gõ trọn tên một mẫu thì mẫu đó thắng tuyệt đối: không có vế này,
    // "Áo Polo Đen" hoà điểm với "Áo Polo Đen Premium" và bot phải hỏi lại.
    if (normalizedText.includes(stripAccents(p.name))) score += 100;
    return { ...p, score };
  });

  return scored
    .filter(p => p.score > 0)
    .sort((a, b) =>
      b.score - a.score ||
      // Cùng điểm thì tên NGẮN hơn là khớp sát hơn.
      a.name.length - b.name.length ||
      b.sold - a.sold,
    )
    .slice(0, limit);
}

/** Lọc theo ngân sách khách nêu, ưu tiên mẫu bán chạy trong tầm giá đó. */
async function productsInRange({ min, max }, normalizedText, limit = 4) {
  const rows = await catalog();
  const tokens = keywordTokens(normalizedText);
  const inRange = rows.filter((p) => {
    const price = Number(p.effective_price);
    return price >= min && price <= max;
  });
  // Có nêu kiểu đồ ("áo sơ mi dưới 300k") thì ưu tiên mẫu khớp mô tả.
  const matched = tokens.length
    ? inRange.filter(p => tokens.some(t => stripAccents(`${p.name} ${p.type}`).includes(t)))
    : [];
  const pool = matched.length ? matched : inRange;
  return [...pool].sort((a, b) => b.sold - a.sold).slice(0, limit);
}

async function topProducts(limit = 4) {
  const res = await db.query(
    `SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} ORDER BY p.sold DESC, p.rating DESC LIMIT $1`,
    [limit],
  );
  return res.rows;
}

async function newestProducts(limit = 4) {
  const res = await db.query(
    `SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} ORDER BY p.created_at DESC, p.id DESC LIMIT $1`,
    [limit],
  );
  return res.rows;
}

/** Mẫu đang giảm giá thật (flash sale đang chạy hoặc discount > 0). */
async function saleProducts(limit = 4) {
  const res = await db.query(
    `SELECT ${PRODUCT_COLS} ${PRODUCT_FROM}
     WHERE active_flash.price IS NOT NULL OR p.discount > 0
     ORDER BY (p.price - COALESCE(active_flash.price, p.price)) DESC, p.discount DESC
     LIMIT $1`,
    [limit],
  );
  return res.rows;
}

/** Các suất flash sale đang chạy, kèm thời điểm kết thúc. */
async function runningFlashSales(limit = 4) {
  const res = await db.query(
    `SELECT ${PRODUCT_COLS} ${PRODUCT_FROM}
     WHERE active_flash.price IS NOT NULL
     ORDER BY active_flash.ends_at ASC NULLS LAST
     LIMIT $1`,
    [limit],
  );
  return res.rows;
}

async function activeCoupons(limit = 4) {
  const res = await db.query(
    `SELECT code, type, value, min_order, expiry_date
     FROM coupons
     WHERE active AND expiry_date >= CURRENT_DATE AND used < quantity
     ORDER BY expiry_date ASC LIMIT $1`,
    [limit],
  );
  return res.rows;
}

/** Đơn gần nhất của chính khách đang chat — dùng cho câu "đơn của tôi tới đâu rồi". */
async function latestOrder(userId) {
  const res = await db.query(
    `SELECT id, status, payment_status, total_price, discount, created_at
     FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  return res.rows[0] ?? null;
}

/** Yêu cầu đổi/trả gần nhất của khách, để trả lời "đơn trả hàng của tôi sao rồi". */
async function latestReturn(userId) {
  const res = await db.query(
    `SELECT r.id, r.type, r.status, r.admin_note, r.created_at, r.order_id
     FROM order_returns r
     JOIN orders o ON o.id = r.order_id
     WHERE o.user_id = $1
     ORDER BY r.created_at DESC LIMIT 1`,
    [userId],
  );
  return res.rows[0] ?? null;
}

/** Thông tin cửa hàng do admin cấu hình — không hardcode hotline trong bot. */
async function storeInfo() {
  const res = await db.query(
    `SELECT store_name, hotline, email, address, working_hours
     FROM store_settings WHERE id = 1`,
  );
  return res.rows[0] ?? null;
}

// ── Dựng câu trả lời từ dữ liệu sản phẩm ─────────────────────────────────────

/** Cột JSONB có thể trả về mảng (pg tự parse) hoặc chuỗi JSON tuỳ driver. */
function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function hoursLeft(endsAt) {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  return h >= 24 ? `${Math.floor(h / 24)} ngày` : `${Math.max(1, h)} giờ`;
}

/**
 * Giá phải là giá khách thật sự trả. Ba trường hợp: đang flash sale, đang giảm
 * theo `discount`, và giá thường.
 */
function priceLine(p) {
  const list = Number(p.price);
  const eff = Number(p.effective_price ?? p.price);

  if (p.flash_price != null && Number(p.flash_price) < list) {
    const left = hoursLeft(p.flash_ends_at);
    const lines = [
      `Giá **Flash Sale: ${vnd(eff)} đ** — rẻ hơn giá niêm yết ${vnd(list)} đ ` +
      `(giảm ${discountPercent(list, eff)}%).`,
    ];
    const remaining = Number(p.flash_remaining);
    if (remaining > 0) {
      lines.push(
        `Chương trình còn **${remaining} suất**${left ? `, kết thúc sau khoảng ${left}` : ''} ạ.`,
      );
    }
    return lines.join('\n');
  }

  if (Number(p.discount) > 0 && Number(p.original_price) > eff) {
    return `Giá: **${vnd(eff)} đ** — đang giảm **${p.discount}%** so với giá gốc ${vnd(p.original_price)} đ.`;
  }
  return `Giá: **${vnd(eff)} đ**.`;
}

function stockLine(p) {
  const stock = Number(p.stock);
  if (stock <= 0) return 'Hiện **đang hết hàng**. Anh/chị để lại số điện thoại, IKA sẽ báo ngay khi có hàng về ạ.';
  if (stock <= 5) return `Còn **${stock} sản phẩm** cuối cùng — số lượng có hạn ạ.`;
  return `**Còn hàng**, kho hiện có ${stock} sản phẩm, đặt là giao được ngay ạ.`;
}

/**
 * Trả lời một trường thông số. Trả về null khi DB chưa có dữ liệu — người gọi
 * sẽ chuyển sang câu "chưa có thông tin, để nhân viên hỗ trợ".
 */
function specLine(p, intent) {
  if (intent === 'size') {
    const sizes = toArray(p.sizes);
    if (sizes.length === 0) return null;
    // Tồn kho lưu theo sản phẩm chứ không theo từng size, nên bot chỉ được nói
    // "mẫu này có size X", tuyệt đối không hứa "size X còn hàng".
    return `Sản phẩm có các size: **${sizes.join(', ')}**.\n` +
      'Anh/chị cho em xin **chiều cao và cân nặng**, em tư vấn size vừa nhất ạ.';
  }
  if (intent === 'color') {
    const colors = toArray(p.colors);
    if (colors.length === 0) return null;
    return `Sản phẩm có các màu: **${colors.join(', ')}**.`;
  }
  if (intent === 'material') {
    const features = toArray(p.features);
    const parts = [];
    if (features.length) parts.push(`Đặc điểm: **${features.join(', ')}**.`);
    if (p.description) parts.push(p.description);
    return parts.length ? parts.join('\n') : null;
  }
  return null;
}

function productSummary(p) {
  const sizes = toArray(p.sizes);
  const colors = toArray(p.colors);
  const lines = [`**${p.name}**`, priceLine(p), stockLine(p)];
  const specs = [
    sizes.length && `size ${sizes.join('/')}`,
    colors.length && `màu ${colors.join(', ')}`,
    p.rating && `đánh giá ${Number(p.rating).toFixed(1)}/5`,
  ].filter(Boolean);
  if (specs.length) lines.push(`Thông số: ${specs.join(' • ')}.`);
  return lines.join('\n');
}

// ── Tư vấn size theo số đo ───────────────────────────────────────────────────

// Bám đúng bảng size đang hiển thị ở trang /huong-dan-size để bot và website
// không nói hai kiểu khác nhau.
const TOP_SIZE_BY_WEIGHT = [
  { max: 50, size: 'S' }, { max: 60, size: 'M' }, { max: 70, size: 'L' },
  { max: 80, size: 'XL' }, { max: Infinity, size: 'XXL' },
];
const BOTTOM_SIZE_BY_WEIGHT = [
  { max: 55, size: '29' }, { max: 60, size: '30' }, { max: 65, size: '31' },
  { max: 70, size: '32' }, { max: Infinity, size: '33' },
];

/**
 * Rút cân nặng và chiều cao: "1m70", "170cm", "65kg", "cao 170 nặng 65".
 * Số phải đi kèm đơn vị hoặc từ khoá — bắt số trần sẽ hiểu nhầm giá tiền
 * thành số đo cơ thể.
 *
 * Nhận chuỗi ĐÃ bỏ dấu nhưng CHƯA giãn teencode: bảng teencode đổi 'kg' thành
 * 'khong', chạy sau thì "65kg" không còn đơn vị để nhận ra.
 */
export function parseBodyMeasures(accentlessText) {
  const kg = accentlessText.match(/(\d{2,3})\s*(kgs?|kg|ky|ki|kilo|can)\b/)
    ?? accentlessText.match(/nang\s*(\d{2,3})/);
  const weight = kg ? Number(kg[1]) : null;

  let height = null;
  const mFormat = accentlessText.match(/(\d)\s*m\s*(\d{1,2})\b/);   // 1m70
  if (mFormat) height = Number(mFormat[1]) * 100 + Number(mFormat[2].padEnd(2, '0'));
  if (!height) {
    const cm = accentlessText.match(/(\d{3})\s*cm\b/) ?? accentlessText.match(/cao\s*(\d{3})\b/);
    if (cm) height = Number(cm[1]);
  }

  return {
    weight: weight && weight >= 35 && weight <= 150 ? weight : null,
    height: height && height >= 130 && height <= 220 ? height : null,
  };
}

function pickSize(table, weight) {
  return table.find(r => weight <= r.max).size;
}

/** Sản phẩm là quần thì tư vấn theo bảng size quần, còn lại theo bảng size áo. */
function isBottom(product) {
  return product ? stripAccents(`${product.collection} ${product.type}`).includes('quan') : false;
}

// ── Câu trả lời chính sách (bám theo nội dung các trang chính sách của web) ───

const POLICY_ANSWERS = {
  // Bảng phí sinh thẳng từ SHIPPING_METHODS — đúng cái bảng server dùng để tính
  // tiền. Viết tay lần nữa ở đây thì sớm muộn hai nơi cũng lệch, mà bot báo sai
  // giá là khách có bằng chứng shop hứa sai.
  //
  // ĐÃ BỎ câu "đơn từ 500.000 đ được miễn phí giao hàng": không có luật nào như
  // vậy ở bất kỳ đâu trong mã nguồn.
  shipping: 'IKA Fashion có 3 hình thức giao hàng, anh/chị chọn ngay ở bước thanh toán ạ:\n'
    + `• **Giao hàng tiêu chuẩn — ${feeText(SHIPPING_METHODS.standard.fee)}**, nhận sau 3–5 ngày làm việc\n`
    + `• **Giao hàng nhanh — ${feeText(SHIPPING_METHODS.fast.fee)}**, nhận sau 1–2 ngày làm việc\n`
    + `• **Giao hoả tốc — ${feeText(SHIPPING_METHODS.express.fee)}**, nhận trong ngày `
    + `(chỉ áp dụng cho địa chỉ tại ${SHIPPING_METHODS.express.cityOnly})\n`
    + 'Phí này được cộng vào tổng đơn ở bước cuối. Chi tiết ở trang *Chính sách giao hàng* ạ.',

  // Chỉ COD. Trước đây bot liệt kê thêm chuyển khoản, MoMo, VNPay và thẻ —
  // không hình thức nào có luồng xử lý thật.
  payment: 'Hiện shop **chỉ nhận thanh toán khi nhận hàng (COD)** ạ: anh/chị nhận hàng từ '
    + 'shipper rồi trả tiền mặt, không phải chuyển khoản hay đặt cọc trước.\n'
    + 'Shop chưa hỗ trợ ví điện tử và thẻ ngân hàng. Nếu anh/chị cần hình thức khác, '
    + 'gõ **"gặp nhân viên"** để em nhờ shop hỗ trợ thêm ạ.',
  returns: 'Chính sách đổi trả của IKA Fashion:\n• **Đổi/trả trong 7 ngày** kể từ ngày nhận hàng, sản phẩm còn nguyên tem mác, chưa qua sử dụng và chưa giặt\n• **Đổi size miễn phí** nếu size không vừa (áp dụng khi còn hàng)\n• QC kiểm tra trong **1–2 ngày làm việc**, hoàn tiền hoặc đổi mẫu mới trong **3–5 ngày làm việc**\nAnh/chị gửi yêu cầu ngay tại *Đơn hàng của tôi → Yêu cầu đổi/trả*. Cần em kiểm tra đơn nào ạ?',
  care: 'Hướng dẫn bảo quản để áo quần bền màu ạ:\n• Giặt máy ở **nước lạnh dưới 30°C**, lộn trái sản phẩm trước khi giặt\n• **Không dùng thuốc tẩy**, không ngâm quá 30 phút\n• Phơi nơi thoáng mát, tránh nắng gắt trực tiếp\n• Ủi ở nhiệt độ thấp–trung bình, tránh ủi trực tiếp lên hình in\nSản phẩm của IKA dùng vải không phai màu nên chỉ cần giặt đúng cách là dùng được rất lâu ạ.',
  warranty: 'Sản phẩm thời trang của IKA không có chế độ bảo hành như đồ điện tử, nhưng nếu hàng **lỗi từ nhà sản xuất** (đường may bung, vải lỗi, sai mô tả) thì shop **đổi mới hoặc hoàn tiền 100%** trong **7 ngày** kể từ ngày nhận hàng, shop chịu phí vận chuyển hai chiều ạ.\nAnh/chị chụp giúp em ảnh lỗi và gửi yêu cầu tại *Đơn hàng của tôi → Yêu cầu đổi/trả* nhé.',
  how_to_order: 'Cách đặt hàng tại IKA Fashion ạ:\n1. Chọn sản phẩm → chọn **màu và size** → bấm **Thêm vào giỏ**\n2. Mở **Giỏ hàng** → kiểm tra số lượng → bấm **Thanh toán**\n3. Điền **họ tên, số điện thoại, địa chỉ**, chọn hình thức giao hàng và thanh toán\n4. Nhập **mã giảm giá** (nếu có) rồi bấm **Đặt hàng**\nSau khi đặt, anh/chị theo dõi đơn tại *Đơn hàng của tôi* ạ.',
  // ĐÃ BỎ hướng dẫn "Quên mật khẩu → đặt lại qua email": hệ thống không có
  // luồng đó. auth chỉ có PUT /password, tức đổi mật khẩu KHI ĐÃ đăng nhập.
  account: 'Về tài khoản ạ:\n'
    + '• **Chưa có tài khoản**: bấm **Đăng ký**, chỉ cần email và mật khẩu\n'
    + '• **Đổi mật khẩu / thông tin cá nhân**: đăng nhập rồi vào *Tài khoản của tôi → Hồ sơ*\n'
    + '• **Quên mật khẩu**: website chưa có chức năng tự đặt lại, anh/chị gõ '
    + '**"gặp nhân viên"** để shop hỗ trợ đặt lại giúp ạ.',
  shipping_intl: 'Hiện IKA Fashion **chỉ giao hàng trong lãnh thổ Việt Nam**, chưa hỗ trợ giao quốc tế ạ.\nNếu anh/chị có địa chỉ nhận trong nước (người thân, văn phòng chuyển tiếp) thì shop vẫn giao bình thường. Cần trao đổi thêm, anh/chị gõ **"gặp nhân viên"** nhé.',
};

const ORDER_STATUS_TEXT = {
  pending:   'đang **chờ xác nhận**, shop sẽ xác nhận trong vài giờ tới',
  confirmed: 'đã được **xác nhận**, đang chuẩn bị hàng để bàn giao đơn vị vận chuyển',
  shipped:   'đang **trên đường giao**, anh/chị chú ý điện thoại giúp em nhé',
  completed: 'đã **giao thành công**',
  cancelled: 'đã **bị huỷ**',
  returned:  'đã được **trả hàng / hoàn tiền**',
};

const RETURN_STATUS_TEXT = {
  pending:   'đang **chờ shop duyệt**, thường trong 1–2 ngày làm việc ạ',
  approved:  'đã được **duyệt**, anh/chị gửi hàng về theo hướng dẫn để shop xử lý tiếp ạ',
  rejected:  'rất tiếc đã **bị từ chối**',
  completed: 'đã **xử lý xong** — shop đã đổi hàng hoặc hoàn tiền ạ',
  cancelled: 'đã được **rút lại** ạ',
};

const RETURN_TYPE_TEXT = { return: 'trả hàng / hoàn tiền', exchange: 'đổi sản phẩm' };

const QUICK_HELP =
  'Em có thể giúp anh/chị tra cứu **giá, tồn kho, size, màu sắc, chất liệu** của từng sản phẩm, ' +
  'tư vấn **chọn size theo chiều cao – cân nặng**, gợi ý mẫu **theo ngân sách**, kiểm tra **đơn hàng ' +
  'và yêu cầu đổi trả**, cùng các chính sách **giao hàng, thanh toán, đổi trả, khuyến mãi**.\n' +
  'Anh/chị cứ nhắn tên sản phẩm kèm điều muốn biết, ví dụ *"áo polo đen còn size L không"* hoặc ' +
  '*"gợi ý áo sơ mi dưới 300k"*. Cần nhân viên hỗ trợ thì gõ **"gặp nhân viên"** ạ.';

export const WELCOME_MESSAGE =
  'Chào anh/chị, em là trợ lý tư vấn của **IKA Fashion**.\n' +
  'Em tra giúp anh/chị **giá, tồn kho, size, màu sắc, chất liệu** của từng sản phẩm, ' +
  'tư vấn **chọn size**, kiểm tra **đơn hàng** và các chính sách **giao hàng, thanh toán, đổi trả**.\n' +
  'Anh/chị cần hỗ trợ gì ạ? Muốn gặp nhân viên tư vấn thì gõ **"gặp nhân viên"** nhé.';

const HANDOFF_MESSAGE =
  'Em đã chuyển hội thoại này cho nhân viên tư vấn của IKA Fashion. Anh/chị vui lòng đợi trong ' +
  'giây lát, sẽ có người phản hồi ngay tại đây ạ.\nTrong lúc chờ, anh/chị có thể để lại nội dung ' +
  'cần hỗ trợ để nhân viên nắm trước.';

/**
 * Sinh câu trả lời của bot.
 *
 * @param {object} params
 * @param {string} params.text            Nội dung khách vừa gửi
 * @param {string} params.userId          Khách đang chat (để tra đơn hàng của chính họ)
 * @param {number|null} params.productId  Sản phẩm khách gửi kèm (từ trang chi tiết)
 * @param {number|null} params.lastProductId Sản phẩm nhắc gần nhất trong hội thoại
 * @param {number} params.unknownStreak   Số lần liên tiếp bot vừa trả lời "chưa hiểu"
 * @returns {Promise<{message: string, intent: string, productId: number|null,
 *                    suggestions: object[], handoff: boolean}>}
 */
export async function generateReply({
  text, userId = null, productId = null, lastProductId = null, unknownStreak = 0,
}) {
  const accentless = stripAccents(text);
  const normalized = expandSlang(accentless);
  let intent = detectIntent(normalized);

  // Gõ thẳng số đo là đang xin tư vấn size, dù câu đó không chứa từ khoá nào.
  const measures = parseBodyMeasures(accentless);
  if (measures.weight && (intent === '' || intent === 'size')) intent = 'size_advice';

  const reply = (message, extra = {}) => ({
    message,
    intent: intent || 'unknown',
    productId: extra.productId ?? null,
    suggestions: extra.suggestions ?? [],
    handoff: extra.handoff ?? false,
  });

  // ── Chuyển cho nhân viên: xử lý trước mọi ý định khác ─────────────────────
  if (intent === 'handoff') {
    return reply(HANDOFF_MESSAGE, { handoff: true, productId: productId ?? lastProductId ?? null });
  }

  // Khiếu nại: xin lỗi rồi chuyển người thật ngay. Bot đọc chính sách cho một
  // khách đang bực chỉ làm tình hình xấu đi.
  if (intent === 'complaint') {
    return reply(
      'Em rất xin lỗi vì trải nghiệm chưa tốt này ạ. Em chuyển ngay cho nhân viên phụ trách để ' +
      'kiểm tra và xử lý cho anh/chị.\nAnh/chị gửi giúp em **mã đơn hàng** và **ảnh chụp sản phẩm** ' +
      '(nếu có) để bộ phận CSKH xử lý nhanh nhất ạ.',
      { handoff: true, productId: productId ?? lastProductId ?? null },
    );
  }

  // Bán sỉ / xuất hoá đơn đỏ: vượt thẩm quyền dữ liệu của bot, chuyển thẳng.
  if (intent === 'wholesale') {
    return reply(
      'Dạ, IKA Fashion **có chính sách giá sỉ và cộng tác viên** ạ. Mức chiết khấu tuỳ số lượng ' +
      'và mặt hàng nên em chuyển anh/chị sang bộ phận kinh doanh để báo giá chính xác.\n' +
      'Anh/chị để lại **số điện thoại, mặt hàng và số lượng dự kiến** giúp em nhé.',
      { handoff: true },
    );
  }
  if (intent === 'invoice') {
    return reply(
      'Dạ, shop **có xuất hoá đơn VAT** cho đơn hàng ạ. Anh/chị gửi giúp em **mã đơn hàng, tên công ty, ' +
      'mã số thuế và địa chỉ xuất hoá đơn**, em chuyển bộ phận kế toán xuất và gửi qua email ạ.',
      { handoff: true },
    );
  }

  if (intent === 'greeting') {
    return reply(`Chào anh/chị, IKA Fashion rất vui được hỗ trợ ạ.\n${QUICK_HELP}`);
  }

  if (intent === 'thanks') {
    return reply('Dạ, rất vui được hỗ trợ anh/chị. Cần thêm thông tin gì về sản phẩm hay đơn hàng, anh/chị cứ nhắn em bất cứ lúc nào ạ.');
  }

  // "ok", "vâng", "hiểu rồi" — đáp gọn, đừng dội lại cả bảng hướng dẫn.
  if (intent === 'ack') {
    return reply('Dạ vâng ạ. Anh/chị cần em hỗ trợ thêm gì nữa không ạ?');
  }

  if (POLICY_ANSWERS[intent]) {
    return reply(POLICY_ANSWERS[intent]);
  }

  // ── Thông tin cửa hàng: đọc từ cấu hình admin, không hardcode ─────────────
  if (intent === 'contact' || intent === 'store_hours') {
    const s = await storeInfo();
    const lines = [];
    if (intent === 'store_hours') {
      lines.push(s?.working_hours
        ? `Giờ làm việc của ${s.store_name || 'IKA Fashion'}: **${s.working_hours}** ạ.`
        : 'Anh/chị xem giờ làm việc tại trang *Liên hệ* của website ạ.');
      lines.push('Ngoài giờ này anh/chị vẫn đặt hàng online 24/7, shop xử lý đơn vào ca làm việc kế tiếp ạ.');
    } else {
      lines.push(`Thông tin liên hệ ${s?.store_name || 'IKA Fashion'} ạ:`);
      if (s?.hotline) lines.push(`• Hotline: **${s.hotline}**`);
      if (s?.email) lines.push(`• Email: **${s.email}**`);
      if (s?.address) lines.push(`• Địa chỉ: ${s.address}`);
      if (s?.working_hours) lines.push(`• Giờ làm việc: ${s.working_hours}`);
      if (lines.length === 1) lines.push('Anh/chị xem tại trang *Liên hệ* của website ạ.');
    }
    lines.push('Cần trao đổi ngay thì anh/chị gõ **"gặp nhân viên"**, em chuyển hội thoại cho bộ phận chăm sóc khách hàng liền ạ.');
    return reply(lines.join('\n'));
  }

  // ── Đơn hàng của chính khách ──────────────────────────────────────────────
  const NO_ORDER =
    'Em chưa thấy đơn hàng nào trong tài khoản của anh/chị ạ. Nếu anh/chị vừa đặt bằng tài khoản ' +
    'khác hoặc đặt qua điện thoại, gõ **"gặp nhân viên"** để em nhờ bộ phận CSKH tra giúp nhé.';

  if (intent === 'order') {
    const order = userId ? await latestOrder(userId) : null;
    if (!order) return reply(NO_ORDER);

    const code = String(order.id).slice(0, 8).toUpperCase();
    const status = ORDER_STATUS_TEXT[order.status] ?? `đang ở trạng thái **${order.status}**`;
    const paid = order.payment_status === 'paid'
      ? 'đã thanh toán'
      : order.payment_status === 'refunded' ? 'đã hoàn tiền' : 'chưa thanh toán';
    const placed = new Date(order.created_at).toLocaleDateString('vi-VN');
    return reply(
      `Đơn gần nhất của anh/chị (**#${code}**, đặt ngày ${placed}) ${status}.\n` +
      `Tổng tiền: **${vnd(order.total_price)} đ** (${paid}).\n` +
      'Anh/chị xem chi tiết ở mục *Đơn hàng của tôi* trong trang tài khoản ạ.',
    );
  }

  // Huỷ đơn: nói rõ đơn NÀY có huỷ được không, theo đúng luật của order service.
  if (intent === 'order_cancel') {
    const order = userId ? await latestOrder(userId) : null;
    if (!order) return reply(NO_ORDER);

    const code = String(order.id).slice(0, 8).toUpperCase();
    if (CUSTOMER_CANCELLABLE.includes(order.status)) {
      return reply(
        `Đơn **#${code}** đang ở trạng thái *${order.status === 'pending' ? 'chờ xác nhận' : 'đã xác nhận'}* nên anh/chị **tự huỷ được** ạ.\n` +
        'Cách huỷ: vào *Đơn hàng của tôi* → mở đơn cần huỷ → bấm **Huỷ đơn** và chọn lý do.\n' +
        'Đơn đã thanh toán trước sẽ được hoàn tiền trong 3–5 ngày làm việc ạ.',
      );
    }
    if (order.status === 'cancelled') {
      return reply(`Đơn **#${code}** đã được huỷ trước đó rồi ạ. Anh/chị cần em hỗ trợ đặt lại đơn mới không ạ?`);
    }
    return reply(
      `Đơn **#${code}** hiện đã ở trạng thái *${order.status}* nên hệ thống không cho tự huỷ nữa ạ.\n` +
      (order.status === 'completed' || order.status === 'shipped'
        ? 'Nếu hàng chưa vừa ý, anh/chị dùng chức năng **Yêu cầu đổi/trả** trong 7 ngày kể từ ngày nhận nhé.\n'
        : '') +
      'Em chuyển anh/chị sang nhân viên để kiểm tra xem còn kịp can thiệp không ạ.',
      { handoff: true },
    );
  }

  if (intent === 'order_change') {
    const order = userId ? await latestOrder(userId) : null;
    const code = order ? ` (**#${String(order.id).slice(0, 8).toUpperCase()}**)` : '';
    return reply(
      `Thông tin giao hàng của đơn đã đặt${code} không sửa trực tiếp trên website được ạ.\n` +
      'Em chuyển anh/chị sang nhân viên để cập nhật giúp. Anh/chị nhắn giúp em **thông tin mới** ' +
      '(địa chỉ hoặc số điện thoại) ngay tại đây nhé — đơn chưa bàn giao vận chuyển thì shop sửa được ạ.',
      { handoff: true },
    );
  }

  if (intent === 'return_status') {
    const req = userId ? await latestReturn(userId) : null;
    if (!req) {
      return reply(
        'Em chưa thấy yêu cầu đổi/trả nào trong tài khoản của anh/chị ạ.\n' +
        'Anh/chị gửi yêu cầu tại *Đơn hàng của tôi* → mở đơn → **Yêu cầu đổi/trả**, trong vòng ' +
        '**7 ngày** kể từ ngày nhận hàng nhé.',
      );
    }
    const code = String(req.order_id).slice(0, 8).toUpperCase();
    const status = RETURN_STATUS_TEXT[req.status] ?? `đang ở trạng thái **${req.status}**`;
    const kind = RETURN_TYPE_TEXT[req.type] ?? req.type;
    const sent = new Date(req.created_at).toLocaleDateString('vi-VN');
    const lines = [
      `Yêu cầu **${kind}** cho đơn **#${code}** (gửi ngày ${sent}) ${status}.`,
    ];
    if (req.admin_note) lines.push(`Ghi chú từ shop: *${req.admin_note}*`);
    lines.push('Anh/chị theo dõi chi tiết ở mục *Đơn hàng của tôi* ạ.');
    return reply(lines.join('\n'));
  }

  // ── Khuyến mãi: đọc mã giảm giá và flash sale thật đang chạy ──────────────
  if (intent === 'promo') {
    const askedFlash = normalized.includes('flash');
    const [coupons, flash, sale] = await Promise.all([
      activeCoupons(), runningFlashSales(), saleProducts(),
    ]);

    if (askedFlash) {
      if (flash.length === 0) {
        return reply(
          'Hiện **chưa có đợt Flash Sale nào đang chạy** ạ. Anh/chị theo dõi mục **Khuyến Mãi** ' +
          'trên website, shop sẽ mở đợt mới sớm thôi ạ.',
          { suggestions: sale.map(toCard) },
        );
      }
      const lines = ['Các mẫu đang **Flash Sale** ạ:'];
      for (const p of flash) {
        const left = hoursLeft(p.flash_ends_at);
        lines.push(
          `• **${p.name}** — ${vnd(p.effective_price)} đ (giảm ${discountPercent(p.price, p.effective_price)}%` +
          `${Number(p.flash_remaining) > 0 ? `, còn ${p.flash_remaining} suất` : ''}` +
          `${left ? `, kết thúc sau ~${left}` : ''})`,
        );
      }
      return reply(lines.join('\n'), { suggestions: flash.map(toCard) });
    }

    if (coupons.length === 0 && flash.length === 0 && sale.length === 0) {
      return reply('Hiện chưa có chương trình ưu đãi nào đang chạy ạ. Anh/chị theo dõi mục **Khuyến Mãi** trên website, shop sẽ cập nhật ngay khi có đợt mới.');
    }

    const lines = [];
    if (coupons.length) {
      lines.push('Các mã giảm giá đang còn hiệu lực ạ:');
      for (const c of coupons) {
        const value = c.type === 'percentage' ? `giảm ${c.value}%` : `giảm ${vnd(c.value)} đ`;
        const min = Number(c.min_order) > 0 ? `, đơn từ ${vnd(c.min_order)} đ` : '';
        const exp = new Date(c.expiry_date).toLocaleDateString('vi-VN');
        lines.push(`• **${c.code}** — ${value}${min} (dùng đến ${exp})`);
      }
    }
    if (flash.length) {
      lines.push(`${lines.length ? '\n' : ''}Đang có **${flash.length} mẫu Flash Sale** giảm sâu, số suất có hạn ạ:`);
    } else if (sale.length) {
      lines.push(`${lines.length ? '\n' : ''}Ngoài ra shop đang có nhiều mẫu **giảm giá**, anh/chị xem thử nhé:`);
    }
    return reply(lines.join('\n'), { suggestions: (flash.length ? flash : sale).map(toCard) });
  }

  if (intent === 'new_arrival') {
    const fresh = await newestProducts();
    return reply(
      'Đây là các mẫu **mới nhất** vừa lên kệ của IKA Fashion ạ. Anh/chị bấm vào mẫu để xem chi tiết nhé:',
      { suggestions: fresh.map(toCard) },
    );
  }

  // ── Xác định sản phẩm đang được hỏi ───────────────────────────────────────
  let product = null;
  let matches = [];

  // Câu chỉ có số đo thì không đi tìm sản phẩm: token 'cao' sẽ khớp nhầm mẫu
  // "Quần Dài Công Sở Cao Cấp", đè mất sản phẩm khách đang thực sự hỏi.
  const measuresOnly = intent === 'size_advice' && measures.weight;
  const priceRange = parsePriceRange(normalized);

  if (productId) {
    product = await findProductById(productId);
  }
  if (!product && !measuresOnly) {
    matches = await searchProducts(normalized);
    // Chỉ tự tin chốt một sản phẩm khi kết quả đầu vượt trội hơn kết quả nhì.
    // Ngang điểm nghĩa là câu hỏi mơ hồ ("áo polo") — nên hỏi lại, đừng đoán.
    if (matches.length === 1 || (matches.length > 1 && matches[0].score > matches[1].score)) {
      product = matches[0];
    }
  }
  // Chỉ nhớ mẫu cũ khi câu hỏi KHÔNG nhắc tên sản phẩm nào. Khách vừa gõ tên
  // mẫu khác mà vẫn dùng lastProductId là trả lời sai hẳn sản phẩm.
  if (!product && matches.length === 0 && lastProductId &&
      (PRODUCT_INTENTS.has(intent) || intent === 'size_advice')) {
    product = await findProductById(lastProductId);
  }

  // ── Tư vấn size theo chiều cao – cân nặng ─────────────────────────────────
  if (intent === 'size_advice') {
    const { weight, height } = measures;
    if (!weight) {
      return reply(
        'Anh/chị cho em xin **chiều cao và cân nặng** nhé, ví dụ *"cao 1m70 nặng 65kg"*, em tư vấn size vừa nhất ạ.\n' +
        'Bảng size chi tiết của từng dòng sản phẩm anh/chị xem tại trang *Hướng dẫn chọn size*.',
        { productId: product?.id ?? null },
      );
    }

    const bottom = isBottom(product);
    const recommended = pickSize(bottom ? BOTTOM_SIZE_BY_WEIGHT : TOP_SIZE_BY_WEIGHT, weight);
    const body = height ? `cao ${height}cm, nặng ${weight}kg` : `nặng ${weight}kg`;

    if (product) {
      const sizes = toArray(product.sizes);
      const available = sizes.includes(recommended);
      const lines = [
        `**${product.name}**`,
        `Với số đo ${body}, em gợi ý anh/chị chọn size **${recommended}** ạ.`,
        available
          ? `Size ${recommended} nằm trong các size của mẫu này (${sizes.join(', ')}).`
          : `Mẫu này hiện chỉ có size ${sizes.join(', ')}, anh/chị cân nhắc size gần nhất hoặc để em gợi ý mẫu khác nhé.`,
        'Nếu anh/chị thích mặc rộng thoải mái thì lên thêm 1 size ạ.',
      ];
      return reply(lines.join('\n'), { productId: product.id, suggestions: [toCard(product)] });
    }

    return reply(
      `Với số đo ${body}, em gợi ý anh/chị chọn **size ${pickSize(TOP_SIZE_BY_WEIGHT, weight)} cho áo** ` +
      `và **size ${pickSize(BOTTOM_SIZE_BY_WEIGHT, weight)} cho quần** ạ.\n` +
      'Nếu anh/chị thích mặc rộng thoải mái thì lên thêm 1 size. Anh/chị cho em biết đang xem mẫu nào để em kiểm tra size đó còn hàng không nhé.',
    );
  }

  // ── Gợi ý theo ngân sách ──────────────────────────────────────────────────
  // Đặt sau size_advice và trước nhánh sản phẩm đơn lẻ: "áo sơ mi dưới 300k"
  // là yêu cầu lọc danh sách, không phải hỏi thông số của một mẫu.
  // Đã chốt được đúng một mẫu thì khách đang hỏi về mẫu đó, con số trong câu
  // chỉ là ngân sách tham khảo — không biến câu hỏi thành một danh sách gợi ý.
  if (priceRange && !product) {
    // Ghi lại đúng ý định để thống kê không bị lệch: "có mẫu nào từ 200k đến
    // 400k không" dính từ khoá 'mau nao' nên detectIntent trả về 'color'.
    intent = 'suggest';
    const inRange = await productsInRange(priceRange, normalized);
    const capped = priceRange.max >= Number.MAX_SAFE_INTEGER;
    const label = capped
      ? `từ **${vnd(priceRange.min)} đ** trở lên`
      : priceRange.min > 0
        ? `trong khoảng **${vnd(priceRange.min)} – ${vnd(priceRange.max)} đ**`
        : `dưới **${vnd(priceRange.max)} đ**`;

    if (inRange.length === 0) {
      const popular = await topProducts();
      return reply(
        `Hiện shop chưa có mẫu nào ${label} ạ. Anh/chị tham khảo thêm các mẫu đang bán chạy này nhé:`,
        { suggestions: popular.map(toCard) },
      );
    }
    return reply(
      `Đây là các mẫu ${label} đang được khách chọn nhiều nhất ạ:`,
      { suggestions: inRange.map(toCard) },
    );
  }

  if (!product && matches.length > 1) {
    return reply(
      'Em tìm được vài mẫu phù hợp với mô tả của anh/chị. Anh/chị đang quan tâm mẫu nào ạ?',
      { suggestions: matches.map(toCard) },
    );
  }

  // ── Trả lời theo ý định, dựa trên dữ liệu sản phẩm thật ───────────────────
  if (product) {
    const card = [toCard(product)];

    if (intent === 'price') {
      return reply(`**${product.name}**\n${priceLine(product)}\n${stockLine(product)}`,
        { productId: product.id, suggestions: card });
    }
    if (intent === 'stock') {
      return reply(`**${product.name}**\n${stockLine(product)}`,
        { productId: product.id, suggestions: card });
    }
    if (PRODUCT_INTENTS.has(intent)) {
      const line = specLine(product, intent);
      if (line) {
        return reply(`**${product.name}**\n${line}`, { productId: product.id, suggestions: card });
      }
      // DB chưa nhập thông số này — nói thật thay vì bịa.
      return reply(
        `Thông tin này của **${product.name}** chưa được cập nhật đầy đủ trên hệ thống ạ. Anh/chị gõ **"gặp nhân viên"** để em nhờ bộ phận tư vấn kiểm tra và phản hồi chính xác nhất nhé.`,
        { productId: product.id, suggestions: card },
      );
    }
    return reply(productSummary(product), { productId: product.id, suggestions: card });
  }

  // ── Không xác định được sản phẩm ──────────────────────────────────────────
  if (PRODUCT_INTENTS.has(intent)) {
    const popular = await topProducts();
    return reply(
      'Anh/chị cho em xin **tên sản phẩm** cần hỏi với ạ, để em tra đúng thông tin. Hoặc anh/chị chọn nhanh một trong các mẫu đang được quan tâm nhất:',
      { suggestions: popular.map(toCard) },
    );
  }

  if (intent === 'suggest') {
    const popular = await topProducts();
    return reply(
      'Để tư vấn sát nhất, anh/chị cho em biết **kiểu đồ đang cần** (áo thun, áo polo, quần) và **ngân sách dự kiến** nhé. Trong lúc đó, đây là các mẫu bán chạy nhất của IKA Fashion:',
      { suggestions: popular.map(toCard) },
    );
  }

  // ── Không hiểu ────────────────────────────────────────────────────────────
  // Hỏi lại mãi một câu là cách nhanh nhất để mất khách. Lần thứ hai liên tiếp
  // không hiểu thì thôi, giao cho người thật.
  if (unknownStreak >= 1) {
    return reply(
      'Em xin lỗi vì chưa hỗ trợ được anh/chị ạ. Em chuyển hội thoại cho nhân viên tư vấn để ' +
      'trả lời chính xác hơn, anh/chị đợi giây lát nhé.',
      { handoff: true, productId: lastProductId ?? null },
    );
  }
  return reply(`Em chưa hiểu rõ ý anh/chị ạ.\n${QUICK_HELP}`);
}
