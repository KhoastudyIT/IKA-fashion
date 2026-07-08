import React from 'react';
import Link from 'next/link';

export default function ShippingPolicyPage() {
    return (
        <div className="container mx-auto py-16 px-4 md:px-6 min-h-screen">
            <div className="max-w-3xl mx-auto bg-card p-8 md:p-12 rounded-lg shadow-sm border border-border">

                <div className="text-center mb-10 border-b border-border pb-8">
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                        Chính Sách Giao Hàng
                    </h1>
                    <p className="text-muted-foreground font-sans">
                        Cập nhật lần cuối: 06/07/2026
                    </p>
                </div>

                <div className="space-y-8 font-sans text-foreground/90 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            1. Thời Gian Giao Hàng
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Nội thành Hà Nội và TP. Hồ Chí Minh: từ <strong className="text-foreground/90">1–2 ngày làm việc</strong> kể từ khi đơn hàng được xác nhận.</li>
                            <li>Các tỉnh thành khác trên toàn quốc: từ <strong className="text-foreground/90">3–5 ngày làm việc</strong> tuỳ địa bàn và đơn vị vận chuyển.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            2. Phí Vận Chuyển
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Miễn phí giao hàng toàn quốc cho đơn hàng có giá trị từ <strong className="text-foreground/90">500.000 VNĐ</strong> trở lên.</li>
                            <li>Đơn hàng dưới 500.000 VNĐ áp dụng phí vận chuyển đồng giá <strong className="text-foreground/90">30.000 VNĐ</strong>.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            3. Kiểm Tra Hàng
                        </h2>
                        <p className="text-muted-foreground">
                            IKA Fashion cho phép khách hàng kiểm tra sản phẩm trước khi thanh toán. Vui lòng không mặc thử hoặc làm bẩn sản phẩm trong quá trình kiểm tra để đảm bảo quyền lợi cho cả hai bên.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-border text-center">
                    <p className="text-muted-foreground mb-4">Bạn cần hỗ trợ thêm?</p>
                    <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-accent text-accent font-medium rounded hover:bg-accent hover:text-white transition-colors duration-300">
                        Liên Hệ Với Chúng Tôi
                    </Link>
                </div>

            </div>
        </div>
    );
}
