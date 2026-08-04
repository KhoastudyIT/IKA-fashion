import React from 'react';
import Link from 'next/link';
import { blogPosts } from './posts';

export default function BlogPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">

            {/* Tiêu đề trang */}
            <div className="text-center mb-16 space-y-4">
                <p className="text-xs font-sans tracking-[0.3em] text-accent uppercase">Tạp Chí</p>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                    Tạp Chí Thời Trang
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
                    Cập nhật những xu hướng mới nhất, cẩm nang phối đồ và những câu chuyện truyền cảm hứng từ IKA.
                </p>
            </div>

            {/* Bài viết nổi bật (bài đầu tiên) */}
            {blogPosts.length > 0 && (
                <Link href={`/blog/${blogPosts[0].id}`} className="group block mb-16">
                    <div className="relative rounded-xl overflow-hidden">
                        <div className="aspect-[21/9] bg-secondary overflow-hidden">
                            <img
                                src={blogPosts[0].image}
                                alt={blogPosts[0].title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-[11px] font-semibold tracking-widest text-accent uppercase">
                                    {blogPosts[0].category}
                                </span>
                                <span className="text-xs text-white/60">{blogPosts[0].date}</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-white mb-3 group-hover:text-accent transition-colors">
                                {blogPosts[0].title}
                            </h2>
                            <p className="text-sm sm:text-base text-white/70 font-light max-w-2xl line-clamp-2">
                                {blogPosts[0].excerpt}
                            </p>
                        </div>
                    </div>
                </Link>
            )}

            {/* Các bài viết còn lại */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                {blogPosts.slice(1).map((post) => (
                    <Link href={`/blog/${post.id}`} key={post.id} className="group cursor-pointer flex flex-col h-full">

                        {/* Khung ảnh */}
                        <div className="relative bg-secondary rounded-xl overflow-hidden mb-5 aspect-[16/10] w-full shrink-0">
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