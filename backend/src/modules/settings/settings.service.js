import db from '../../db/index.js';

// Alias camelCase cho FE, giống các module khác.
const COLS = `
  store_name    AS "storeName",
  logo,
  hotline,
  email,
  address,
  working_hours AS "workingHours",
  facebook_url  AS "facebookUrl",
  instagram_url AS "instagramUrl",
  tiktok_url    AS "tiktokUrl",
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
  workingHours: 'working_hours',
  facebookUrl:  'facebook_url',
  instagramUrl: 'instagram_url',
  tiktokUrl:    'tiktok_url',
};

/**
 * Luôn có cấu hình để đọc: nếu bảng trống (DB dựng trước khi có bảng này, hoặc
 * dòng seed bị xoá tay) thì tạo lại dòng mặc định thay vì trả null — trang chủ
 * không nên vỡ chỉ vì admin chưa vào Cài Đặt lần nào.
 */
export async function getSettings() {
  const res = await db.query(`SELECT ${COLS} FROM store_settings WHERE id = 1`);
  if (res.rows.length) return res.rows[0];

  const created = await db.query(
    `INSERT INTO store_settings (id) VALUES (1)
     ON CONFLICT (id) DO NOTHING
     RETURNING ${COLS}`,
  );
  if (created.rows.length) return created.rows[0];

  // Có request khác chèn trước trong lúc chạy — đọc lại là chắc chắn có.
  const again = await db.query(`SELECT ${COLS} FROM store_settings WHERE id = 1`);
  return again.rows[0];
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
  return res.rows[0];
}
