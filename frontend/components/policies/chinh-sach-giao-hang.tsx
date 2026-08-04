import React from 'react';
import Link from 'next/link';
import { Truck, Package, MapPin, Clock, Phone, ShieldCheck, CreditCard } from 'lucide-react';

export default function ShippingPolicyPageContent() {
    return (
        <>

            {/* Highlights */}
            <section className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
                        {[
                            { icon: Truck, title: 'Giao Toàn Quốc', desc: '63 tỉnh thành' },
                            { icon: Clock, title: '1-5 Ngày', desc: 'Tùy khu vực' },
                            { icon: Package, title: 'Miễn Phí Ship', desc: 'Đơn từ 500.000đ' },
                            { icon: ShieldCheck, title: 'Kiểm Tra Hàng', desc: 'Trước khi thanh toán' },
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
                            {/* Thời gian giao hàng */}
                            <div>
                                <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold">1</span>
                                    Thời Gian Giao Hàng
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-secondary">
                                                <th className="text-left px-4 py-3 font-semibold text-foreground border border-border">Khu vực</th>
                                                <th className="text-left px-4 py-3 font-semibold text-foreground border border-border">Thời gian dự kiến</th>
                                                <th className="text-left px-4 py-3 font-semibold text-foreground border border-border">Phí ship</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { area: 'Nội thành Hà Nội', time: '1-2 ngày làm việc', fee: 'Miễn phí (đơn ≥ 500K)' },
                                                { area: 'Nội thành TP.HCM', time: '1-2 ngày làm việc', fee: 'Miễn phí (đơn ≥ 500K)' },
                                                { area: 'Ngoại thành HN/HCM', time: '2-3 ngày làm việc', fee: 'Miễn phí (đơn ≥ 500K)' },
                                                { area: 'Miền Bắc / Miền Trung', time: '3-4 ngày làm việc', fee: '30.000đ (đơn < 500K)' },
                                                { area: 'Miền Nam / Tây Nguyên', time: '3-5 ngày làm việc', fee: '30.000đ (đơn < 500K)' },
                                                { area: 'Hải đảo / vùng sâu', time: '5-7 ngày làm việc', fee: '50.000đ' },
                                            ].map((row, i) => (
                                                <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-secondary/50'}>
                                                    <td className="px-4 py-3 border border-border text-foreground font-medium">{row.area}</td>
                                                    <td className="px-4 py-3 border border-border text-muted-foreground">{row.time}</td>
                                                    <td className="px-4 py-3 border border-border text-accent font-medium">{row.fee}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Phí vận chuyển */}
                            <div>
                                <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold">2</span>
                                    Chi Tiết Phí Vận Chuyển
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 text-center">
                                        <p className="text-3xl font-heading font-bold text-accent mb-1">MIỄN PHÍ</p>
                                        <p className="text-sm text-muted-foreground">Đơn hàng từ <strong className="text-foreground">500.000đ</strong></p>
                                        <p className="text-xs text-muted-foreground mt-2">Áp dụng toàn quốc (trừ hải đảo)</p>
                                    </div>
                                    <div className="bg-secondary rounded-xl p-6 text-center">
                                        <p className="text-3xl font-heading font-bold text-foreground mb-1">30.000đ</p>
                                        <p className="text-sm text-muted-foreground">Đơn hàng dưới <strong className="text-foreground">500.000đ</strong></p>
                                        <p className="text-xs text-muted-foreground mt-2">Phí đồng giá toàn quốc</p>
                                    </div>
                                </div>
                            </div>

                            {/* Kiểm tra hàng */}
                            <div>
                                <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold">3</span>
                                    Kiểm Tra Hàng Khi Nhận
                                </h2>
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    IKA Fashion luôn khuyến khích khách hàng kiểm tra kỹ sản phẩm trước khi thanh toán. Khi nhận hàng, bạn có quyền:
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        'Kiểm tra số lượng sản phẩm có đúng với đơn hàng.',
                                        'Kiểm tra kích cỡ, màu sắc có đúng với đơn đặt.',
                                        'Kiểm tra tình trạng sản phẩm (không bị lỗi, rách, bẩn).',
                                        'Từ chối nhận hàng nếu sản phẩm không đúng hoặc bị hư hỏng.',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm">
                                            <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs mt-0.5">✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Đối tác vận chuyển */}
                            <div>
                                <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold">4</span>
                                    Đối Tác Vận Chuyển
                                </h2>
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    IKA Fashion hợp tác với các đơn vị vận chuyển uy tín hàng đầu Việt Nam để đảm bảo hàng hóa đến tay bạn nhanh chóng và an toàn:
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                    {['GHN Express', 'GHTK', 'J&T Express'].map((partner) => (
                                        <div key={partner} className="bg-secondary rounded-xl p-4 text-center">
                                            <p className="font-semibold text-foreground text-sm">{partner}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Lưu ý */}
                            <div>
                                <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold">5</span>
                                    Lưu Ý Quan Trọng
                                </h2>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-3">
                                    {[
                                        'Thời gian giao hàng có thể thay đổi vào các dịp lễ, Tết hoặc sự kiện sale lớn.',
                                        'Vui lòng cung cấp số điện thoại chính xác để shipper liên hệ khi giao.',
                                        'Nếu không có người nhận, đơn hàng sẽ được giao lại vào ngày hôm sau.',
                                        'Không mặc thử hoặc làm bẩn sản phẩm trong quá trình kiểm tra để đảm bảo quyền lợi đổi trả.',
                                    ].map((note, i) => (
                                        <p key={i} className="text-sm text-amber-800 flex items-start gap-2">
                                            <span className="text-amber-500 flex-shrink-0">⚠</span> {note}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-secondary rounded-xl p-6 sticky top-28">
                                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <Phone size={18} className="text-accent" /> Hỗ Trợ Giao Hàng
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
                                        <p className="text-muted-foreground">Giờ hỗ trợ</p>
                                        <p className="font-semibold text-foreground">T2-T6: 9:00-18:00</p>
                                        <p className="font-semibold text-foreground">T7: 10:00-16:00</p>
                                    </div>
                                    <Link href="/contact" className="block w-full text-center py-3 bg-foreground text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity text-sm mt-4">
                                        Liên Hệ Ngay
                                    </Link>
                                </div>

                                <div className="mt-6 pt-6 border-t border-border space-y-4">
                                    <h4 className="font-semibold text-foreground text-sm">Chính sách liên quan</h4>
                                    <Link href="/chinh-sach-doi-tra" className="block text-sm text-accent hover:underline">→ Chính sách đổi trả</Link>
                                    <Link href="/huong-dan-size" className="block text-sm text-accent hover:underline">→ Hướng dẫn chọn size</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
