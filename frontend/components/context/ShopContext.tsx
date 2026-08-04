'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getCart, getWishlist } from '@/api';
import { useSession } from '@/auth-client';

interface ShopContextType {
  cartCount: number;
  wishlistCount: number;
  fetchCartAndWishlist: () => Promise<void>;
  refreshCounts: () => void;
  incrementCart: (amount: number) => void;
  incrementWishlist: (amount?: number) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { data: session } = useSession();

  const fetchCartAndWishlist = useCallback(async () => {
    if (!session?.user) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }

    try {
      const [cart, wishlist] = await Promise.all([
        getCart().catch(() => null) as Promise<any>,
        getWishlist().catch(() => null) as Promise<any>
      ]);
      
      const parsedCartCount = cart?.data?.totalItems || cart?.data?.items?.length || cart?.totalItems || 0;
      const parsedWishlistCount = wishlist?.data?.length || wishlist?.length || 0;

      setCartCount(parsedCartCount);
      setWishlistCount(parsedWishlistCount);
    } catch (error) {
      console.error("Error fetching shop data:", error);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchCartAndWishlist();
  }, [fetchCartAndWishlist]);

  const refreshCounts = useCallback(() => {
    fetchCartAndWishlist();
  }, [fetchCartAndWishlist]);

  const incrementCart = useCallback((amount: number) => {
    setCartCount(prev => {
      const next = Number(prev) + Number(amount);
      return next;
    });
  }, []);

  const incrementWishlist = useCallback((amount: number = 1) => {
    setWishlistCount(prev => {
      const next = Number(prev) + Number(amount);
      return next;
    });
  }, []);

  return (
    <ShopContext.Provider value={{ cartCount, wishlistCount, fetchCartAndWishlist, refreshCounts, incrementCart, incrementWishlist }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
