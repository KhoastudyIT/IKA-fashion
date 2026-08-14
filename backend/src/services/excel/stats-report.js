import ExcelJS from 'exceljs';

// Bảng màu lấy theo bộ nhận diện của website để file xuất ra nhìn cùng một nhà.
const GOLD = 'FFD4AF37';
const CREAM = 'FFF9F5F0';
const INK = 'FF2C2C2C';
const MUTED = 'FF7A7A7A';
const LINE = 'FFE5DFD8';
const RED = 'FFC0392B';

const VND_FMT = '#,##0" đ"';
const INT_FMT = '#,##0';

const ORDER_STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipped: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  returned: 'Đã trả hàng',
};

const PAYMENT_STATUS_LABEL = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
};

const RETURN_TYPE_LABEL = { return: 'Trả hàng', exchange: 'Đổi mới' };

const RETURN_STATUS_LABEL = {
  pending: 'Chờ duyệt', approved: 'Đã duyệt',
  rejected: 'Từ chối', completed: 'Hoàn tất',
};

const dmy = (d) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : new Date(d).toLocaleDateString('vi-VN');
};
const dmyhm = (d) => new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

/** Mã đơn hiển thị cho người đọc — 8 ký tự đầu của UUID, như trên giao diện. */
const orderCode = (id) => String(id).split('-')[0].toUpperCase();

/** Hàng tiêu đề cột: nền kem, chữ đậm, khoá dòng để cuộn vẫn thấy. */
function styleHeader(sheet, rowNumber = 1) {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true, color: { argb: INK }, size: 11 };
  row.alignment = { vertical: 'middle' };
  row.height = 22;
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREAM } };
    cell.border = { bottom: { style: 'thin', color: { argb: LINE } } };
  });
  sheet.views = [{ state: 'frozen', ySplit: rowNumber }];
}

/**
 * Dựng workbook thống kê nhiều sheet từ dữ liệu đã truy vấn sẵn.
 *
 * Nhận dữ liệu thuần thay vì tự gọi DB — nhờ đó tầng service giữ toàn bộ phần
 * truy vấn, còn file này chỉ lo trình bày.
 *
 * @param {object} data   Kết quả từ statsService.getReportData()
 * @param {object} meta   { from, to, storeName, exportedBy }
 * @returns {ExcelJS.Workbook}
 */
