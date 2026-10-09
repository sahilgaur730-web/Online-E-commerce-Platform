import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    totalItems: 0,
    originalTotal: 0,
    discountTotal: 0,
    deliveryFee: 0,
    finalTotal: 0,
    savings: 0,
  });
  const [loading, setLoading] = useState(false);

  const calculateGuestCart = useCallback((items) => {
    let originalTotal = 0;
    let finalTotal = 0;
    let totalItems = 0;

    const mapped = items.map((item) => {
      const orig = item.originalPrice || item.price;
      const subtotal = item.price * item.quantity;
      originalTotal += orig * item.quantity;
      finalTotal += subtotal;
      totalItems += item.quantity;
      return {
        ...item,
        subtotal,
      };
    });

    const discountTotal = Math.max(0, originalTotal - finalTotal);
    const deliveryFee = finalTotal > 0 && finalTotal < 500 ? 40 : 0;

    setCart({
      items: mapped,
      totalItems,
      originalTotal,
      discountTotal,
      deliveryFee,
      finalTotal: finalTotal + deliveryFee,
      savings: discountTotal,
    });
  }, []);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Guest cart from local storage
      const local = JSON.parse(localStorage.getItem('shopkart_guest_cart') || '[]');
      calculateGuestCart(local);
      return;
    }
    try {
      setLoading(true);
      // Merge any pending guest cart items into server cart
      const guestItems = JSON.parse(localStorage.getItem('shopkart_guest_cart') || '[]');
      if (guestItems && guestItems.length > 0) {
        for (const item of guestItems) {
          try {
            await api.addToCart(item.productId, item.quantity);
          } catch {
            // Ignore if out of stock
          }
        }
        localStorage.removeItem('shopkart_guest_cart');
      }
      const data = await api.getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, calculateGuestCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product, quantity = 1) => {
    if (isAuthenticated) {
      const updated = await api.addToCart(product.id, quantity);
      setCart(updated);
      return updated;
    } else {
      // Guest cart
      const local = JSON.parse(localStorage.getItem('shopkart_guest_cart') || '[]');
      const existing = local.find((i) => i.productId === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        local.push({
          id: Date.now(),
          productId: product.id,
          title: product.title,
          brand: product.brand,
          price: product.price,
          originalPrice: product.originalPrice,
          discountPercentage: product.discountPercentage,
          imageUrl: product.primaryImage,
          quantity,
          stock: product.stock,
        });
      }
      localStorage.setItem('shopkart_guest_cart', JSON.stringify(local));
      calculateGuestCart(local);
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (isAuthenticated) {
      const updated = await api.updateCartQuantity(cartItemId, quantity);
      setCart(updated);
      return updated;
    } else {
      let local = JSON.parse(localStorage.getItem('shopkart_guest_cart') || '[]');
      if (quantity <= 0) {
        local = local.filter((i) => i.id !== cartItemId);
      } else {
        const item = local.find((i) => i.id === cartItemId);
        if (item) item.quantity = quantity;
      }
      localStorage.setItem('shopkart_guest_cart', JSON.stringify(local));
      calculateGuestCart(local);
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (isAuthenticated) {
      const updated = await api.removeFromCart(cartItemId);
      setCart(updated);
      return updated;
    } else {
      let local = JSON.parse(localStorage.getItem('shopkart_guest_cart') || '[]');
      local = local.filter((i) => i.id !== cartItemId);
      localStorage.setItem('shopkart_guest_cart', JSON.stringify(local));
      calculateGuestCart(local);
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      await api.clearCart();
    } else {
      localStorage.removeItem('shopkart_guest_cart');
    }
    setCart({
      items: [],
      totalItems: 0,
      originalTotal: 0,
      discountTotal: 0,
      deliveryFee: 0,
      finalTotal: 0,
      savings: 0,
    });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
