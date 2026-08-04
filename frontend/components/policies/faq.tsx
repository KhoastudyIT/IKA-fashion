'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, MessageSquare } from 'lucide-react';

const faqCategories = [
    {
        name: 'Đơn Hàng & Thanh Toán',
        icon: '🛒',
        items: [
            { q: 'Tôi có thể kiểm tra hàng trước khi thanh toán không?', a: 'Chắc chắn. IKA Fashion luôn khuyến khích khách hàng kiểm tra kỹ sản phẩm trước khi thanh toán. Bạn có thể kiểm tra size, màu sắc, chất lượng đường may trước khi nhận.' },
            { q: 'IKA hỗ trợ những hình thức thanh toán nào?', a: 'Chúng tôi hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, và ví điện tử (MoMo, ZaloPay, VNPay). Tất cả giao dịch đều được bảo mật tuyệt đối.' },
            { q: 'Làm sao để theo dõi đơn hàng?', a: 'Sau khi đặt hàng, bạn sẽ nhận được mã vận đơn qua SMS/email. Bạn có thể tra cứu trạng thái đơn hàng tại mục "Đơn hàng của tôi" trong tài khoản hoặc liên hệ hotline.' },
            { q: 'Tôi có thể hủy đơn hàng đã đặt không?', a: 'Bạn có thể hủy đơn hàng trước khi đơn được xác nhận và chuyển cho đơn vị vận chuyển. Nếu đơn đã được giao cho shipper, vui lòng liên hệ CSKH để được hỗ trợ.' },
        ],
    },
    {
        name: 'Giao Hàng',
        icon: '🚚',
        items: [
            { q: 'IKA Fashion có giao hàng toàn quốc không?', a: 'Có, chúng tôi giao hàng đến tất cả 63 tỉnh thành trên toàn quốc. Nội thành HN/HCM giao trong 1-2 ngày, các tỉnh khác 3-5 ngày làm việc.' },
            { q: 'Phí vận chuyển được tính như thế nào?', a: 'Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500.000 VNĐ. Đơn hàng dưới mức này phí đồng giá là 30.000 VNĐ. Riêng khu vực hải đảo phí 50.000 VNĐ.' },
            { q: 'Nếu tôi không có nhà khi shipper giao hàng?', a: 'Shipper sẽ liên hệ bạn qua số điện thoại trước khi giao. Nếu không liên lạc được, đơn hàng sẽ được giao lại vào ngày làm việc tiếp theo, tối đa 3 lần giao.' },
        ],
    },
    {
        name: 'Đổi Trả & Bảo Hành',
        icon: '🔄',
        items: [
            { q: 'Nếu nhận hàng không vừa size, tôi phải làm sao?', a: 'Bạn có thể yêu cầu đổi size trong vòng 7 ngày kể từ khi nhận hàng với điều kiện giữ nguyên tem mác, chưa qua sử dụng. Phí ship đổi do IKA chịu hoàn toàn.' },
            { q: 'Sản phẩm bị lỗi sản xuất thì xử lý thế nào?', a: 'Nếu sản phẩm bị lỗi đường may, phai màu hoặc hư hỏng do nhà sản xuất, IKA sẽ đổi mới 100% hoặc hoàn tiền đầy đủ. Vui lòng chụp ảnh lỗi và liên hệ CSKH.' },
            { q: 'Tôi có thể đổi sang mẫu/màu khác không?', a: 'Hoàn toàn được. Trong 7 ngày sau khi nhận hàng, bạn có thể đổi sang bất kỳ mẫu, màu, size nào khác. Nếu sản phẩm mới có giá cao hơn, bạn chỉ cần trả phần chênh lệch.' },
        ],
    },
    {
        name: 'Sản Phẩm & Size',
        icon: '👕',
        items: [
            { q: 'Làm sao để chọn đúng size?', a: 'Mỗi sản phẩm đều có bảng hướng dẫn chọn size chi tiết. Bạn cũng có thể tham khảo trang "Hướng dẫn chọn size" hoặc liên hệ hotline để được tư vấn dựa trên chiều cao và cân nặng.' },
            { q: 'Công nghệ AirDry™ là gì?', a: 'AirDry™ là công nghệ vải độc quyền của IKA giúp thoát ẩm nhanh gấp 3 lần vải thông thường. Cấu trúc sợi vải đặc biệt giúp mồ hôi bay hơi nhanh, giữ bạn luôn khô thoáng.' },
            { q: 'Sản phẩm IKA có giặt máy được không?', a: 'Có. Tất cả sản phẩm IKA đều có thể giặt máy ở chế độ nhẹ, nước lạnh dưới 30°C. Nên lộn trái trước khi giặt và tránh dùng thuốc tẩy để bảo quản tốt nhất.' },
        ],
    },
    {
        name: 'Tài Khoản & Ưu Đãi',
        icon: '🎁',
        items: [
            { q: 'Tạo tài khoản có lợi ích gì?', a: 'Tài khoản IKA giúp bạn theo dõi đơn hàng, lưu sản phẩm yêu thích, nhận thông báo ưu đãi sớm, và tích lũy điểm thưởng cho các lần mua sau.' },
            { q: 'Mã giảm giá áp dụng như thế nào?', a: 'Tại bước thanh toán, nhập mã giảm giá vào ô "Mã khuyến mãi" và nhấn "Áp dụng". Hệ thống sẽ tự động tính toán số tiền được giảm. Mỗi đơn hàng chỉ áp dụng được 1 mã.' },
        ],
    },
];