export function buildStatsWorkbook(data, meta = {}) {
  const wb = new ExcelJS.Workbook();
  const storeName = meta.storeName || 'IKA Fashion';
  wb.creator = storeName;
  wb.created = new Date();

  const range = `${dmy(meta.from)} – ${dmy(meta.to)}`;

  // ── Sheet 1: Tổng quan ────────────────────────────────────────────────────
  const s1 = wb.addWorksheet('Tổng quan', { properties: { tabColor: { argb: GOLD } } });
  s1.columns = [
    { key: 'label', width: 34 },
    { key: 'value', width: 22 },
  ];

  s1.mergeCells('A1:B1');
  const title = s1.getCell('A1');
  title.value = `BÁO CÁO THỐNG KÊ — ${storeName.toUpperCase()}`;
  title.font = { bold: true, size: 15, color: { argb: INK } };
  title.alignment = { vertical: 'middle' };
  s1.getRow(1).height = 28;

  s1.mergeCells('A2:B2');
  s1.getCell('A2').value = `Kỳ báo cáo: ${range}`;
  s1.getCell('A2').font = { color: { argb: MUTED }, size: 10 };

  s1.mergeCells('A3:B3');
  s1.getCell('A3').value = `Xuất lúc ${new Date().toLocaleString('vi-VN')}`
    + (meta.exportedBy ? ` bởi ${meta.exportedBy}` : '');
  s1.getCell('A3').font = { color: { argb: MUTED }, size: 10 };

  // Ghi rõ cách tính ngay đầu báo cáo: người đọc file không có ngữ cảnh của
  // trang quản trị, thấy số lệch với sổ sách là dễ nghi ngờ cả bản báo cáo.
  s1.mergeCells('A4:B4');
  s1.getCell('A4').value = 'Doanh thu chỉ tính đơn ĐÃ HOÀN THÀNH (không gồm đơn hủy, đơn trả và đơn chưa giao xong).';
  s1.getCell('A4').font = { color: { argb: MUTED }, size: 10, italic: true };

  // Định dạng gắn ngay vào từng chỉ tiêu thay vì liệt kê địa chỉ ô: thêm bớt
  // một dòng ở đây không kéo theo việc sửa lại danh sách ô bên dưới.
  const metrics = [
    { label: 'Doanh thu trong kỳ (đơn hoàn thành)', value: data.summary.revenue, money: true, strong: true },
    { label: 'Giá trị đơn trung bình', value: data.summary.avgOrderValue, money: true },
    { label: 'Tiền chờ thu (đơn chưa giao xong)', value: data.summary.pendingRevenue, money: true },
    { label: 'Số sản phẩm đã bán', value: data.summary.itemsSold },
    { label: 'Số đơn trong kỳ', value: data.summary.orders },
    { label: 'Đơn hoàn thành', value: data.summary.completedOrders },
    { label: 'Đơn đang xử lý', value: data.summary.pendingOrders },
    { label: 'Đơn bị hủy', value: data.summary.cancelledOrders },
    { label: 'Đơn khách trả lại', value: data.summary.returnedOrders },
    { label: 'Khách hàng mới trong kỳ', value: data.summary.newCustomers },
    null,   // dòng trống ngăn khối "trong kỳ" với khối số liệu toàn thời gian
    { label: 'Tổng doanh thu (toàn thời gian)', value: data.summary.totalRevenue, money: true },
    { label: 'Tổng số đơn hàng', value: data.summary.totalOrders },
    { label: 'Tổng số sản phẩm đang bán', value: data.summary.totalProducts },
    { label: 'Sản phẩm sắp hết hàng (< 10)', value: data.summary.lowStockCount },
    { label: 'Tổng số khách hàng', value: data.summary.totalCustomers },
  ];

  // Ba dòng đầu ghi bằng getCell nên rowCount đang là 3 — hàng tiêu đề rơi vào
  // dòng kế tiếp. Lấy theo rowCount thay vì đếm tay để không lệch khi sửa header.
  const headerRow = s1.rowCount + 1;
  s1.addRow(['Chỉ tiêu', 'Giá trị']);

  metrics.forEach((m) => {
    if (!m) { s1.addRow([]); return; }
    const row = s1.addRow([m.label, m.value]);
    const cell = row.getCell(2);
    cell.numFmt = m.money ? VND_FMT : INT_FMT;
    if (m.strong) cell.font = { bold: true, color: { argb: INK } };
  });

  styleHeader(s1, headerRow);
  s1.getColumn('value').alignment = { horizontal: 'right' };

  // ── Sheet 2: Doanh thu theo ngày ──────────────────────────────────────────
  const s2 = wb.addWorksheet('Doanh thu theo ngày');
  s2.columns = [
    { header: 'Ngày', key: 'date', width: 14 },
    { header: 'Số đơn', key: 'orders', width: 12, style: { numFmt: INT_FMT } },
    { header: 'Doanh thu', key: 'revenue', width: 18, style: { numFmt: VND_FMT } },
  ];
  data.revenueByDay.forEach((r) => s2.addRow({ date: dmy(r.date), orders: r.orders, revenue: r.revenue }));
  styleHeader(s2);
  if (data.revenueByDay.length) {
    // Phải chốt số dòng dữ liệu TRƯỚC khi ghi dòng tổng: ghi vào ô của dòng mới
    // làm rowCount tăng ngay, nếu đọc lại sau đó thì công thức SUM sẽ trùm lên
    // chính dòng tổng và Excel báo lỗi tham chiếu vòng.
    const lastData = s2.rowCount;
    const totalRow = lastData + 1;
    s2.getCell(`A${totalRow}`).value = 'Tổng cộng';
    s2.getCell(`B${totalRow}`).value = { formula: `SUM(B2:B${lastData})` };
    s2.getCell(`C${totalRow}`).value = { formula: `SUM(C2:C${lastData})` };
    s2.getRow(totalRow).font = { bold: true };
    s2.getCell(`B${totalRow}`).numFmt = INT_FMT;
    s2.getCell(`C${totalRow}`).numFmt = VND_FMT;
  }

  // ── Sheet 3: Sản phẩm bán chạy ────────────────────────────────────────────
  const s3 = wb.addWorksheet('Sản phẩm bán chạy');
  s3.columns = [
    { header: '#', key: 'idx', width: 6 },
    { header: 'Sản phẩm', key: 'name', width: 42 },
    { header: 'Danh mục', key: 'collection', width: 20 },
    { header: 'Đã bán trong kỳ', key: 'sold', width: 16, style: { numFmt: INT_FMT } },
    { header: 'Doanh thu', key: 'revenue', width: 18, style: { numFmt: VND_FMT } },
    { header: 'Tồn kho', key: 'stock', width: 12, style: { numFmt: INT_FMT } },
  ];
  data.topProducts.forEach((p, i) => s3.addRow({ idx: i + 1, ...p }));
  styleHeader(s3);

  // ── Sheet 4: Đơn hàng trong kỳ ────────────────────────────────────────────
  const s4 = wb.addWorksheet('Đơn hàng');
  s4.columns = [
    { header: 'Mã đơn', key: 'code', width: 12 },
    { header: 'Ngày đặt', key: 'createdAt', width: 18 },
    { header: 'Khách hàng', key: 'customerName', width: 26 },
    { header: 'Điện thoại', key: 'phone', width: 15 },
    { header: 'Địa chỉ giao', key: 'shippingAddress', width: 38 },
    { header: 'Số SP', key: 'itemCount', width: 9, style: { numFmt: INT_FMT } },
    { header: 'Giảm giá', key: 'discount', width: 14, style: { numFmt: VND_FMT } },
    { header: 'Thành tiền', key: 'total', width: 16, style: { numFmt: VND_FMT } },
    { header: 'Trạng thái', key: 'status', width: 16 },
    { header: 'Thanh toán', key: 'paymentStatus', width: 18 },
  ];
  data.orders.forEach((o) => s4.addRow({
    code: orderCode(o.id),
    createdAt: dmyhm(o.createdAt),
    customerName: o.customerName || 'Khách vãng lai',
    phone: o.phone || '',
    shippingAddress: o.shippingAddress || '',
    itemCount: o.itemCount,
    discount: o.discount,
    total: o.total,
    status: ORDER_STATUS_LABEL[o.status] ?? o.status,
    paymentStatus: PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus,
  }));
  styleHeader(s4);
  s4.autoFilter = { from: 'A1', to: `J${Math.max(1, s4.rowCount)}` };

  // ── Sheet 5: Đơn theo trạng thái ──────────────────────────────────────────
  const s5 = wb.addWorksheet('Đơn theo trạng thái');
  s5.columns = [
    { header: 'Trạng thái', key: 'status', width: 22 },
    { header: 'Số đơn', key: 'count', width: 12, style: { numFmt: INT_FMT } },
    { header: 'Giá trị', key: 'revenue', width: 18, style: { numFmt: VND_FMT } },
  ];
  data.ordersByStatus.forEach((r) => s5.addRow({
    status: ORDER_STATUS_LABEL[r.status] ?? r.status,
    count: r.count,
    revenue: r.revenue,
  }));
  styleHeader(s5);

  // ── Sheet 6: Doanh thu theo danh mục ──────────────────────────────────────
  const s6 = wb.addWorksheet('Doanh thu theo danh mục');
  s6.columns = [
    { header: 'Danh mục', key: 'collection', width: 26 },
    { header: 'Số lượng bán', key: 'sold', width: 15, style: { numFmt: INT_FMT } },
    { header: 'Doanh thu', key: 'revenue', width: 18, style: { numFmt: VND_FMT } },
    { header: 'Tỷ trọng', key: 'share', width: 12, style: { numFmt: '0.0"%"' } },
  ];
  const catTotal = data.revenueByCollection.reduce((s, r) => s + r.revenue, 0);
  data.revenueByCollection.forEach((r) => s6.addRow({
    ...r, share: catTotal > 0 ? (r.revenue / catTotal) * 100 : 0,
  }));
  styleHeader(s6);

  // ── Sheet 7: Khách hàng mua nhiều nhất ────────────────────────────────────
  const s7 = wb.addWorksheet('Khách hàng');
  s7.columns = [
    { header: '#', key: 'idx', width: 6 },
    { header: 'Khách hàng', key: 'name', width: 28 },
    { header: 'Điện thoại', key: 'phone', width: 15 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Số đơn', key: 'orders', width: 10, style: { numFmt: INT_FMT } },
    { header: 'Tổng chi tiêu', key: 'spent', width: 18, style: { numFmt: VND_FMT } },
  ];
  data.topCustomers.forEach((c, i) => s7.addRow({ idx: i + 1, ...c }));
  styleHeader(s7);

  // ── Sheet 8: Yêu cầu trả / đổi hàng ───────────────────────────────────────
  const s8 = wb.addWorksheet('Trả đổi hàng');
  s8.columns = [
    { header: 'Ngày gửi', key: 'createdAt', width: 18 },
    { header: 'Khách hàng', key: 'customerName', width: 26 },
    { header: 'Loại', key: 'type', width: 12 },
    { header: 'Lý do', key: 'reason', width: 42 },
    { header: 'Trạng thái', key: 'status', width: 14 },
    { header: 'Phản hồi cửa hàng', key: 'adminNote', width: 38 },
    { header: 'Giá trị đơn', key: 'orderTotal', width: 16, style: { numFmt: VND_FMT } },
  ];
  data.returns.forEach((r) => s8.addRow({
    ...r,
    createdAt: dmyhm(r.createdAt),
    type: RETURN_TYPE_LABEL[r.type] ?? r.type,
    status: RETURN_STATUS_LABEL[r.status] ?? r.status,
  }));
  styleHeader(s8);

  // ── Sheet 9: Sản phẩm sắp hết hàng ────────────────────────────────────────
  const s9 = wb.addWorksheet('Sắp hết hàng');
  s9.columns = [
    { header: 'Sản phẩm', key: 'name', width: 42 },
    { header: 'Mã sản phẩm', key: 'handle', width: 24 },
    { header: 'Danh mục', key: 'collection', width: 20 },
    { header: 'Tồn kho', key: 'stock', width: 12, style: { numFmt: INT_FMT } },
    { header: 'Đã bán', key: 'sold', width: 12, style: { numFmt: INT_FMT } },
  ];
  data.lowStock.forEach((p) => s9.addRow(p));
  styleHeader(s9);
  // Tô đỏ ô tồn kho để người đọc thấy ngay mặt hàng cần nhập thêm.
  for (let i = 2; i <= s9.rowCount; i++) {
    s9.getCell(`D${i}`).font = { bold: true, color: { argb: RED } };
  }

  return wb;
}
