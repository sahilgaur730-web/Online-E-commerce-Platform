import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Minus, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';

export function CartPage({ onProceedToCheckout, onViewProduct, onContinueShopping }) {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-white rounded-xs p-12 text-center max-w-xl mx-auto shadow-xs border border-gray-200">
          <div className="w-20 h-20 bg-blue-50 text-[#0A3B74] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty!</h2>
          <p className="text-xs text-gray-500 mb-6">
            Explore our curated catalog and add items to your shopping cart.
          </p>
          <button
            onClick={onContinueShopping}
            className="bg-[#0A3B74] hover:bg-[#002F6C] text-white font-bold text-xs px-8 py-3 rounded-xs shadow-xs transition cursor-pointer"
          >
            Shop Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header Delivery Address Snippet */}
          <div className="bg-white rounded-xs p-3.5 shadow-xs border border-gray-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500">Deliver to: </span>
              <span className="font-bold text-gray-900">
                {user ? `${user.name}, 560103` : 'Bengaluru - 560103'}
              </span>
            </div>
            <span className="text-[#0A3B74] font-bold">Standard Delivery</span>
          </div>

          {/* Cart Items Container */}
          <div className="bg-white rounded-xs shadow-xs border border-gray-200 divide-y divide-gray-200">
            {cart.items.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row gap-4">
                {/* Thumbnail */}
                <div
                  onClick={() => onViewProduct(item.productId)}
                  className="w-24 h-24 shrink-0 flex items-center justify-center bg-white p-1 rounded-xs border border-gray-100 cursor-pointer"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1.5">
                  <h3
                    onClick={() => onViewProduct(item.productId)}
                    className="text-sm font-semibold text-gray-900 hover:text-[#0A3B74] cursor-pointer line-clamp-2"
                  >
                    {item.title}
                  </h3>
                  <div className="text-xs text-gray-500">
                    Seller: <span className="text-gray-700 font-medium">{item.brand} Retail</span>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-base font-bold text-gray-900">
                      ₹{item.price?.toLocaleString('en-IN')}
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <>
                        <span className="text-xs text-gray-400 line-through">
                          ₹{item.originalPrice?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-bold text-[#388E3C]">
                          {item.discountPercentage}% Off
                        </span>
                      </>
                    )}
                  </div>

                  {/* Quantity and Remove Controls */}
                  <div className="flex items-center gap-4 pt-3">
                    <div className="flex items-center border border-gray-300 rounded-xs">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer"
                        title="Decrease Quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-xs font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                        title="Increase Quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs font-bold text-gray-700 hover:text-red-600 uppercase flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>

                {/* Delivery Estimate */}
                <div className="text-right text-xs text-gray-500 shrink-0 hidden sm:block">
                  <div>Delivery by <span className="font-semibold text-gray-900">Tomorrow</span></div>
                  <div className="text-[#388E3C] font-semibold">Free Delivery</div>
                </div>
              </div>
            ))}

            {/* Place Order CTA Bar */}
            <div className="p-4 bg-white flex justify-end">
              <button
                onClick={onProceedToCheckout}
                className="bg-[#FF7A00] hover:bg-[#E66A00] text-white font-bold text-sm px-8 py-3 rounded-xs shadow-md uppercase tracking-wide flex items-center gap-2 cursor-pointer transition"
              >
                Place Order <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Price Details Box */}
        <div className="lg:col-span-4 space-y-3 sticky top-20">
          <div className="bg-white rounded-xs shadow-xs border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-3 border-b border-gray-200">
              Price Details
            </h3>

            <div className="space-y-3 py-3 text-xs border-b border-gray-200">
              <div className="flex justify-between text-gray-700">
                <span>Price ({cart.totalItems} items)</span>
                <span>₹{cart.originalTotal?.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-gray-700">
                <span>Discount</span>
                <span className="text-[#388E3C] font-bold">
                  − ₹{cart.discountTotal?.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-gray-700">
                <span>Delivery Charges</span>
                <span className={cart.deliveryFee === 0 ? 'text-[#388E3C] font-bold' : ''}>
                  {cart.deliveryFee === 0 ? 'FREE' : `₹${cart.deliveryFee}`}
                </span>
              </div>
            </div>

            <div className="py-3 flex justify-between text-base font-bold text-gray-900 border-b border-gray-200">
              <span>Total Amount</span>
              <span>₹{cart.finalTotal?.toLocaleString('en-IN')}</span>
            </div>

            {cart.savings > 0 && (
              <div className="pt-3 text-xs font-bold text-[#388E3C]">
                You will save ₹{cart.savings?.toLocaleString('en-IN')} on this order
              </div>
            )}
          </div>

          {/* Safe & Secure Trust Badge */}
          <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
            <ShieldCheck className="w-6 h-6 text-gray-400 shrink-0" />
            <p className="text-[11px] leading-tight">
              Safe and Secure Payments. Easy returns. 100% Authentic products.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
