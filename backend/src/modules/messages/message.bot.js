/**
 * Bot tư vấn theo luật (rule-based), không gọi API AI bên ngoài: mọi con số
 * đều đọc từ DB thật. Tra không ra thì nói thẳng là chưa có thông tin và mời
 * gặp nhân viên, hơn là bịa một câu nghe hợp lý nhưng sai giá, sai tồn kho.
 */
import db from '../../db/index.js';

/** Bỏ dấu để khách gõ không dấu vẫn khớp từ khoá. */
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const vnd = (n) => Number(n || 0).toLocaleString('vi-VN');

/**
 * Quét theo thứ tự và lấy cái khớp ĐẦU TIÊN, nên trật tự ở đây chính là mức độ
 * ưu tiên. Từ khoá một tiếng ('gia', 'mau', 'size') bắt rất nhiều câu nên phải
 * nằm dưới cùng: để 'price' lên trên 'shipping' thì "phí ship bao nhiêu" cũng
 * bị hiểu thành hỏi giá.
 */
const INTENTS = [
  // ── Ưu tiên tuyệt đối ────────────────────────────────────────────────────
  { key: 'handoff',     keywords: ['gap nhan vien', 'gap nguoi', 'nguoi that', 'tu van vien', 'nhan vien tu van', 'gap tu van', 'noi chuyen voi nguoi', 'chat voi nhan vien', 'can nguoi ho tro'] },
  { key: 'greeting',    keywords: ['xin chao', 'chao shop', 'chao ban', 'hello', 'alo', 'hi shop', 'chao em'] },
  { key: 'thanks',      keywords: ['cam on', 'thanks', 'thank you', 'tks', 'cam on em'] },

  // ── Câu hỏi có cụm từ rõ nghĩa ───────────────────────────────────────────
  { key: 'order',       keywords: ['don hang', 'don cua toi', 'tra cuu don', 'kiem tra don', 'don toi dau', 'ma don', 'khi nao nhan duoc', 'giao toi dau', 'don moi nhat'] },
  { key: 'shipping',    keywords: ['giao hang', 'van chuyen', 'ship', 'phi ship', 'freeship', 'mien phi van chuyen', 'giao bao lau', 'bao lau den'] },
  { key: 'payment',     keywords: ['thanh toan', 'chuyen khoan', 'cod', 'tra sau', 'quet the', 'momo', 'vnpay', 'tra gop'] },
  { key: 'returns',     keywords: ['doi tra', 'hoan tien', 'tra lai hang', 'doi hang', 'chinh sach doi', 'doi size'] },
  { key: 'promo',       keywords: ['khuyen mai', 'giam gia', 'uu dai', 'sale', 'ma giam', 'voucher', 'coupon', 'ma giam gia'] },
  { key: 'care',        keywords: ['giat', 'bao quan', 'ui do', 'la ui', 'co ra mau', 'co xu long', 'co bi co', 'huong dan giat'] },
  { key: 'contact',     keywords: ['hotline', 'so dien thoai', 'lien he', 'sdt', 'email', 'cua hang', 'dia chi', 'o dau'] },
  { key: 'size_advice', keywords: ['tu van size', 'mac size nao', 'chon size', 'size nao vua', 'size nao phu hop', 'nen lay size', 'bang size', 'huong dan size'] },
  // Cụm gợi ý rõ nghĩa phải chặn trước 'color', nếu không "tư vấn mẫu nào đẹp"
  // dính từ khoá 'mau nao' và thành câu hỏi màu sắc.
  { key: 'suggest',     keywords: ['goi y', 'nen mua', 'recommend', 'mau nao dep', 'ban chay', 'hot nhat', 'co gi'] },

  // ── Thuộc tính sản phẩm ──────────────────────────────────────────────────
  { key: 'size',        keywords: ['con size', 'size nao', 'co size', 'nhung size', 'size gi', 'du size', 'size'] },
  { key: 'material',    keywords: ['chat lieu', 'chat vai', 'lam bang gi', 'vai gi', 'cotton', 'co day khong', 'co nong khong', 'chat luong vai', 'nguyen lieu'] },
  { key: 'color',       keywords: ['mau sac', 'mau gi', 'co mau', 'mau nao', 'nhung mau', 'mau'] },
  { key: 'stock',       keywords: ['con hang', 'con khong', 'con hay het', 'het hang', 'ton kho', 'san co', 'con bao nhieu cai', 'co san'] },
  { key: 'price',       keywords: ['gia bao nhieu', 'bao nhieu tien', 'gia the nao', 'gia sao', 'gia', 'bao nhieu', 'mac khong', 're khong'] },

  // ── Chung chung nhất, chỉ khớp khi không còn gì khác ─────────────────────
  { key: 'suggest',     keywords: ['tu van', 'phu hop'] },
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
  'mac', 'lay', 'con', 'hon', 'nua', 'them', 'chat', 'luong', 'mau',
]);

