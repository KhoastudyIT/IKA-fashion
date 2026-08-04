import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, UserCheck, Server, Bell } from 'lucide-react';

export default function PrivacyPolicyPageContent() {
    return (
        <>

            {/* Trust badges */}
            <section className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                        {[
                            { icon: Lock, title: 'Mã Hóa SSL', desc: 'Kết nối bảo mật 256-bit' },
                            { icon: ShieldCheck, title: 'Không Bán Dữ Liệu', desc: 'Cam kết tuyệt đối' },
                            { icon: UserCheck, title: 'Quyền Kiểm Soát', desc: 'Xóa dữ liệu bất cứ lúc nào' },
                        ].map((item) => (
                            <div key={item.title} className="flex items-center gap-4 py-6 px-6 sm:justify-center">
                                <item.icon size={28} className="text-accent flex-shrink-0" strokeWidth={1.5} />
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-10">
                            <PolicySection
                                num="1"
                                icon={Eye}
                                title="Thông Tin Chúng Tôi Thu Thập"
                            >
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Khi bạn sử dụng dịch vụ của IKA Fashion, chúng tôi có thể thu thập các thông tin sau:
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        { title: 'Thông tin cá nhân', items: ['Họ tên', 'Số điện thoại', 'Địa chỉ email', 'Địa chỉ giao hàng'] },
                                        { title: 'Thông tin giao dịch', items: ['Lịch sử đơn hàng', 'Phương thức thanh toán', 'Sản phẩm yêu thích', 'Đánh giá sản phẩm'] },
                                    ].map((group) => (
                                        <div key={group.title} className="bg-secondary rounded-xl p-5">
                                            <h4 className="font-semibold text-foreground text-sm mb-3">{group.title}</h4>
                                            <ul className="space-y-1.5">
                                                {group.items.map((item) => (
                                                    <li key={item} className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-accent rounded-full" /> {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </PolicySection>

                            <PolicySection
                                num="2"
                                icon={Server}
                                title="Mục Đích Sử Dụng"
                            >
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Thông tin được thu thập chỉ nhằm phục vụ các mục đích sau:
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        'Xử lý và xác nhận đơn hàng, phối hợp giao hàng đúng địa chỉ.',
                                        'Hỗ trợ chăm sóc khách hàng, giải quyết khiếu nại và đổi trả.',
                                        'Gửi thông báo về đơn hàng, chương trình khuyến mãi (nếu bạn đồng ý nhận).',
                                        'Cải thiện chất lượng sản phẩm và dịch vụ dựa trên phản hồi.',
                                        'Ngăn chặn gian lận và bảo vệ an toàn giao dịch.',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs mt-0.5">✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </PolicySection>

                            <PolicySection
                                num="3"
                                icon={Lock}
                                title="Bảo Mật Dữ Liệu"
                            >
                                <div className="space-y-4">
                                    <p className="text-muted-foreground leading-relaxed">
                                        IKA Fashion áp dụng các biện pháp bảo mật tiêu chuẩn công nghiệp:
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {[
                                            { title: 'Mã hóa SSL 256-bit', desc: 'Tất cả dữ liệu truyền tải đều được mã hóa, đảm bảo không bị đánh cắp.' },
                                            { title: 'Máy chủ bảo mật', desc: 'Dữ liệu được lưu trữ trên hệ thống máy chủ có tường lửa và giám sát 24/7.' },
                                            { title: 'Kiểm soát truy cập', desc: 'Chỉ nhân viên được ủy quyền mới có thể truy cập thông tin khách hàng.' },
                                            { title: 'Không chia sẻ bên thứ 3', desc: 'Cam kết không mua bán, trao đổi hay tiết lộ dữ liệu cho bên ngoài.' },
                                        ].map((item) => (
                                            <div key={item.title} className="bg-secondary rounded-xl p-5">
                                                <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PolicySection>

                            <PolicySection
                                num="4"
                                icon={UserCheck}
                                title="Quyền Lợi Của Bạn"
                            >
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Với tư cách là khách hàng, bạn có toàn quyền kiểm soát dữ liệu cá nhân của mình:
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        { right: 'Quyền truy cập', desc: 'Yêu cầu xem toàn bộ thông tin cá nhân IKA đang lưu trữ về bạn.' },
                                        { right: 'Quyền chỉnh sửa', desc: 'Cập nhật hoặc sửa đổi thông tin không chính xác bất kỳ lúc nào.' },
                                        { right: 'Quyền xóa', desc: 'Yêu cầu xóa hoàn toàn dữ liệu cá nhân khỏi hệ thống.' },
                                        { right: 'Quyền từ chối', desc: 'Từ chối nhận email marketing hoặc thông báo khuyến mãi.' },
                                    ].map((item) => (
                                        <li key={item.right} className="bg-secondary rounded-xl p-4 flex items-start gap-3">
                                            <span className="w-6 h-6 bg-accent/10 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <ShieldCheck size={14} className="text-accent" />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{item.right}</p>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-sm text-muted-foreground mt-4">
                                    Để thực hiện các quyền trên, vui lòng liên hệ <strong className="text-foreground">hello@ikafashion.com</strong>. Yêu cầu sẽ được xử lý trong vòng 3 ngày làm việc.
                                </p>
                            </PolicySection>

                            <PolicySection
                                num="5"
                                icon={Bell}
                                title="Cookie & Theo Dõi"
                            >
                                <p className="text-muted-foreground leading-relaxed mb-3">
                                    Website IKA Fashion sử dụng cookie để cải thiện trải nghiệm người dùng. Cookie giúp:
                                </p>
                                <ul className="space-y-2 mb-4">
                                    {[
                                        'Ghi nhớ giỏ hàng và sản phẩm yêu thích của bạn.',
                                        'Cá nhân hóa gợi ý sản phẩm phù hợp với sở thích.',
                                        'Phân tích lượng truy cập để cải thiện website.',
                                    ].map((item, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="text-accent">•</span> {item}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-sm text-muted-foreground">
                                    Bạn có thể tắt cookie trong cài đặt trình duyệt. Tuy nhiên, một số tính năng trên website có thể không hoạt động đầy đủ.
                                </p>
                            </PolicySection>
                        </div>

                        {/* Sidebar */}
                        <div>
                            <div className="bg-secondary rounded-xl p-6 sticky top-28 space-y-6">
                                <div>
                                    <h3 className="font-heading font-semibold text-foreground mb-4">Mục Lục</h3>
                                    <nav className="space-y-2">
                                        {['Thông tin thu thập', 'Mục đích sử dụng', 'Bảo mật dữ liệu', 'Quyền lợi của bạn', 'Cookie & Theo dõi'].map((item, i) => (
                                            <p key={i} className="text-sm text-muted-foreground hover:text-accent transition-colors cursor-pointer">
                                                {i + 1}. {item}
                                            </p>
                                        ))}
                                    </nav>
                                </div>
                                <div className="pt-6 border-t border-border">
                                    <h4 className="font-semibold text-foreground text-sm mb-2">Câu hỏi về bảo mật?</h4>
                                    <p className="text-xs text-muted-foreground mb-3">Liên hệ DPO (Data Protection Officer) của IKA:</p>
                                    <p className="text-sm font-semibold text-foreground">hello@ikafashion.com</p>
                                    <Link href="/contact" className="block w-full text-center py-2.5 bg-foreground text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity text-sm mt-4">
                                        Liên Hệ
                                    </Link>
                                </div>
                                <div className="pt-6 border-t border-border">
                                    <h4 className="font-semibold text-foreground text-sm mb-2">Chính sách liên quan</h4>
                                    <Link href="/dieu-khoan" className="block text-sm text-accent hover:underline mb-2">→ Điều khoản sử dụng</Link>
                                    <Link href="/chinh-sach-doi-tra" className="block text-sm text-accent hover:underline">→ Chính sách đổi trả</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

function PolicySection({ num, icon: Icon, title, children }: { num: string; icon: any; title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold">{num}</span>
                <Icon size={20} className="text-accent" />
                {title}
            </h2>
            {children}
        </div>
    );
}
