import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(__dirname, '..', '..', 'assets', 'fonts');

// Font mặc định của pdfkit (Helvetica) KHÔNG có glyph tiếng Việt — chữ có dấu
// sẽ mất hoặc thành ô vuông. Vì vậy nhúng sẵn Be Vietnam Pro (giấy phép SIL
// OFL nên phân phối kèm được).
const FONTS = {
  regular: path.join(FONT_DIR, 'BeVietnamPro-Regular.ttf'),
  bold: path.join(FONT_DIR, 'BeVietnamPro-Bold.ttf'),
};

const PAGE_MARGIN = 45;

// Bảng màu lấy theo giao diện web để hoá đơn nhìn cùng một nhà với cửa hàng.
const COLOR = {
  ink: '#2C2C2C',
  muted: '#7A7A7A',
  line: '#E5DFD8',
  gold: '#D4AF37',
  cream: '#F9F5F0',
  muted2: '#A8A8A8',   // giá gốc bị gạch ngang
  sale: '#C0392B',     // nhãn khuyến mãi và dòng tiền được giảm
};

const vnd = (n) => Number(n || 0).toLocaleString('vi-VN');
const dt = (d) => new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

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

/** Mã hoá đơn ngắn gọn cho khách đọc, lấy từ 8 ký tự đầu của UUID. */
export const invoiceCode = (orderId) => String(orderId).split('-')[0].toUpperCase();

/**
 * Tổng tiền theo giá niêm yết và số tiền đã tiết kiệm nhờ giảm giá / flash sale.
 *
 * listPrice NULL nghĩa là đơn đặt trước khi có cột này — khi đó coi như dòng
 * hàng không được giảm, thà không hiện còn hơn hiện số sai.
 */
function itemTotals(items = []) {
  let listSubtotal = 0;   // theo giá niêm yết
  let payable = 0;        // theo giá thực trả

  for (const it of items) {
    const qty = Number(it.quantity ?? 0);
    const paid = Number(it.price ?? 0);
    const list = Number(it.listPrice ?? 0);
    payable += paid * qty;
    listSubtotal += (list > paid ? list : paid) * qty;
  }

  const saved = listSubtotal - payable;
  return { listSubtotal, payable, saved, hasSaving: saved > 0 };
}

/** Phần trăm giảm của một dòng hàng, làm tròn để in cho gọn. */
const discountPct = (list, paid) =>
  list > paid ? Math.round((1 - paid / list) * 100) : 0;

/** Độ đậm của hình chìm — đủ thấy là tên cửa hàng, không cản việc đọc chữ. */
const WATERMARK_OPACITY = 0.06;

/**
 * Vẽ hình chìm giữa trang bằng tên cửa hàng.
 *
 * Phải gọi TRƯỚC khi ghi nội dung của trang — pdfkit vẽ theo thứ tự gọi, vẽ sau
 * là nằm đè lên trên. Toàn bộ đặt giữa save/restore để độ mờ không rớt sang
 * phần chữ, và con trỏ doc.x/doc.y được khôi phục cho phần nội dung.
 */
function drawWatermark(doc, storeName) {
  const { width, height } = doc.page;
  const x0 = doc.x;
  const y0 = doc.y;

  doc.save();
  doc.opacity(WATERMARK_OPACITY);

  const text = (storeName || 'IKA FASHION').toUpperCase();
  doc.font('vn-bold').fontSize(56).fillColor(COLOR.gold);
  const textH = doc.heightOfString(text, { width: width * 0.9, align: 'center' });
  doc.text(text, width * 0.05, (height - textH) / 2, { width: width * 0.9, align: 'center' });

  doc.restore();
  doc.x = x0;
  doc.y = y0;
}

/**
 * Dựng hoá đơn PDF cho một đơn hàng.
 *
 * Trả về một stream để controller nối thẳng vào response — file không cần nằm
 * trọn trong bộ nhớ, và trình duyệt bắt đầu nhận dữ liệu ngay.
 *
 * @param {object} order     Đơn hàng kèm mảng items (từ order.service)
 * @param {object} settings  Cấu hình cửa hàng (từ settings.service)
 * @returns {PDFDocument}    Stream PDF đã ghi xong nội dung
 */
