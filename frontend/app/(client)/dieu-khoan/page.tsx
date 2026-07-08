import React from 'react';
import Link from 'next/link';

export default function TermsOfServicePage() {
    return (
        <div className="container mx-auto py-16 px-4 md:px-6 min-h-screen">
            <div className="max-w-3xl mx-auto bg-card p-8 md:p-12 rounded-lg shadow-sm border border-border">

                <div className="text-center mb-10 border-b border-border pb-8">
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                        Điều Khoản Sử Dụng
                    </h1>
                    <p className="text-muted-foreground font-sans">
                        Cập nhật lần cuối: 06/07/2026
                    </p>
                </div>

                <div className="space-y-8 font-sans text-foreground/90 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            1. Chấp Thuận Điều Khoản
                        </h2>
                        <p className="text-muted-foreground">
                            Khi truy cập và mua sắm tại website IKA Fashion, quý khách mặc nhiên <strong className="text-foreground/90">đồng ý với toàn bộ các điều khoản và quy định</strong> được nêu tại đây. Nếu quý khách không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng dịch vụ của chúng tôi.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            2. Quyền Sở Hữu Trí Tuệ
                        </h2>
                        <p className="text-muted-foreground mb-3">
                            Toàn bộ nội dung trên website này bao gồm <strong className="text-foreground/90">hình ảnh, bài viết và thiết kế logo</strong> đều thuộc bản quyền của IKA Fashion và được bảo hộ theo quy định pháp luật hiện hành.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Nghiêm cấm sao chép, tái sản xuất hoặc phân phối nội dung dưới bất kỳ hình thức nào.</li>
                            <li>Nghiêm cấm sử dụng hình ảnh, logo hoặc nội dung cho mục đích thương mại khi chưa có <strong className="text-foreground/90">sự đồng ý bằng văn bản</strong> từ IKA Fashion.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            3. Quy Định Về Giá Và Sản Phẩm
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Chúng tôi có quyền <strong className="text-foreground/90">thay đổi giá bán và thông tin sản phẩm</strong> tại bất kỳ thời điểm nào mà không cần thông báo trước.</li>
                            <li>Trong trường hợp có lỗi hệ thống dẫn đến sai sót về giá niêm yết, IKA Fashion có quyền <strong className="text-foreground/90">từ chối hoặc hủy đơn hàng</strong> liên quan và sẽ thông báo đến quý khách trong thời gian sớm nhất.</li>
                        </ul>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-border text-center">
                    <p className="text-muted-foreground mb-4">Bạn cần làm rõ điều khoản nào?</p>
                    <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-accent text-accent font-medium rounded hover:bg-accent hover:text-white transition-colors duration-300">
                        Liên Hệ Với Chúng Tôi
                    </Link>
                </div>

            </div>
        </div>
    );
}
