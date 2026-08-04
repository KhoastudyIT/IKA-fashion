'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ruler, Phone } from 'lucide-react';

const sizeGuides = [
    {
        id: 'ao-thun-nam',
        title: 'Áo Thun Nam',
        icon: '👕',
        headers: ['THÔNG SỐ', 'S', 'M', 'L', 'XL', 'XXL'],
        rows: [
            { label: 'Cân nặng (kg)', values: ['45-50', '50-60', '60-70', '70-80', '80-90'] },
            { label: 'Dài áo (cm)', values: ['66', '68', '70', '72', '74'] },
            { label: 'Ngực (cm)', values: ['45', '47', '51', '54', '57'] },
            { label: 'Vai (cm)', values: ['39', '40', '44', '45', '47'] },
        ],
        tips: ['Nếu bạn giữa 2 size, nên chọn size lớn hơn cho thoải mái.', 'Form Regular phù hợp phần đông, form Slim dành cho người thích ôm dáng.'],
    },
    {
        id: 'ao-polo-nam',
        title: 'Áo Polo & Sơ Mi Nam',
        icon: '👔',
        headers: ['THÔNG SỐ', 'S', 'M', 'L', 'XL', 'XXL'],
        rows: [
            { label: 'Cân nặng (kg)', values: ['45-50', '50-60', '60-70', '70-80', '80-90'] },
            { label: 'Dài áo (cm)', values: ['70', '72', '74', '76', '78'] },
            { label: 'Ngực (cm)', values: ['92', '96', '100', '104', '108'] },
            { label: 'Vai (cm)', values: ['40', '42', '44', '46', '48'] },
        ],
        tips: ['Polo nên vừa vặn ở vai, không rộng quá vai 1cm.', 'Sơ mi đi làm nên chọn vừa form, không quá ôm để thoải mái ngồi lâu.'],
    },
    {
        id: 'ao-vest-nam',
        title: 'Áo Vest Nam',
        icon: '🧥',
        headers: ['THÔNG SỐ', 'S', 'M', 'L', 'XL', 'XXL'],
        rows: [
            { label: 'Cân nặng (kg)', values: ['50-55', '56-62', '63-69', '70-76', '77-83'] },
            { label: 'Dài áo (cm)', values: ['68', '70', '72', '74', '76'] },
            { label: 'Ngực (cm)', values: ['88', '92', '96', '100', '104'] },
            { label: 'Eo (cm)', values: ['80', '84', '88', '92', '96'] },
            { label: 'Vai (cm)', values: ['41', '43', '45', '47', '49'] },
        ],
        tips: ['Vest đóng khuy phải thoải mái, không bị kéo căng ở ngực.', 'Tay vest nên dài vừa đến cổ tay, để lộ khoảng 1cm tay áo sơ mi.'],
    },
    {
        id: 'quan-nam',
        title: 'Quần Nam',
        icon: '👖',
        headers: ['THÔNG SỐ', '29', '30', '31', '32', '33'],
        rows: [
            { label: 'Cân nặng (kg)', values: ['50-55', '55-60', '60-65', '65-70', '70-75'] },
            { label: 'Vòng bụng (cm)', values: ['74', '76', '79', '81', '84'] },
            { label: 'Vòng mông (cm)', values: ['88', '90', '92', '94', '96'] },
            { label: 'Dài quần (cm)', values: ['96', '98', '100', '102', '104'] },
        ],
        tips: ['Quần Slim Fit tôn dáng hơn nhưng cần chọn đúng vòng đùi.', 'Quần âu công sở nên dài vừa phủ giày, không kéo lê dưới đất.'],
    },
];

const measurementGuide = [
    { part: 'Vòng ngực', how: 'Đo vòng quanh phần ngực lớn nhất, giữ thước dây ngang và không quá chặt.' },
    { part: 'Vai', how: 'Đo từ mép vai trái sang mép vai phải, đi ngang qua phía sau lưng.' },
    { part: 'Dài áo', how: 'Đo từ điểm cao nhất của vai đến mép dưới áo.' },
    { part: 'Vòng eo', how: 'Đo vòng quanh eo tại vị trí nhỏ nhất (thường trên rốn 2-3cm).' },
    { part: 'Vòng mông', how: 'Đo vòng quanh phần mông lớn nhất, giữ thước dây song song mặt đất.' },
    { part: 'Dài quần', how: 'Đo từ eo xuống đến mắt cá chân (hoặc mép dưới quần mong muốn).' },
];

export default function SizeGuidePageContent() {
    const [activeTab, setActiveTab] = useState(sizeGuides[0].id);
    const activeGuide = sizeGuides.find((g) => g.id === activeTab)!;

    return (
        <>

            {/* Tabs */}
            <section className="border-b border-border bg-card sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex overflow-x-auto gap-1 py-2 no-scrollbar">
                        {sizeGuides.map((g) => (
                            <button
                                key={g.id}
                                onClick={() => setActiveTab(g.id)}
                                className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                    activeTab === g.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary'
                                }`}
                            >
                                {g.icon} {g.title}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Size Table */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
                            <h2 className="text-2xl font-heading font-semibold text-foreground mb-6 flex items-center gap-2">
                                <span className="text-2xl">{activeGuide.icon}</span> {activeGuide.title}
                            </h2>

                            <div className="overflow-x-auto mb-8">
                                <table className="w-full text-center border-collapse text-sm">
                                    <thead>
                                        <tr>
                                            {activeGuide.headers.map((h, i) => (
                                                <th key={i} className={`border border-border px-4 py-3.5 font-semibold whitespace-nowrap ${i === 0 ? 'bg-foreground text-primary-foreground text-left' : 'bg-accent/10 text-foreground'}`}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeGuide.rows.map((row, ri) => (
                                            <tr key={ri} className={ri % 2 === 0 ? 'bg-background' : 'bg-secondary/50'}>
                                                <td className="border border-border px-4 py-3.5 font-medium text-foreground whitespace-nowrap text-left">{row.label}</td>
                                                {row.values.map((val, vi) => (
                                                    <td key={vi} className="border border-border px-4 py-3.5 text-muted-foreground">{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tips */}
                            <div className="bg-accent/5 border border-accent/20 rounded-xl p-6">
                                <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                                    💡 Mẹo chọn size {activeGuide.title}
                                </h3>
                                <ul className="space-y-2">
                                    {activeGuide.tips.map((tip, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="text-accent flex-shrink-0">→</span> {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Sidebar: Cách đo */}
                        <div>
                            <div className="bg-secondary rounded-xl p-6 sticky top-20">
                                <h3 className="font-heading font-semibold text-foreground mb-5 flex items-center gap-2">
                                    <Ruler size={18} className="text-accent" /> Cách Đo Cơ Thể
                                </h3>
                                <div className="space-y-4">
                                    {measurementGuide.map((m) => (
                                        <div key={m.part}>
                                            <p className="text-sm font-semibold text-foreground">{m.part}</p>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{m.how}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t border-border">
                                    <h4 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                                        <Phone size={14} className="text-accent" /> Cần tư vấn size?
                                    </h4>
                                    <p className="text-xs text-muted-foreground mb-3">Gọi hotline để được tư vấn miễn phí dựa trên chiều cao và cân nặng.</p>
                                    <Link href="/contact" className="block w-full text-center py-2.5 bg-foreground text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity text-sm">
                                        Liên Hệ Tư Vấn
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
