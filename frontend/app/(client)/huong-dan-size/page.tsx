'use client';

import React, { useState } from 'react';

const sizeGuides = [
    {
        id: 'ao-thun-nam',
        title: 'BẢNG SỐ ĐO SIZE ÁO THUN NAM',
        headers: ['THÔNG SỐ', 'S', 'M', 'L', 'XL', 'XXL'],
        rows: [
            { label: 'CÂN NẶNG (KG)', values: ['45-50', '50-60', '60-70', '70-80', '80-90'] },
            { label: 'DÀI ÁO (CM)', values: ['66', '68', '70', '72', '74'] },
            { label: 'NGỰC (CM)', values: ['45', '47', '51', '54', '57'] },
            { label: 'VAI (CM)', values: ['39', '40', '44', '45', '47'] },
        ],
        image: 'https://images.unsplash.com/photo-1618517351616-38fb9c52e0fc?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'ao-so-mi-nam',
        title: 'BẢNG SỐ ĐO SIZE ÁO SƠ MI NAM',
        headers: ['THÔNG SỐ', 'S', 'M', 'L', 'XL', 'XXL'],
        rows: [
            { label: 'CÂN NẶNG (KG)', values: ['45-50', '50-60', '60-70', '70-80', '80-90'] },
            { label: 'DÀI ÁO (CM)', values: ['70', '72', '74', '76', '78'] },
            { label: 'NGỰC (CM)', values: ['92', '96', '100', '104', '108'] },
            { label: 'VAI (CM)', values: ['40', '42', '44', '46', '48'] },
        ],
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'ao-vest-nam',
        title: 'BẢNG SỐ ĐO SIZE ÁO VEST NAM',
        headers: ['THÔNG SỐ', 'S', 'M', 'L', 'XL', 'XXL'],
        rows: [
            { label: 'CÂN NẶNG (KG)', values: ['50-55', '56-62', '63-69', '70-76', '77-83'] },
            { label: 'DÀI ÁO (CM)', values: ['68', '70', '72', '74', '76'] },
            { label: 'NGỰC (CM)', values: ['88', '92', '96', '100', '104'] },
            { label: 'EO (CM)', values: ['80', '84', '88', '92', '96'] },
            { label: 'VAI (CM)', values: ['41', '43', '45', '47', '49'] },
        ],
        image: '/image/products/ao-vest-nam-1.png',
    },
    {
        id: 'quan-nam',
        title: 'BẢNG SỐ ĐO SIZE QUẦN',
        headers: ['THÔNG SỐ', '29', '30', '31', '32', '33'],
        rows: [
            { label: 'CÂN NẶNG (KG)', values: ['50-55', '55-60', '60-65', '65-70', '70-75'] },
            { label: 'VÒNG BỤNG (CM)', values: ['74', '76', '79', '81', '84'] },
            { label: 'VÒNG MÔNG (CM)', values: ['88', '90', '92', '94', '96'] },
            { label: 'DÀI QUẦN (CM)', values: ['96', '98', '100', '102', '104'] },
        ],
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
    },
];

export default function SizeGuidePage() {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggle = (id: string) => setOpenId(openId === id ? null : id);

    return (
        <div className="container mx-auto py-16 px-4 md:px-6 min-h-screen">
            <div className="max-w-4xl mx-auto bg-card p-6 md:p-12 rounded-lg shadow-sm border border-border">

                <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground text-center mb-10 uppercase tracking-wide">
                    BẢNG SIZE CHI TIẾT SẢN PHẨM
                </h1>

                <div className="border-t border-border">
                    {sizeGuides.map((guide) => {
                        const isOpen = openId === guide.id;
                        return (
                            <div key={guide.id} className="border-b border-border">

                                {/* ── Trigger ── */}
                                <button
                                    onClick={() => toggle(guide.id)}
                                    className="w-full flex justify-between items-center py-5 text-left focus:outline-none group"
                                >
                                    <span className={`text-sm md:text-base font-semibold uppercase transition-colors duration-200 ${isOpen ? 'text-accent' : 'text-foreground group-hover:text-accent'}`}>
                                        {guide.title}
                                    </span>
                                    <span className={`text-xl transition-colors duration-200 ${isOpen ? 'text-accent' : 'text-foreground group-hover:text-accent'}`}>
                                        {isOpen ? '—' : '+'}
                                    </span>
                                </button>

                                {isOpen && (
                                    <div className="pb-8 px-2 md:px-8 mt-4">

                                        <h2 className="text-lg md:text-xl font-heading font-semibold text-center mb-6 text-foreground uppercase">
                                            {guide.title}
                                        </h2>

                                        <div className="overflow-x-auto mb-8">
                                            <table className="w-full text-center border-collapse text-sm">
                                                <thead>
                                                    <tr>
                                                        {guide.headers.map((h, i) => (
                                                            <th
                                                                key={i}
                                                                className="border border-border px-4 py-3 bg-muted font-semibold text-foreground whitespace-nowrap"
                                                            >
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {guide.rows.map((row, ri) => (
                                                        <tr key={ri} className={ri % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                                                            <td className="border border-border px-4 py-3 font-medium text-foreground whitespace-nowrap text-left">
                                                                {row.label}
                                                            </td>
                                                            {row.values.map((val, vi) => (
                                                                <td key={vi} className="border border-border px-4 py-3 text-muted-foreground">
                                                                    {val}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex justify-center">
                                            <img
                                                src={guide.image}
                                                alt={guide.title}
                                                className="w-full max-w-xs rounded-md object-cover shadow-sm border border-border"
                                            />
                                        </div>

                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}
