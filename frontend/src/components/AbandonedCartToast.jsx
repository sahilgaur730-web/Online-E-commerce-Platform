import React, { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function AbandonedCartToast({ onResumeCheckout }) {
  const { cart } = useCart();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (cart?.totalItems > 0 && !dismissed) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 7000); // Trigger re-engagement mock after 7s of browsing
      return () => clearTimeout(timer);
    }
  }, [cart?.totalItems, dismissed]);

  if (!visible || !cart?.items?.length) return null;

  const firstItem = cart.items[0];

  return (
    <div className="fixed bottom-5 left-5 z-40 max-w-sm w-full bg-white rounded-xs shadow-2xl border-2 border-[#0A3B74] p-4 flex items-center gap-3 animate-bounce-subtle">
      <button
        onClick={() => {
          setVisible(false);
          setDismissed(true);
        }}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="w-12 h-12 rounded bg-gray-50 border border-gray-200 shrink-0 p-1 flex items-center justify-center">
        <img
          src={firstItem.imageUrl || firstItem.primaryImage}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[11px] font-bold text-[#FF7A00] uppercase tracking-wider">
          Items Waiting in Your Cart!
        </p>
        <p className="text-xs font-bold text-gray-900 truncate">
          {firstItem.title}
        </p>
        <p className="text-[11px] text-gray-500">
          Complete now to secure extra ₹100 discount
        </p>
        <button
          onClick={() => {
            setVisible(false);
            if (onResumeCheckout) onResumeCheckout();
          }}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0A3B74] hover:text-[#002F6C] hover:underline cursor-pointer"
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
