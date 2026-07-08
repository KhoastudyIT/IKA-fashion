import React from 'react';
import Link from 'next/link';

// Dữ liệu mẫu (Dummy data)
const blogPosts = [
    {
        id: 'xu-huong-mua-thu-2026',
        title: 'Xu Hướng Thời Trang Mùa Thu 2026',
        category: 'XU HƯỚNG',
        excerpt: 'Khám phá những gam màu ấm áp và chất liệu len lên ngôi trong mùa thu năm nay cùng IKA Fashion.',
        date: '06/07/2026',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'phoi-do-cong-so',
        title: 'Cách Phối Đồ Công Sở Trẻ Trung',
        category: 'MIX & MATCH',
        excerpt: 'Phá vỡ sự nhàm chán của đồ công sở với 5 mẹo mix & match cực kỳ đơn giản nhưng hiệu quả.',
        date: '01/07/2026',
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'bao-quan-ao-thun',
        title: 'Bảo Quản Áo Thun Đúng Cách',
        category: 'MẸO VẶT',
        excerpt: 'Giữ cho những chiếc áo thun yêu thích của bạn luôn như mới với hướng dẫn giặt ủi chuẩn từ chuyên gia.',
        date: '25/06/2026',
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    }
];

export default function BlogPage() {
    return (
        <div className="container mx-auto py-16 px-4 md:px-6 min-h-screen">

            {/* Tiêu đề trang */}
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
                    Tạp Chí Thời Trang
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
                    Cập nhật những xu hướng mới nhất, cẩm nang phối đồ và những câu chuyện truyền cảm hứng từ IKA.
                </p>
            </div>

            {/* Danh sách bài viết */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {blogPosts.map((post) => (
                    <Link href={`/blog/${post.id}`} key={post.id} className="group cursor-pointer flex flex-col h-full">

                        {/* Khung ảnh */}
                        <div className="relative bg-secondary rounded overflow-hidden mb-5 h-72 w-full shrink-0">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>

                        {/* Nội dung bài viết */}
                        <div className="space-y-3 flex-1 flex flex-col">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold tracking-widest text-accent uppercase">
                                    {post.category}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {post.date}
                                </span>
                            </div>

                            <h2 className="text-xl font-heading font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                                {post.title}
                            </h2>

                            <p className="text-sm text-muted-foreground line-clamp-3 font-sans flex-1">
                                {post.excerpt}
                            </p>

                            <div className="pt-2 text-sm font-semibold text-foreground group-hover:text-accent transition-colors inline-flex items-center">
                                Đọc tiếp
                                <span className="ml-2 transform transition-transform group-hover:translate-x-1">→</span>
                            </div>
                        </div>

                    </Link>
                ))}
            </div>

        </div>
    );
}