function keywordTokens(normalizedText) {
  return normalizedText
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(' ')
    .filter(t => t.length >= 2 && !STOP_WORDS.has(t));
}

// ── Truy vấn sản phẩm ────────────────────────────────────────────────────────

const PRODUCT_COLS = `
  id, name, handle, collection, type, price, img,
  colors, sizes, features, rating, sold, stock, description
`;

function toCard(p) {
  return {
    id: p.id,
    name: p.name,
    handle: p.handle,
    price: Number(p.price),
    img: p.img,
  };
}

async function findProductById(id) {
  const res = await db.query(`SELECT ${PRODUCT_COLS} FROM products WHERE id = $1`, [id]);
  return res.rows[0] ?? null;
}

/**
 * Chấm điểm trong Node chứ không so khớp bằng SQL: bỏ dấu tiếng Việt trong
 * Postgres cần extension `unaccent`, mà extension đó phải cài bằng quyền
 * superuser. Catalog chỉ vài chục dòng nên lọc trong Node là đủ.
 */
async function searchProducts(normalizedText, limit = 4) {
  const tokens = keywordTokens(normalizedText);
  if (tokens.length === 0) return [];

  const res = await db.query(`SELECT ${PRODUCT_COLS} FROM products`);

  const scored = res.rows.map((p) => {
    const haystack = normalize(`${p.name} ${p.type} ${p.collection}`);
    // Mỗi token khớp được 1 điểm.
    let score = tokens.reduce((sum, t) => sum + (haystack.includes(t) ? 1 : 0), 0);
    // Gõ trọn tên một mẫu thì mẫu đó thắng tuyệt đối: không có vế này,
    // "Áo Polo Đen" hoà điểm với "Áo Polo Đen Premium" và bot phải hỏi lại.
    if (normalizedText.includes(normalize(p.name))) score += 100;
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

async function topProducts(limit = 4) {
  const res = await db.query(
    `SELECT ${PRODUCT_COLS} FROM products ORDER BY sold DESC, rating DESC LIMIT $1`,
    [limit],
  );
  return res.rows;
}

async function saleProducts(limit = 4) {
  const res = await db.query(
    `SELECT ${PRODUCT_COLS} FROM products WHERE collection = 'sale' ORDER BY sold DESC LIMIT $1`,
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

function priceLine(p) {
  const onSale = p.collection === 'sale';
  return onSale
    ? `Giá đang ưu đãi: **${vnd(p.price)} đ** (thuộc mục Ưu Đãi).`
    : `Giá: **${vnd(p.price)} đ**.`;
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
    return `Sản phẩm có các size: **${sizes.join(', ')}**.\nAnh/chị cho em xin **chiều cao và cân nặng**, em tư vấn size vừa nhất ạ.`;
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
  { max: 70, size: '32' }, { max: 75, size: '33' }, { max: Infinity, size: '34' },
];

/**
 * Rút cân nặng và chiều cao: "1m70", "170cm", "65kg", "cao 170 nặng 65".
 * Số phải đi kèm đơn vị hoặc từ khoá — bắt số trần sẽ hiểu nhầm giá tiền
 * thành số đo cơ thể.
 */
export function parseBodyMeasures(normalizedText) {
  const kg = normalizedText.match(/(\d{2,3})\s*(kg|ky|kilo)\b/) ?? normalizedText.match(/nang\s*(\d{2,3})/);
  const weight = kg ? Number(kg[1]) : null;

  let height = null;
  const mFormat = normalizedText.match(/(\d)\s*m\s*(\d{1,2})\b/);   // 1m70
  if (mFormat) height = Number(mFormat[1]) * 100 + Number(mFormat[2].padEnd(2, '0'));
  if (!height) {
    const cm = normalizedText.match(/(\d{3})\s*cm\b/) ?? normalizedText.match(/cao\s*(\d{3})\b/);
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
  return product ? normalize(`${product.collection} ${product.type}`).includes('quan') : false;
}

// ── Câu trả lời chính sách (bám theo nội dung các trang chính sách của web) ───

const POLICY_ANSWERS = {
  shipping: 'Chính sách giao hàng của IKA Fashion:\n• **Miễn phí giao hàng toàn quốc** cho đơn từ **500.000 đ**\n• Đơn dưới 500.000 đ: phí đồng giá **30.000 đ**\n• Nội thành: **1–2 ngày làm việc** • Tỉnh thành khác: **3–5 ngày làm việc**\nChi tiết anh/chị xem tại trang *Chính sách giao hàng* ạ.',
  payment: 'Shop hỗ trợ các hình thức:\n• **Thanh toán khi nhận hàng (COD)**\n• **Chuyển khoản ngân hàng**\n• **Ví MoMo / VNPay / thẻ nội địa, quốc tế**\nAnh/chị chọn hình thức ngay ở bước thanh toán, hoặc cần em hướng dẫn chi tiết hình thức nào ạ?',
  returns: 'Chính sách đổi trả của IKA Fashion:\n• **Đổi/trả trong 7 ngày** kể từ ngày nhận hàng, sản phẩm còn nguyên tem mác, chưa qua sử dụng và chưa giặt\n• **Đổi size miễn phí** nếu size không vừa (áp dụng khi còn hàng)\n• Thời gian xử lý hoàn tiền hoặc đổi mẫu mới: **3–5 ngày làm việc**\nAnh/chị cần đổi trả đơn nào để em kiểm tra giúp ạ?',
  care: 'Hướng dẫn bảo quản để áo quần bền màu ạ:\n• Giặt máy ở **nước lạnh dưới 30°C**, lộn trái sản phẩm trước khi giặt\n• **Không dùng thuốc tẩy**, không ngâm quá 30 phút\n• Phơi nơi thoáng mát, tránh nắng gắt trực tiếp\n• Ủi ở nhiệt độ thấp–trung bình, tránh ủi trực tiếp lên hình in\nSản phẩm của IKA dùng vải không phai màu nên chỉ cần giặt đúng cách là dùng được rất lâu ạ.',
  contact: 'Anh/chị để lại **số điện thoại và khung giờ tiện nghe máy**, nhân viên IKA Fashion sẽ liên hệ tư vấn trực tiếp ạ. Thông tin cửa hàng và biểu mẫu liên hệ nằm ở trang *Liên hệ*.\nCần trao đổi ngay thì anh/chị gõ **"gặp nhân viên"**, em chuyển hội thoại này cho bộ phận chăm sóc khách hàng liền ạ.',
};

const ORDER_STATUS_TEXT = {
  pending:   'đang **chờ xác nhận**, shop sẽ xác nhận trong vài giờ tới',
  confirmed: 'đã được **xác nhận**, đang chuẩn bị hàng để bàn giao đơn vị vận chuyển',
  shipped:   'đang **trên đường giao**, anh/chị chú ý điện thoại giúp em nhé',
  completed: 'đã **giao thành công**',
  cancelled: 'đã **bị huỷ**',
};

const QUICK_HELP =
  'Em có thể giúp anh/chị tra cứu **giá, tồn kho, size, màu sắc, chất liệu** của từng sản phẩm, ' +
  'tư vấn **chọn size theo chiều cao – cân nặng**, kiểm tra **đơn hàng**, và các chính sách ' +
  '**giao hàng, thanh toán, đổi trả, khuyến mãi**.\n' +
  'Anh/chị cứ nhắn tên sản phẩm kèm điều muốn biết, ví dụ *"áo polo đen còn size L không"*. ' +
  'Cần nhân viên hỗ trợ thì gõ **"gặp nhân viên"** ạ.';

export const WELCOME_MESSAGE =
  'Chào anh/chị, em là trợ lý tư vấn của **IKA Fashion**.\n' +
  'Em tra giúp anh/chị **giá, tồn kho, size, màu sắc, chất liệu** của từng sản phẩm, ' +
  'tư vấn **chọn size**, kiểm tra **đơn hàng** và các chính sách **giao hàng, thanh toán, đổi trả**.\n' +
  'Anh/chị cần hỗ trợ gì ạ? Muốn gặp nhân viên tư vấn thì gõ **"gặp nhân viên"** nhé.';

/**
 * Sinh câu trả lời của bot.
 *
 * @param {object} params
 * @param {string} params.text            Nội dung khách vừa gửi
 * @param {string} params.userId          Khách đang chat (để tra đơn hàng của chính họ)
 * @param {number|null} params.productId  Sản phẩm khách gửi kèm (từ trang chi tiết)
 * @param {number|null} params.lastProductId Sản phẩm nhắc gần nhất trong hội thoại
 * @returns {Promise<{message: string, intent: string, productId: number|null,
 *                    suggestions: object[], handoff: boolean}>}
 */
export async function generateReply({ text, userId = null, productId = null, lastProductId = null }) {
  const normalized = normalize(text);
  let intent = detectIntent(normalized);

  // Gõ thẳng số đo là đang xin tư vấn size, dù câu đó không chứa từ khoá nào.
  const measures = parseBodyMeasures(normalized);
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
    return reply(
      'Em đã chuyển hội thoại này cho nhân viên tư vấn của IKA Fashion. Anh/chị vui lòng đợi trong giây lát, sẽ có người phản hồi ngay tại đây ạ.\nTrong lúc chờ, anh/chị có thể để lại nội dung cần hỗ trợ để nhân viên nắm trước.',
      { handoff: true, productId: productId ?? lastProductId ?? null },
    );
  }

  if (intent === 'greeting') {
    return reply(`Chào anh/chị, IKA Fashion rất vui được hỗ trợ ạ.\n${QUICK_HELP}`);
  }

  if (intent === 'thanks') {
    return reply('Dạ, rất vui được hỗ trợ anh/chị. Cần thêm thông tin gì về sản phẩm hay đơn hàng, anh/chị cứ nhắn em bất cứ lúc nào ạ.');
  }

  if (POLICY_ANSWERS[intent]) {
    return reply(POLICY_ANSWERS[intent]);
  }

  // ── Đơn hàng của chính khách ──────────────────────────────────────────────
  if (intent === 'order') {
    const order = userId ? await latestOrder(userId) : null;
    if (!order) {
      return reply('Em chưa thấy đơn hàng nào trong tài khoản của anh/chị ạ. Nếu anh/chị vừa đặt bằng tài khoản khác hoặc đặt qua điện thoại, gõ **"gặp nhân viên"** để em nhờ bộ phận CSKH tra giúp nhé.');
    }
    const code = String(order.id).slice(0, 8).toUpperCase();
    const status = ORDER_STATUS_TEXT[order.status] ?? `đang ở trạng thái **${order.status}**`;
    const paid = order.payment_status === 'paid' ? 'đã thanh toán' : 'chưa thanh toán';
    const placed = new Date(order.created_at).toLocaleDateString('vi-VN');
    return reply(
      `Đơn gần nhất của anh/chị (**#${code}**, đặt ngày ${placed}) ${status}.\n` +
      `Tổng tiền: **${vnd(order.total_price)} đ** (${paid}).\n` +
      'Anh/chị xem chi tiết ở mục *Đơn hàng của tôi* trong trang tài khoản ạ.',
    );
  }

  // ── Khuyến mãi: đọc mã giảm giá thật đang còn hiệu lực ────────────────────
  if (intent === 'promo') {
    const [coupons, sale] = await Promise.all([activeCoupons(), saleProducts()]);
    if (coupons.length === 0 && sale.length === 0) {
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
    if (sale.length) {
      lines.push(`${coupons.length ? '\n' : ''}Ngoài ra shop đang có mục **Ưu Đãi** với nhiều mẫu giảm sâu, anh/chị xem thử nhé:`);
    }
    return reply(lines.join('\n'), { suggestions: sale.map(toCard) });
  }

  // ── Xác định sản phẩm đang được hỏi ───────────────────────────────────────
  let product = null;
  let matches = [];

  // Câu chỉ có số đo thì không đi tìm sản phẩm: token 'cao' sẽ khớp nhầm mẫu
  // "Quần Dài Công Sở Cao Cấp", đè mất sản phẩm khách đang thực sự hỏi.
  const measuresOnly = intent === 'size_advice' && measures.weight;

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
          ? `Size ${recommended} hiện **đang có** trong các size của mẫu này (${sizes.join(', ')}).`
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

  return reply(`Em chưa hiểu rõ ý anh/chị ạ.\n${QUICK_HELP}`);
}
