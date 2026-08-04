import React from 'react';
import Link from 'next/link';
import { FileText, Scale, CreditCard, ShieldAlert, Ban, Globe, Gavel } from 'lucide-react';

export default function TermsOfServicePageContent() {
    return (
        <>

            {/* Content */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-10">
                            <TermSection num="1" icon={FileText} title="Chấp Thuận Điều Khoản">
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Khi truy cập và mua sắm tại website IKA Fashion, bạn mặc nhiên <strong className="text-foreground">đồng ý với toàn bộ các điều khoản và quy định</strong> được nêu tại đây.
                                </p>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                                    <p className="text-sm text-amber-800">
                                        ⚠ Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng dịch vụ. IKA có quyền cập nhật các điều khoản này bất cứ lúc nào và sẽ thông báo trên website.
                                    </p>
                                </div>
                            </TermSection>

                            <TermSection num="2" icon={Scale} title="Quyền Sở Hữu Trí Tuệ">
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Toàn bộ nội dung trên website bao gồm <strong className="text-foreground">hình ảnh, bài viết, thiết kế logo, tên thương hiệu</strong> đều thuộc bản quyền của IKA Fashion và được bảo hộ theo quy định pháp luật.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        'Nghiêm cấm sao chép, tái sản xuất hoặc phân phối nội dung dưới bất kỳ hình thức nào.',
                                        'Nghiêm cấm sử dụng hình ảnh, logo hoặc nội dung cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản.',
                                        'Việc sử dụng nội dung cho mục đích cá nhân, phi thương mại (chia sẻ bài viết) được cho phép khi ghi nguồn IKA Fashion.',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs mt-0.5">!</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </TermSection>

                            <TermSection num="3" icon={CreditCard} title="Quy Định Về Giá & Sản Phẩm">
                                <div className="space-y-4">
                                    <p className="text-muted-foreground leading-relaxed">
                                        Giá sản phẩm trên website được niêm yết bằng <strong className="text-foreground">Việt Nam Đồng (VNĐ)</strong> và đã bao gồm thuế VAT. Chúng tôi cam kết:
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {[
                                            { title: 'Giá minh bạch', desc: 'Tất cả giá hiển thị là giá cuối cùng. Không phát sinh phí ẩn ngoài phí vận chuyển (nếu có).' },
                                            { title: 'Quyền thay đổi giá', desc: 'IKA có quyền điều chỉnh giá bán bất kỳ lúc nào. Giá tại thời điểm đặt hàng là giá áp dụng cho đơn đó.' },
                                            { title: 'Lỗi giá niêm yết', desc: 'Trong trường hợp lỗi hệ thống dẫn đến sai giá, IKA có quyền hủy đơn và thông báo đến khách hàng.' },
                                            { title: 'Chương trình sale', desc: 'Sản phẩm sale có thể bị giới hạn số lượng và thời gian. IKA không đảm bảo còn hàng cho tất cả sản phẩm.' },
                                        ].map((item) => (
                                            <div key={item.title} className="bg-secondary rounded-xl p-5">
                                                <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TermSection>

                            <TermSection num="4" icon={Ban} title="Hành Vi Bị Nghiêm Cấm">
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Khi sử dụng website IKA Fashion, bạn cam kết không thực hiện các hành vi sau:
                                </p>
                                <div className="bg-destructive/5 border border-destructive/15 rounded-xl p-6 space-y-3">
                                    {[
                                        'Sử dụng website để phát tán mã độc, virus hoặc phần mềm gây hại.',
                                        'Cố tình tấn công, phá hoại hệ thống hoặc can thiệp hoạt động website.',
                                        'Đặt đơn hàng giả mạo, sử dụng thông tin thanh toán không hợp lệ.',
                                        'Thu thập dữ liệu cá nhân của người dùng khác trên website.',
                                        'Giả mạo danh tính hoặc tạo tài khoản giả để lạm dụng ưu đãi.',
                                    ].map((item, i) => (
                                        <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="text-destructive flex-shrink-0">✕</span> {item}
                                        </p>
                                    ))}
                                </div>
                            </TermSection>

                            <TermSection num="5" icon={ShieldAlert} title="Giới Hạn Trách Nhiệm">
                                <div className="space-y-4">
                                    <p className="text-muted-foreground leading-relaxed">
                                        IKA Fashion nỗ lực cung cấp thông tin chính xác nhất trên website, tuy nhiên:
                                    </p>
                                    <ul className="space-y-3">
                                        {[
                                            'Hình ảnh sản phẩm có thể chênh lệch nhẹ so với thực tế do điều kiện ánh sáng và màn hình.',
                                            'IKA không chịu trách nhiệm với thiệt hại phát sinh do nguyên nhân bất khả kháng (thiên tai, dịch bệnh, lỗi hệ thống toàn cầu).',
                                            'Trường hợp sản phẩm hết hàng sau khi đặt, IKA sẽ thông báo và hoàn tiền hoặc đề xuất sản phẩm thay thế.',
                                        ].map((item, i) => (
                                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <span className="text-accent">•</span> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </TermSection>

                            <TermSection num="6" icon={Gavel} title="Luật Áp Dụng & Giải Quyết Tranh Chấp">
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Các điều khoản này được điều chỉnh bởi <strong className="text-foreground">pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam</strong>.
                                </p>
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Mọi tranh chấp phát sinh sẽ được giải quyết theo trình tự:
                                </p>
                                <div className="space-y-3">
                                    {[
                                        { step: '1', title: 'Thương lượng', desc: 'Hai bên trao đổi trực tiếp qua email hoặc điện thoại để tìm giải pháp.' },
                                        { step: '2', title: 'Hòa giải', desc: 'Nếu thương lượng không thành, hai bên sẽ nhờ cơ quan hòa giải có thẩm quyền.' },
                                        { step: '3', title: 'Tòa án', desc: 'Tranh chấp sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền tại Hà Nội.' },
                                    ].map((item) => (
                                        <div key={item.step} className="flex gap-4 items-start">
                                            <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                {item.step}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TermSection>

                            <TermSection num="7" icon={Globe} title="Thay Đổi Điều Khoản">
                                <p className="text-muted-foreground leading-relaxed">
                                    IKA Fashion có quyền cập nhật hoặc thay đổi các điều khoản sử dụng này bất cứ lúc nào. Phiên bản mới nhất sẽ được đăng tải tại trang này kèm ngày cập nhật. Việc bạn tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi đó.
                                </p>
                                <p className="text-muted-foreground leading-relaxed mt-3">
                                    Chúng tôi khuyến khích bạn kiểm tra trang này định kỳ để nắm rõ các quy định mới nhất.
                                </p>
                            </TermSection>
                        </div>

                        {/* Sidebar */}
                        <div>
                            <div className="bg-secondary rounded-xl p-6 sticky top-28 space-y-6">
                                <div>
                                    <h3 className="font-heading font-semibold text-foreground mb-4">Mục Lục</h3>
                                    <nav className="space-y-2">
                                        {[
                                            'Chấp thuận điều khoản',
                                            'Quyền sở hữu trí tuệ',
                                            'Giá & Sản phẩm',
                                            'Hành vi bị cấm',
                                            'Giới hạn trách nhiệm',
                                            'Luật áp dụng',
                                            'Thay đổi điều khoản',
                                        ].map((item, i) => (
                                            <p key={i} className="text-sm text-muted-foreground hover:text-accent transition-colors cursor-pointer">
                                                {i + 1}. {item}
                                            </p>
                                        ))}
                                    </nav>
                                </div>
                                <div className="pt-6 border-t border-border">
                                    <h4 className="font-semibold text-foreground text-sm mb-2">Cần làm rõ điều khoản?</h4>
                                    <p className="text-xs text-muted-foreground mb-3">Liên hệ bộ phận pháp lý của IKA để được giải đáp.</p>
                                    <Link href="/contact" className="block w-full text-center py-2.5 bg-foreground text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity text-sm">
                                        Liên Hệ
                                    </Link>
                                </div>
                                <div className="pt-6 border-t border-border">
                                    <h4 className="font-semibold text-foreground text-sm mb-2">Chính sách liên quan</h4>
                                    <Link href="/chinh-sach-bao-mat" className="block text-sm text-accent hover:underline mb-2">→ Chính sách bảo mật</Link>
                                    <Link href="/chinh-sach-doi-tra" className="block text-sm text-accent hover:underline mb-2">→ Chính sách đổi trả</Link>
                                    <Link href="/chinh-sach-giao-hang" className="block text-sm text-accent hover:underline">→ Chính sách giao hàng</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

function TermSection({ num, icon: Icon, title, children }: { num: string; icon: any; title: string; children: React.ReactNode }) {
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
