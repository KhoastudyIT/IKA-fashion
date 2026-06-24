'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { ApiProduct } from '@/api'

interface ProductCardProps {
  product: ApiProduct
  onAddToCart?: (product: ApiProduct) => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const outOfStock = product.stock <= 0

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
            <div className="absolute top-4 right-4 bg-destructive text-white px-3 py-1 text-xs font-semibold rounded">
              Hết hàng
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2">
          <h3 className="text-sm font-heading font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{product.type}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {product.price.toLocaleString()} đ
            </span>
            <span className="text-xs text-accent font-medium">★ {product.rating}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
