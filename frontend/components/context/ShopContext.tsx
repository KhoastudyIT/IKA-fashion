'use client'

// =============================================================
// Giữ số lượng giỏ hàng / yêu thích cho badge trên Header.
// Mọi API mutation (addToCart, updateCartItem, removeWishlist...) đều
// trả về state đầy đủ, nên các trang chỉ cần đẩy kết quả đó vào đây
// qua syncCart / syncWishlist — không cần optimistic increment và
// không tốn thêm request nào.
// =============================================================

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react'
import { getCart, getWishlist, Cart, ApiProduct } from '@/api'
import { useSession } from '@/auth-client'

interface ShopContextType {
  cartCount: number
  wishlistCount: number
  isWishlisted: (productId: number) => boolean
  syncCart: (cart: Cart) => void
  syncWishlist: (items: ApiProduct[]) => void
  refreshCounts: () => Promise<void>
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0)
  const [wishlistIds, setWishlistIds] = useState<number[]>([])
  const { data: session } = useSession()
  const userId = session?.user?.id

  const refreshCounts = useCallback(async () => {
    if (!userId) {
      setCartCount(0)
      setWishlistIds([])
      return
    }
    const [cart, wishlist] = await Promise.all([
      getCart().catch(() => null),
      getWishlist().catch(() => null),
    ])
    setCartCount(cart?.totalItems ?? 0)
    setWishlistIds(wishlist?.map(p => p.id) ?? [])
  }, [userId])

  useEffect(() => {
    refreshCounts()
  }, [refreshCounts])

  const syncCart = useCallback((cart: Cart) => {
    setCartCount(cart?.totalItems ?? 0)
  }, [])

  const syncWishlist = useCallback((items: ApiProduct[]) => {
    setWishlistIds(items?.map(p => p.id) ?? [])
  }, [])

  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds])
  const isWishlisted = useCallback((productId: number) => wishlistSet.has(productId), [wishlistSet])

  const value = useMemo(
    () => ({
      cartCount,
      wishlistCount: wishlistIds.length,
      isWishlisted,
      syncCart,
      syncWishlist,
      refreshCounts,
    }),
    [cartCount, wishlistIds, isWishlisted, syncCart, syncWishlist, refreshCounts],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const context = useContext(ShopContext)
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider')
  }
  return context
}
