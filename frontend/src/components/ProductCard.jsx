import React, { useState } from 'react';
import { Star, Heart, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export function ProductCard({ product, onSelectProduct, onWishlistToggle, isWishlisted }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
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
      className="bg-white rounded-xs p-3 hover:shadow-lg transition-all border border-transparent hover:border-gray-200 cursor-pointer flex flex-col justify-between group relative"
    >
      {/* Wishlist Heart Button */}
      <button
        onClick={handleWishlistClick}
        className={`absolute top-3 right-3 p-1.5 rounded-full z-10 transition ${
          isWishlisted
            ? 'text-red-500 bg-red-50'
            : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 bg-white/80'
        }`}
        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className="w-4 h-4 fill-current" />
      </button>

      <div>
        {/* Product Image */}
        <div className="w-full h-44 overflow-hidden rounded-xs flex items-center justify-center p-2 mb-2 bg-white">
          <img
            src={product.primaryImage}
            alt={product.title}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
            loading="lazy"
          />
        </div>

        {/* Brand */}
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
          {product.brand}
        </span>

        {/* Product Title */}
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-[#2874F0] line-clamp-2 leading-snug mt-0.5">
          {product.title}
        </h3>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="bg-[#388E3C] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-xs flex items-center gap-0.5">
            <span>{product.rating ? product.rating.toFixed(1) : '4.2'}</span>
            <Star className="w-2.5 h-2.5 fill-current" />
          </div>
          <span className="text-[11px] text-gray-500">
            ({product.ratingCount || 120})
          </span>
          <span className="text-[10px] bg-blue-50 text-[#2874F0] font-semibold px-1 py-0.2 rounded-xs ml-auto">
            Verified
          </span>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-gray-900">
            ₹{product.price?.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="text-xs text-gray-500 line-through">
                ₹{product.originalPrice?.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-[#388E3C]">
                {product.discountPercentage}% off
              </span>
            </>
          )}
        </div>

        {/* Free Delivery note */}
        <div className="text-[11px] text-gray-600 mt-1">
          {product.price >= 500 ? (
            <span className="text-[#388E3C] font-semibold">Free delivery</span>
          ) : (
            <span>Delivery: ₹40</span>
          )}
        </div>

        {/* Low Stock Warning */}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="text-[10px] font-bold text-red-600 mt-1">
            Only {product.stock} left in stock!
          </div>
        )}
        {product.stock === 0 && (
          <div className="text-[11px] font-bold text-red-600 mt-1">
            Out of Stock
          </div>
        )}
      </div>

      {/* Action Footer: Add to Cart button */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || loadingAdd}
          className={`w-full text-xs font-bold py-1.5 px-3 rounded-xs flex items-center justify-center gap-1.5 transition ${
            product.stock === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : added
              ? 'bg-green-600 text-white'
              : 'bg-[#FF9F00] hover:bg-[#f09500] text-gray-900 cursor-pointer shadow-xs'
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5" /> Added to Cart
            </>
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
