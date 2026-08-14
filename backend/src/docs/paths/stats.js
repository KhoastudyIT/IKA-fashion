import {
  bearer, queryParam, adminErrors, validationError,
} from '../helpers.js';

const rangeParams = [
  queryParam('from', { type: 'string', format: 'date', example: '2026-07-15' }, 'Ngày bắt đầu (YYYY-MM-DD). Bỏ trống → 30 ngày gần nhất'),
  queryParam('to', { type: 'string', format: 'date', example: '2026-08-14' }, 'Ngày kết thúc (YYYY-MM-DD), TÍNH CẢ ngày này'),
];

export const statsPaths = {
  '/api/v1/admin/stats/report': {
    get: {
      tags: ['Admin - Thống kê'],
      summary: 'Số liệu báo cáo dạng JSON',
      description:
        'Cùng bộ dữ liệu với file Excel: chỉ số tổng hợp, doanh thu theo ngày, sản phẩm bán '
        + 'chạy, danh sách đơn, đơn theo trạng thái, doanh thu theo danh mục, khách mua nhiều '
        + 'nhất, yêu cầu trả/đổi và hàng sắp hết.\n\n'
        + 'Đơn `cancelled` và `returned` không tính vào doanh thu.',
      security: bearer,
      parameters: rangeParams,
      responses: {
        200: {
          description: 'Dữ liệu báo cáo của kỳ',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          range: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } } },
                          summary: { type: 'object' },
                          revenueByDay: { type: 'array', items: { type: 'object' } },
                          topProducts: { type: 'array', items: { type: 'object' } },
                          orders: { type: 'array', items: { type: 'object' } },
                          ordersByStatus: { type: 'array', items: { type: 'object' } },
                          revenueByCollection: { type: 'array', items: { type: 'object' } },
                          topCustomers: { type: 'array', items: { type: 'object' } },
                          returns: { type: 'array', items: { type: 'object' } },
                          lowStock: { type: 'array', items: { type: 'object' } },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        ...adminErrors,
        422: validationError,
      },
    },
  },

  '/api/v1/admin/stats/export': {
    get: {
      tags: ['Admin - Thống kê'],
      summary: 'Tải báo cáo thống kê (.xlsx)',
      description:
        'Trả về file Excel nhiều sheet (không phải JSON) nên phải gọi bằng fetch kèm token rồi '
        + 'lưu blob. Tên file do server đặt trong `Content-Disposition`.\n\n'
        + 'Các sheet: Tổng quan · Doanh thu theo ngày · Sản phẩm bán chạy · Đơn hàng · Đơn theo '
        + 'trạng thái · Doanh thu theo danh mục · Khách hàng · Trả đổi hàng · Sắp hết hàng.',
      security: bearer,
      parameters: rangeParams,
      responses: {
        200: {
          description: 'File Excel báo cáo',
          content: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
        ...adminErrors,
        422: validationError,
      },
    },
  },
};
