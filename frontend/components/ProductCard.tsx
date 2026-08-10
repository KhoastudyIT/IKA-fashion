'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'

export interface ProductCardProps {
  product: any
  badge?: string
  wished?: boolean
  wishlistBusy?: boolean
  onWishlistToggle?: (product: any) => void
}

export default function ProductCard({
  product,
  badge,
  wished = false,
  wishlistBusy = false,
  onWishlistToggle,
}: ProductCardProps) {
  const price = product.price ?? product.newPrice ?? 0
  const originalPrice = product.originalPrice ?? product.oldPrice ?? 0
  const discount = product.discount ?? 0
  const img = product.img ?? product.image ?? ''
  const sold = product.sold ?? product.soldCount ?? 0
  const handle = product.handle ?? product.href?.replace('/products/', '') ?? ''
  const href = `/products/${handle}`

  return (
    <Link href={href} className="block h-full">
      <div className="group relative flex flex-col h-full bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Wishlist Button (only if handler provided) */}
        {onWishlistToggle && (
          <button
            onClick={(e) => {
              e.preventDefault()
              onWishlistToggle(product)
            }}
            disabled={wishlistBusy}
            aria-pressed={wished}
            aria-label={`${wished ? 'Bỏ yêu thích' : 'Yêu thích'} ${product.name}`}
            className={`absolute top-2 right-2 z-10 p-2 rounded-full bg-background/85 shadow-sm transition-colors disabled:opacity-50 ${
              wished ? 'text-red-600' : 'text-foreground hover:text-red-600'
            }`}
          >
            <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
          </button>
        )}

        {/* Badges: Discount takes precedence over custom badge */}
        {discount > 0 ? (
          <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none">
            -{discount}%
          </div>
        ) : badge ? (
          <div className="absolute top-2 left-2 z-10 bg-foreground text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none">
            {badge}
          </div>
        ) : null}

        <div className="flex flex-col flex-grow">
          <div className="relative aspect-[3/4] w-full bg-secondary overflow-hidden">
            {img ? (
              <img
                src={img}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : product.emoji ? (
              <div className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300">
                {product.emoji}
              </div>
            ) : null}
            {product.stock <= 0 && product.stock !== undefined && (
              <div className="absolute top-2 right-2 bg-destructive text-white px-2 py-0.5 text-[10px] font-semibold rounded pointer-events-none">
                Hết hàng
              </div>
            )}
          </div>
          
          <div className="flex flex-col flex-grow p-3">
            <h3 className="text-sm font-heading font-semibold text-foreground mb-1 line-clamp-2 min-h-[2.5rem] group-hover:text-accent transition-colors">
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{product.description}</p>
            )}

            <div className="mt-auto space-y-1 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-accent">{price.toLocaleString('vi-VN')} đ</span>
                {discount > 0 && originalPrice > 0 && (
                  <span className="text-xs text-muted-foreground line-through">
                    {originalPrice.toLocaleString('vi-VN')} đ
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="text-accent">★ {product.rating}</span>
                <span>· Đã bán {sold.toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