export function buildInvoicePdf(order, settings = {}) {
  const storeName = settings.storeName || 'IKA Fashion';

  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    info: {
      Title: `Hoa don ${invoiceCode(order.id)}`,
      Author: storeName,
      Subject: 'Hoa don ban hang',
    },
  });

  doc.registerFont('vn', FONTS.regular);
  doc.registerFont('vn-bold', FONTS.bold);
  doc.font('vn');

  // Hình chìm phải nằm dưới nội dung nên vẽ ngay khi trang vừa mở. Đơn nhiều
  // sản phẩm sẽ sang trang mới, sự kiện pageAdded lo cho các trang sau.
  drawWatermark(doc, storeName);
  doc.on('pageAdded', () => drawWatermark(doc, storeName));

  const left = PAGE_MARGIN;
  const right = doc.page.width - PAGE_MARGIN;
  const width = right - left;

  // ── Đầu trang: thông tin cửa hàng bên trái, mã hoá đơn bên phải ────────────
  doc.font('vn-bold').fontSize(20).fillColor(COLOR.ink)
    .text(storeName, left, PAGE_MARGIN, { width: width * 0.55 });

  doc.font('vn').fontSize(9).fillColor(COLOR.muted);
  const storeLines = [
    settings.address,
    settings.hotline ? `Hotline: ${settings.hotline}` : '',
    settings.email,
    settings.workingHours,
  ].filter(Boolean);
  for (const line of storeLines) {
    doc.text(line, { width: width * 0.55 });
  }

  const headTop = PAGE_MARGIN;
  doc.font('vn-bold').fontSize(22).fillColor(COLOR.gold)
    .text('HÓA ĐƠN', left + width * 0.55, headTop, { width: width * 0.45, align: 'right' });
  doc.font('vn').fontSize(10).fillColor(COLOR.muted)
    .text(`Số: ${invoiceCode(order.id)}`, { width: width * 0.45, align: 'right' })
    .text(`Ngày đặt: ${dt(order.createdAt)}`, { width: width * 0.45, align: 'right' })
    // Thời điểm kết xuất tệp — in lại hoá đơn cũ vẫn biết bản in này lấy lúc nào.
    .text(`Ngày in: ${dt(Date.now())}`, { width: width * 0.45, align: 'right' })
    .text(`Trạng thái: ${ORDER_STATUS_LABEL[order.status] ?? order.status}`, { width: width * 0.45, align: 'right' });

  let y = Math.max(doc.y, headTop + 92) + 12;
  doc.moveTo(left, y).lineTo(right, y).strokeColor(COLOR.line).lineWidth(1).stroke();
  y += 18;

  // ── Hai cột: người nhận và thông tin thanh toán ────────────────────────────
  const colW = (width - 20) / 2;

  doc.font('vn-bold').fontSize(10).fillColor(COLOR.ink).text('NGƯỜI NHẬN HÀNG', left, y);
  doc.font('vn').fontSize(10).fillColor(COLOR.muted);
  doc.text(order.customerName || '—', left, doc.y + 3, { width: colW });
  if (order.phone) doc.text(order.phone, { width: colW });
  if (order.customerEmail) doc.text(order.customerEmail, { width: colW });
  doc.text(order.shippingAddress || '—', { width: colW });
  const leftBottom = doc.y;

  const rx = left + colW + 20;
  doc.font('vn-bold').fontSize(10).fillColor(COLOR.ink).text('THANH TOÁN', rx, y);
  doc.font('vn').fontSize(10).fillColor(COLOR.muted);
  doc.text('Thanh toán khi nhận hàng (COD)', rx, doc.y + 3, { width: colW });
  doc.text(PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus ?? '—', { width: colW });
  if (order.couponCode) doc.text(`Mã giảm giá: ${order.couponCode}`, { width: colW });
  if (order.status === 'returned') {
    doc.fillColor(COLOR.sale).text('Đơn hàng đã được trả lại', { width: colW });
  }

  y = Math.max(leftBottom, doc.y) + 18;

  // ── Bảng sản phẩm ─────────────────────────────────────────────────────────
  const COL = {
    idx: left,
    name: left + 26,
    price: left + 300,
    qty: left + 385,
    total: left + 430,
  };
  const COL_W = {
    name: 265,
    price: 78,
    qty: 38,
    total: right - COL.total,
  };

  const drawTableHead = () => {
    doc.rect(left, y, width, 22).fill(COLOR.cream);
    doc.font('vn-bold').fontSize(9.5).fillColor(COLOR.ink);
    doc.text('#', COL.idx + 6, y + 6.5);
    doc.text('Sản phẩm', COL.name, y + 6.5, { width: COL_W.name });
    doc.text('Đơn giá', COL.price, y + 6.5, { width: COL_W.price, align: 'right' });
    doc.text('SL', COL.qty, y + 6.5, { width: COL_W.qty, align: 'right' });
    doc.text('Thành tiền', COL.total, y + 6.5, { width: COL_W.total, align: 'right' });
    y += 22;
  };

  drawTableHead();

  const items = order.items ?? [];
  items.forEach((item, i) => {
    // Tên sản phẩm dài sẽ xuống dòng — đo trước để biết chiều cao thật của hàng.
    doc.font('vn').fontSize(9.5);
    const nameH = doc.heightOfString(item.name ?? '', { width: COL_W.name });

    // Dòng hàng còn một dòng phụ ghi màu/size, và thêm một dòng nữa nếu có giảm
    // giá (nhãn mức giảm dưới tên, giá gốc gạch ngang bên cột đơn giá).
    const list = Number(item.listPrice ?? 0);
    const paid = Number(item.price ?? 0);
    const off = discountPct(list, paid);
    const rowH = Math.max(nameH + 11 + (off > 0 ? 11 : 0), 12) + 10;

    // Sang trang mới khi hết chỗ, và vẽ lại tiêu đề bảng cho dễ đọc.
    if (y + rowH > doc.page.height - PAGE_MARGIN - 120) {
      doc.addPage();
      y = PAGE_MARGIN;
      drawTableHead();
    }

    doc.fillColor(COLOR.muted).text(String(i + 1), COL.idx + 6, y + 5, { width: 20 });
    doc.fillColor(COLOR.ink).text(item.name ?? '', COL.name, y + 5, { width: COL_W.name });

    // Phân loại đã chọn — hoá đơn thời trang thiếu màu/size là không đối chiếu được.
    const variant = [item.color, item.size].filter(Boolean).join(' · ');
    doc.fontSize(8).fillColor(COLOR.muted)
      .text(variant || '—', COL.name, y + 5 + nameH + 1, { width: COL_W.name });

    if (off > 0) {
      const tag = item.flashSaleId ? `Flash Sale −${off}%` : `Khuyến mãi −${off}%`;
      doc.fontSize(8).fillColor(COLOR.sale)
        .text(tag, COL.name, y + 5 + nameH + 11, { width: COL_W.name });
    }
    doc.fontSize(9.5);

    doc.fillColor(COLOR.muted);
    doc.text(`${vnd(paid)} đ`, COL.price, y + 5, { width: COL_W.price, align: 'right' });

    if (off > 0) {
      // Giá niêm yết gạch ngang, đặt ngay dưới giá thực trả.
      const txt = `${vnd(list)} đ`;
      doc.fontSize(8);
      const tw = doc.widthOfString(txt);
      const tx = COL.price + COL_W.price - tw;
      const ty = y + 5 + 11;
      doc.fillColor(COLOR.muted2).text(txt, tx, ty, { lineBreak: false });
      doc.moveTo(tx, ty + 4).lineTo(tx + tw, ty + 4)
        .strokeColor(COLOR.muted2).lineWidth(0.6).stroke();
      doc.fontSize(9.5).fillColor(COLOR.muted);
    }

    doc.text(String(item.quantity), COL.qty, y + 5, { width: COL_W.qty, align: 'right' });
    doc.font('vn-bold').fillColor(COLOR.ink)
      .text(`${vnd(paid * item.quantity)} đ`, COL.total, y + 5, { width: COL_W.total, align: 'right' });

    y += rowH;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(COLOR.line).lineWidth(0.5).stroke();
  });

  if (items.length === 0) {
    doc.font('vn').fontSize(9.5).fillColor(COLOR.muted)
      .text('Đơn hàng không có sản phẩm nào.', left, y + 8, { width, align: 'center' });
    y += 28;
  }

  // ── Tổng kết tiền ─────────────────────────────────────────────────────────
  y += 14;
  const sumLeft = left + width * 0.5;
  const sumW = right - sumLeft;

  const sumRow = (label, value, opts = {}) => {
    doc.font(opts.bold ? 'vn-bold' : 'vn').fontSize(opts.bold ? 12 : 10)
      .fillColor(opts.bold ? COLOR.ink : COLOR.muted)
      .text(label, sumLeft, y, { width: sumW * 0.55 });
    doc.font(opts.bold ? 'vn-bold' : 'vn')
      .fillColor(opts.color ?? COLOR.ink)
      .text(value, sumLeft + sumW * 0.55, y, { width: sumW * 0.45, align: 'right' });
    y += opts.bold ? 20 : 16;
  };

  const t = itemTotals(items);
  const discount = Number(order.discount ?? 0);
  const shippingFee = Number(order.shippingFee ?? 0);
  // orders.total_price = tiền hàng − mã giảm giá + phí ship, nên muốn ra tạm
  // tính phải cộng lại phần giảm và gỡ phí ship ra. Có vậy các dòng
  // "tạm tính + phí ship − giảm giá = tổng" mới khớp nhau.
  const finalTotal = Number(order.totalPrice ?? 0);
  const subtotal = finalTotal + discount - shippingFee;

  // Chỉ hiện hai dòng giá niêm yết / tiết kiệm khi thực sự có hàng được giảm,
  // để hoá đơn thường không bị rối.
  if (t.hasSaving) {
    sumRow('Tổng theo giá niêm yết', `${vnd(t.listSubtotal)} đ`);
    sumRow('Tiết kiệm khuyến mãi', `− ${vnd(t.saved)} đ`, { color: COLOR.sale });
  }
  sumRow('Tạm tính', `${vnd(subtotal)} đ`);
  // Trước đây dòng này in cứng "Miễn phí" nên hóa đơn của đơn giao nhanh vẫn
  // hiện miễn phí trong khi khách đã trả 30.000 đ.
  //
  // Không kèm tên hình thức giao hàng vào nhãn: cột nhãn chỉ rộng 55% khối tổng
  // kết nên "Phí vận chuyển (Giao hàng nhanh)" bị ngắt xuống hai dòng, lệch hẳn
  // so với các dòng còn lại.
  sumRow('Phí vận chuyển', shippingFee > 0 ? `${vnd(shippingFee)} đ` : 'Miễn phí');
  if (discount > 0) {
    sumRow(
      order.couponCode ? `Giảm giá (${order.couponCode})` : 'Giảm giá',
      `− ${vnd(discount)} đ`,
      { color: COLOR.sale },
    );
  }

  doc.moveTo(sumLeft, y + 2).lineTo(right, y + 2).strokeColor(COLOR.line).lineWidth(1).stroke();
  y += 10;
  sumRow('TỔNG THANH TOÁN', `${vnd(finalTotal)} đ`, { bold: true, color: COLOR.gold });

  if (order.notes) {
    y += 6;
    doc.font('vn-bold').fontSize(9.5).fillColor(COLOR.ink).text('Ghi chú của khách:', left, y);
    doc.font('vn').fillColor(COLOR.muted).text(order.notes, left, doc.y + 2, { width: width * 0.55 });
    y = doc.y;
  }

  // ── Chân trang ────────────────────────────────────────────────────────────
  const footY = doc.page.height - PAGE_MARGIN - 40;
  if (y < footY) {
    doc.moveTo(left, footY).lineTo(right, footY).strokeColor(COLOR.line).lineWidth(0.5).stroke();
    doc.font('vn').fontSize(8.5).fillColor(COLOR.muted)
      .text(
        `Cảm ơn quý khách đã mua sắm tại ${storeName}. `
        + 'Hóa đơn được sinh tự động từ hệ thống, không cần chữ ký.',
        left, footY + 8, { width, align: 'center' },
      );
  }

  doc.end();
  return doc;
}
