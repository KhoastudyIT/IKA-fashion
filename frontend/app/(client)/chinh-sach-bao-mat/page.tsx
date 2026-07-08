import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto py-16 px-4 md:px-6 min-h-screen">
            <div className="max-w-3xl mx-auto bg-card p-8 md:p-12 rounded-lg shadow-sm border border-border">

                <div className="text-center mb-10 border-b border-border pb-8">
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                        Chính Sách Bảo Mật
                    </h1>
                    <p className="text-muted-foreground font-sans">
                        Cam kết bảo vệ thông tin cá nhân của khách hàng
                    </p>
                </div>

                <div className="space-y-8 font-sans text-foreground/90 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            1. Mục Đích Thu Thập
                        </h2>
                        <p className="text-muted-foreground mb-3">
                            Chúng tôi thu thập các thông tin cá nhân cần thiết bao gồm <strong className="text-foreground/90">Họ tên, Số điện thoại, Email và Địa chỉ</strong> chỉ nhằm các mục đích sau:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Xử lý và xác nhận đơn hàng của quý khách.</li>
                            <li>Phối hợp với đơn vị vận chuyển để giao hàng đúng địa chỉ.</li>
                            <li>Hỗ trợ chăm sóc khách hàng và giải quyết khiếu nại.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            2. Bảo Mật Dữ Liệu
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Mọi thông tin của quý khách được lưu trữ an toàn trên hệ thống máy chủ có mã hóa, đảm bảo không bị rò rỉ hay truy cập trái phép.</li>
                            <li>IKA Fashion <strong className="text-foreground/90">cam kết tuyệt đối không mua bán, trao đổi hoặc tiết lộ</strong> thông tin cá nhân của khách hàng cho bất kỳ bên thứ ba nào dưới mọi hình thức.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center">
                            <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            3. Quyền Lợi Khách Hàng
                        </h2>
                        <p className="text-muted-foreground">
                            Quý khách có quyền <strong className="text-foreground/90">yêu cầu trích xuất, sửa đổi hoặc xóa bỏ</strong> thông tin cá nhân khỏi hệ thống của chúng tôi bất kỳ lúc nào. Để thực hiện, vui lòng liên hệ với chúng tôi qua email hỗ trợ hoặc sử dụng trang liên hệ bên dưới. Yêu cầu sẽ được xử lý trong vòng 3 ngày làm việc.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-border text-center">
                    <p className="text-muted-foreground mb-4">Bạn có câu hỏi về chính sách bảo mật?</p>
                    <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-accent text-accent font-medium rounded hover:bg-accent hover:text-white transition-colors duration-300">
                        Liên Hệ Với Chúng Tôi
                    </Link>
                </div>

            </div>
        </div>
    );
}