export default function FAQPageContent() {
    const [openIndex, setOpenIndex] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const toggleItem = (key: string) => setOpenIndex(openIndex === key ? null : key);

    const filteredCategories = faqCategories
        .map((cat) => ({
            ...cat,
            items: cat.items.filter(
                (item) =>
                    (!searchQuery ||
                        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.a.toLowerCase().includes(searchQuery.toLowerCase())) &&
                    (!activeCategory || activeCategory === cat.name)
            ),
        }))
        .filter((cat) => cat.items.length > 0);

    return (
        <>

            {/* Category Tabs */}
            <section className="border-b border-border bg-card sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex overflow-x-auto gap-1 py-2 no-scrollbar">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                                !activeCategory ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary'
                            }`}
                        >
                            Tất cả
                        </button>
                        {faqCategories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                                className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                                    activeCategory === cat.name ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary'
                                }`}
                            >
                                {cat.icon} {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Content */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    {filteredCategories.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-muted-foreground text-lg mb-2">Không tìm thấy kết quả</p>
                            <p className="text-sm text-muted-foreground">Thử tìm kiếm với từ khóa khác hoặc liên hệ CSKH</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {filteredCategories.map((cat) => (
                                <div key={cat.name}>
                                    <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <span className="text-xl">{cat.icon}</span> {cat.name}
                                    </h2>
                                    <div className="space-y-3">
                                        {cat.items.map((item, i) => {
                                            const key = `${cat.name}-${i}`;
                                            const isOpen = openIndex === key;
                                            return (
                                                <div key={key} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                                                    <button
                                                        onClick={() => toggleItem(key)}
                                                        className="w-full flex items-center justify-between px-6 py-5 text-left"
                                                    >
                                                        <span className="font-semibold text-foreground text-sm pr-4">{item.q}</span>
                                                        <ChevronDown size={18} className={`text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isOpen ? '300px' : '0' }}>
                                                        <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CTA */}
                    <div className="mt-16 bg-secondary rounded-2xl p-8 sm:p-12 text-center">
                        <MessageSquare size={32} className="text-accent mx-auto mb-4" />
                        <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">Không tìm thấy câu trả lời?</h2>
                        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                            Đội ngũ CSKH của IKA luôn sẵn sàng giải đáp mọi thắc mắc của bạn qua điện thoại, email hoặc chat trực tuyến.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/contact" className="px-6 py-3 bg-foreground text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity text-sm">
                                Liên Hệ CSKH
                            </Link>
                            <a href="tel:0123456789" className="px-6 py-3 border border-foreground text-foreground font-medium rounded-lg hover:bg-foreground hover:text-primary-foreground transition-colors text-sm">
                                Gọi: 0123 456 789
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
