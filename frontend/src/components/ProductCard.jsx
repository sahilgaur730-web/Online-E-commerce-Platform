import React, { useState } from 'react';
import { Star, Heart, ShoppingCart, Check, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function ProductCard({ product, onSelectProduct, onWishlistToggle, isWishlisted }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    try {
      setLoadingAdd(true);
      await addToCart(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      alert(err.message || 'Failed to add to cart');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(product.id);
    }
  };

  return (
    <div
      onClick={() => onSelectProduct(product.id)}
      className="bg-white rounded-xl p-3.5 border border-slate-200/80 hover:border-[#0A3B74]/80 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden tap-highlight-none hover:-translate-y-0.5"
    >
      {/* Wishlist Heart Button */}
      <button
        onClick={handleWishlistClick}
        className={`absolute top-3 right-3 p-2 rounded-full z-10 transition-all duration-200 backdrop-blur-md shadow-xs ${
          isWishlisted
            ? 'text-rose-500 bg-rose-50/90 scale-105'
            : 'text-slate-400 hover:text-rose-500 hover:bg-white bg-white/80'
        }`}
        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </button>

      <div>
        {/* Product Image */}
        <div className="w-full h-44 overflow-hidden rounded-lg flex items-center justify-center p-2 mb-2.5 bg-slate-50/60 group-hover:bg-blue-50/30 transition-colors duration-300">
          <img
            src={product.primaryImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'}
            alt={product.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';
            }}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out"
            loading="lazy"
          />
        </div>

        {/* Brand */}
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          {product.brand}
        </span>

        {/* Product Title */}
        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#0A3B74] line-clamp-2 leading-snug mt-0.5 transition-colors">
          {product.title}
        </h3>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="bg-[#0A3B74] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
            <span>{product.rating ? product.rating.toFixed(1) : '4.2'}</span>
            <Star className="w-2.5 h-2.5 fill-current" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            ({product.ratingCount || 120})
          </span>
          <span className="text-[10px] bg-blue-50 text-[#0A3B74] font-bold px-1.5 py-0.5 rounded-full border border-blue-200/60 ml-auto flex items-center gap-0.5">
            <ShieldCheck className="w-2.5 h-2.5 text-[#0A3B74]" /> Verified
          </span>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mt-2.5">
          <span className="text-base font-extrabold text-slate-950">
            ₹{product.price?.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="text-xs text-slate-400 line-through">
                ₹{product.originalPrice?.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-[#FF7A00]">
                {product.discountPercentage}% off
              </span>
            </>
          )}
        </div>

        {/* Free Delivery note */}
        <div className="text-[11px] text-slate-500 mt-1 font-medium">
          {product.price >= 500 ? (
            <span className="text-[#388E3C] font-semibold">Free delivery</span>
          ) : (
            <span>Delivery: ₹40</span>
          )}
        </div>

        {/* Low Stock Warning */}
        {/* Low Stock or Expired Warning */}
        {product.expired ? (
          <div className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded mt-1.5 inline-block border border-rose-200">
            Deal Expired
          </div>
        ) : product.stock > 0 && product.stock <= 5 ? (
          <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">
            Only {product.stock} left in stock!
          </div>
        ) : product.stock === 0 ? (
          <div className="text-[11px] font-bold text-rose-600 mt-1.5">
            Out of Stock
          </div>
        ) : null}
      </div>

      {/* Action Footer: Add to Cart button */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100">
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || product.expired || loadingAdd}
          className={`w-full text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98 ${
            product.stock === 0 || product.expired
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
              : added
              ? 'bg-[#388E3C] text-white'
              : 'bg-[#FF7A00] hover:bg-[#E66A00] text-white'
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5" /> Added to Cart
            </>
          ) : product.expired ? (
            'Deal Expired'
          ) : product.stock === 0 ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
