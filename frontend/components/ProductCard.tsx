'use client'

import Link from 'next/link'
import { ShoppingBag, Tag } from 'lucide-react'
import { ApiProduct } from '@/api'

interface ProductCardProps {
  product: ApiProduct
  onAddToCart?: (product: ApiProduct) => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const outOfStock = product.stock <= 0
  const hasDiscount = product.discount > 0

  return (
    <Link href={`/products/${product.handle}`}>
      <div className="group cursor-pointer">
        {/* Image */}
        <div className="relative bg-secondary rounded overflow-hidden mb-4 aspect-square">
          <img
            src={product.img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badge giảm giá */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              <Tag size={11} />
              -{product.discount}%
            </div>
          )}

          {/* Overlay action */}
          {onAddToCart && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onAddToCart(product)
                }}
                disabled={outOfStock}
                className="p-3 bg-white text-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Thêm vào giỏ"
              >
                <ShoppingBag size={20} />
              </button>
            </div>
          )}

          {outOfStock && (
            <div className="absolute top-2 right-2 bg-destructive text-white px-3 py-1 text-xs font-semibold rounded">
              Hết hàng
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1">
          <h3 className="text-sm font-heading font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{product.type}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                {product.price.toLocaleString('vi-VN')} đ
              </span>
              {hasDiscount && product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {product.originalPrice.toLocaleString('vi-VN')} đ
                </span>
              )}
            </div>
            <span className="text-xs text-accent font-medium">★ {product.rating}</span>
          </div>
          {/* Đã bán */}
          <p className="text-xs text-muted-foreground">Đã bán {product.sold.toLocaleString('vi-VN')}</p>
        </div>
      </div>
    </Link>
  )
}
