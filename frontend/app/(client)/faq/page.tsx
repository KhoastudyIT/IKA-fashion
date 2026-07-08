import React from 'react';

const faqs = [
    {
        question: 'IKA Fashion có giao hàng toàn quốc không?',
        answer: 'Có, chúng tôi giao hàng toàn quốc. Thời gian dự kiến từ 2-5 ngày tùy khu vực.',
    },
    {
        question: 'Tôi có thể kiểm tra hàng trước khi thanh toán không?',
        answer: 'Chắc chắn. IKA Fashion luôn khuyến khích khách hàng kiểm tra kỹ sản phẩm trước khi thanh toán.',
    },
    {
        question: 'Nếu nhận hàng không vừa size, tôi phải làm sao?',
        answer: 'Bạn có thể yêu cầu đổi size trong vòng 7 ngày kể từ khi nhận hàng với điều kiện giữ nguyên tem mác.',
    },
    {
        question: 'Phí vận chuyển được tính như thế nào?',
        answer: 'Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500.000 VNĐ. Đơn hàng dưới mức này phí đồng giá là 30.000 VNĐ.',
    },
];

export default function FAQPage() {
    return (
        <div className="container mx-auto py-16 px-4 md:px-6 min-h-screen">
            <div className="max-w-3xl mx-auto">

                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                        Câu Hỏi Thường Gặp
                    </h1>
                    <p className="text-muted-foreground font-sans">
                        Giải đáp nhanh chóng những thắc mắc của bạn về sản phẩm và dịch vụ
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-card p-6 rounded-lg border border-border hover:border-accent/50 transition-colors duration-300"
                        >
                            <h2 className="text-lg font-heading font-semibold text-foreground mb-3 flex items-start gap-3">
                                <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2"></span>
                                {faq.question}
                            </h2>
                            <p className="text-muted-foreground text-sm leading-relaxed pl-5">
                                {faq.answer}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
