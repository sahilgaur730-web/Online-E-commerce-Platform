import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';

export function WishlistPage({ onSelectProduct, onContinueShopping }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getWishlist();
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (productId) => {
    try {
      await api.toggleWishlist(productId);
      loadWishlist();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleMoveToCart = async (product) => {
    try {
      await addToCart(product, 1);
      await api.toggleWishlist(product.id);
      loadWishlist();
      alert('Moved item to Cart!');
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#0A3B74] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="pb-3 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-current" /> My Wishlist ({items.length})
        </h1>
        <p className="text-xs text-gray-500">Items you saved for later</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xs p-12 text-center border border-gray-200 max-w-md mx-auto">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">Your Wishlist is Empty</h3>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            Explore more and shortlist items you like!
          </p>
          <button
            onClick={onContinueShopping}
            className="bg-[#0A3B74] hover:bg-[#002F6C] text-white font-bold text-xs px-6 py-2.5 rounded-xs transition cursor-pointer"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xs border border-gray-200 shadow-xs divide-y divide-gray-100">
          {items.map((prod) => (
            <div key={prod.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div
                onClick={() => onSelectProduct(prod.id)}
                className="flex items-center gap-4 flex-1 cursor-pointer"
              >
                <div className="w-20 h-20 bg-white border border-gray-100 rounded p-1 flex items-center justify-center shrink-0">
                  <img src={prod.primaryImage} alt="" className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{prod.brand}</span>
                  <h3 className="font-semibold text-sm text-gray-900 hover:text-[#0A3B74] line-clamp-1">
                    {prod.title}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-bold text-base text-gray-900">
                      ₹{prod.price?.toLocaleString('en-IN')}
                    </span>
                    {prod.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{prod.originalPrice?.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleMoveToCart(prod)}
                  className="bg-[#FF7A00] hover:bg-[#E66A00] text-white font-bold text-xs px-4 py-2 rounded-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Move to Cart
                </button>
                <button
                  onClick={() => handleRemove(prod.id)}
                  className="text-gray-400 hover:text-red-600 p-2 cursor-pointer transition"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
