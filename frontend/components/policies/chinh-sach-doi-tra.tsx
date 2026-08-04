import React from 'react';
import Link from 'next/link';
import { RefreshCcw, PackageCheck, AlertTriangle, Clock, Phone, ShieldCheck } from 'lucide-react';

export default function ReturnPolicyPageContent() {
    return (
        <>

            {/* Highlights */}
            <section className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                        {[
                            { icon: Clock, title: '7 Ngày Đổi Trả', desc: 'Kể từ ngày nhận hàng' },
                            { icon: RefreshCcw, title: 'Miễn Phí', desc: 'Không mất phí đổi trả' },
                            { icon: PackageCheck, title: 'Hoàn Tiền Nhanh', desc: 'Trong 3-5 ngày làm việc' },
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
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-10">
                            <div>
                                <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold">1</span>
                                    Điều Kiện Đổi Trả
                                </h2>
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    IKA Fashion chấp nhận đổi/trả sản phẩm trong vòng <strong className="text-foreground">7 ngày</strong> kể từ ngày nhận hàng với các điều kiện sau:
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        'Sản phẩm còn nguyên tem mác, chưa qua sử dụng, giặt ủi hay chỉnh sửa.',
                                        'Sản phẩm không bị dơ bẩn, hư hỏng bởi những tác nhân bên ngoài sau khi mua.',
                                        'Có đầy đủ hóa đơn mua hàng hoặc thông tin số điện thoại đặt hàng.',
                                        'Sản phẩm được đóng gói cẩn thận khi gửi trả về IKA.',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm">
                                            <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs mt-0.5">✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold">2</span>
                                    Các Trường Hợp Được Đổi Trả
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        { title: 'Sai size', desc: 'Sản phẩm nhận được không đúng kích cỡ đã đặt hàng.' },
                                        { title: 'Sai mẫu/màu', desc: 'Mẫu mã hoặc màu sắc khác với đơn hàng đã xác nhận.' },
                                        { title: 'Lỗi sản xuất', desc: 'Sản phẩm bị lỗi đường may, phai màu hoặc hư hỏng sẵn.' },
                                        { title: 'Không vừa ý', desc: 'Sản phẩm không phù hợp với kỳ vọng (trong 7 ngày, còn nguyên).' },
                                    ].map((item) => (
                                        <div key={item.title} className="bg-secondary rounded-xl p-5">
                                            <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold">3</span>
                                    Sản Phẩm Không Áp Dụng
                                </h2>
                                <div className="bg-destructive/5 border border-destructive/15 rounded-xl p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <AlertTriangle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-foreground font-medium">Nhằm đảm bảo vệ sinh và chất lượng, chúng tôi không hỗ trợ đổi trả đối với:</p>
                                    </div>
                                    <ul className="space-y-2 pl-8">
                                        {[
                                            'Đồ lót, tất, phụ kiện cá nhân.',
                                            'Sản phẩm mua trong chương trình Flash Sale hoặc giảm giá từ 50% trở lên.',
                                            'Sản phẩm đã qua sử dụng, giặt ủi hoặc không còn nguyên tem mác.',
                                            'Sản phẩm đặt may riêng theo yêu cầu.',
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                                                <span className="text-destructive">✕</span> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold">4</span>
                                    Quy Trình Đổi Trả
                                </h2>
                                <div className="space-y-4">
                                    {[
                                        { step: 'Bước 1', title: 'Liên hệ CSKH', desc: 'Gọi hotline 0123 456 789 hoặc email hello@ikafashion.com, cung cấp mã đơn hàng và lý do đổi trả.' },
                                        { step: 'Bước 2', title: 'Gửi sản phẩm', desc: 'Đóng gói sản phẩm cẩn thận và gửi về kho IKA theo hướng dẫn. Phí ship do IKA chịu.' },
                                        { step: 'Bước 3', title: 'Kiểm tra & xử lý', desc: 'Đội ngũ QC kiểm tra sản phẩm trong 1-2 ngày làm việc và thông báo kết quả.' },
                                        { step: 'Bước 4', title: 'Hoàn tất', desc: 'Đổi sản phẩm mới hoặc hoàn tiền trong 3-5 ngày làm việc qua phương thức thanh toán ban đầu.' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                    {i + 1}
                                                </div>
                                                {i < 3 && <div className="w-px h-full bg-border mt-2" />}
                                            </div>
                                            <div className="pb-6">
                                                <p className="text-xs text-accent font-medium uppercase tracking-wider">{item.step}</p>
                                                <h3 className="font-semibold text-foreground mt-1">{item.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-secondary rounded-xl p-6 sticky top-28">
                                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <Phone size={18} className="text-accent" /> Cần Hỗ Trợ?
                                </h3>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Hotline</p>
                                        <p className="font-semibold text-foreground">0123 456 789</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Email</p>
                                        <p className="font-semibold text-foreground">hello@ikafashion.com</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Giờ làm việc</p>
                                        <p className="font-semibold text-foreground">T2-T6: 9:00-18:00</p>
                                    </div>
                                    <Link href="/contact" className="block w-full text-center py-3 bg-foreground text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity text-sm mt-4">
                                        Liên Hệ Ngay
                                    </Link>
                                </div>

                                <div className="mt-6 pt-6 border-t border-border">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck size={18} className="text-accent flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            IKA cam kết hoàn tiền <strong className="text-foreground">200%</strong> nếu phát hiện sản phẩm không chính hãng.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}