import React from 'react';
import Link from 'next/link';

export default function ReturnPolicyPage() {
    return (
        <div className="container mx-auto py-16 px-4 md:px-6 min-h-screen">
            <div className="max-w-3xl mx-auto bg-card p-8 md:p-12 rounded-lg shadow-sm border border-border">

                <div className="text-center mb-10 border-b border-border pb-8">
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                        Chính Sách Đổi Trả
                    </h1>
                    <p className="text-muted-foreground font-sans">
                        Cập nhật lần cuối: 06/07/2026
                    </p>
                </div>

                <div className="space-y-8 font-sans text-foreground/90 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            1. Điều Kiện Đổi Trả
                        </h2>
                        <p className="mb-3">IKA Fashion chấp nhận đổi/trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng với các điều kiện sau:</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Sản phẩm còn nguyên tem mác, chưa qua sử dụng, giặt ủi hay chỉnh sửa.</li>
                            <li>Sản phẩm không bị dơ bẩn, hư hỏng bởi những tác nhân bên ngoài sau khi mua.</li>
                            <li>Có đầy đủ hóa đơn mua hàng hoặc thông tin số điện thoại đặt hàng.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            2. Các Sản Phẩm Không Áp Dụng
                        </h2>
                        <p className="mb-3">Nhằm đảm bảo vệ sinh và chất lượng, chúng tôi không hỗ trợ đổi trả đối với:</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Đồ lót, tất, phụ kiện tóc.</li>
                            <li>Sản phẩm mua trong các chương trình Flash Sale hoặc giảm giá từ 50% trở lên.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            3. Quy Trình Xử Lý
                        </h2>
                        <p className="text-muted-foreground">
                            Quý khách vui lòng liên hệ qua hotline hoặc email hỗ trợ. Đội ngũ CSKH sẽ kiểm tra tình trạng đơn hàng và hướng dẫn gửi trả sản phẩm về kho. Thời gian xử lý hoàn tiền hoặc đổi mẫu mới từ 3-5 ngày làm việc kể từ khi chúng tôi nhận được hàng hoàn.
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