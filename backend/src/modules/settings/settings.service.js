import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';

// Cấu hình đọc trên mọi lượt tải trang nhưng gần như không đổi → cache 10 phút,
// xóa ngay khi admin lưu nên không bao giờ thấy dữ liệu cũ sau khi sửa.
const CACHE_KEY = 'settings:store';
const CACHE_TTL = 600000;

// Alias camelCase cho FE, giống các module khác.
const COLS = `
  store_name    AS "storeName",
  logo,
  hotline,
  email,
  address,
  map_url       AS "mapUrl",
  working_hours AS "workingHours",
  facebook_url  AS "facebookUrl",
  instagram_url AS "instagramUrl",
  tiktok_url    AS "tiktokUrl",
  youtube_url   AS "youtubeUrl",
  updated_at    AS "updatedAt"
`;

// Map field FE -> cột DB. Danh sách trắng này cũng là hàng rào chống ghi bừa:
// key nào không có ở đây thì không sinh ra mệnh đề SET nào.
const COLUMN_OF = {
  storeName:    'store_name',
  logo:         'logo',
  hotline:      'hotline',
  email:        'email',
  address:      'address',
  mapUrl:       'map_url',
  workingHours: 'working_hours',
  facebookUrl:  'facebook_url',
  instagramUrl: 'instagram_url',
  tiktokUrl:    'tiktok_url',
  youtubeUrl:   'youtube_url',
};

/**
 * Luôn có cấu hình để đọc: nếu bảng trống (DB dựng trước khi có bảng này, hoặc
 * dòng seed bị xoá tay) thì tạo lại dòng mặc định thay vì trả null — trang chủ
 * không nên vỡ chỉ vì admin chưa vào Cài Đặt lần nào.
 */
export async function getSettings() {
  const cached = dbCache.get(CACHE_KEY);
  if (cached) return cached;

  const res = await db.query(`SELECT ${COLS} FROM store_settings WHERE id = 1`);
  let row = res.rows[0];

  if (!row) {
    const created = await db.query(
      `INSERT INTO store_settings (id) VALUES (1)
       ON CONFLICT (id) DO NOTHING
       RETURNING ${COLS}`,
    );
    // Có request khác chèn trước trong lúc chạy — đọc lại là chắc chắn có.
    row = created.rows[0]
      ?? (await db.query(`SELECT ${COLS} FROM store_settings WHERE id = 1`)).rows[0];
  }

  dbCache.set(CACHE_KEY, row, CACHE_TTL);
  return row;
}

/** Chỉ cập nhật field được gửi lên; field bỏ trống giữ nguyên giá trị cũ. */
export async function updateSettings(data) {
  const sets = [];
  const params = [];

  for (const [key, column] of Object.entries(COLUMN_OF)) {
    if (data[key] === undefined) continue;
    params.push(data[key]);
    sets.push(`${column} = $${params.length}`);
  }

  // Không gửi field nào thì khỏi ghi, trả về cấu hình hiện tại.
  if (!sets.length) return getSettings();

  await getSettings();   // đảm bảo dòng id = 1 tồn tại trước khi UPDATE
  sets.push('updated_at = NOW()');

  const res = await db.query(
    `UPDATE store_settings SET ${sets.join(', ')} WHERE id = 1 RETURNING ${COLS}`,
    params,
  );

  dbCache.delete(CACHE_KEY);
  return res.rows[0];
}
