import React, { useState, useEffect } from 'react';
import {
  Star,
  ShoppingCart,
  Zap,
  ShieldCheck,
  RotateCcw,
  Tag,
  MapPin,
  Heart,
  ChevronRight,
  Check,
} from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export function ProductDetailPage({
  productId,
  onBack,
  onProceedToCheckout,
  onWishlistToggle,
  isWishlisted,
}) {
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [pincode, setPincode] = useState('560103');
  const [pincodeChecked, setPincodeChecked] = useState(true);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await api.getProductById(productId);
        setProduct(data);
        setActiveImage(data.primaryImage || (data.imageUrls && data.imageUrls[0]) || '');
        const revs = await api.getReviews(productId);
        setReviews(revs || []);
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      alert(e.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    await addToCart(product, 1);
    if (onProceedToCheckout) {
      onProceedToCheckout();
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to submit a product review.');
      return;
    }
    try {
      setSubmittingReview(true);
      await api.addReview(product.id, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      setShowReviewModal(false);
      // Reload product & reviews
      const updatedP = await api.getProductById(productId);
      setProduct(updatedP);
      const revs = await api.getReviews(productId);
      setReviews(revs || []);
      setReviewTitle('');
      setReviewComment('');
    } catch (err) {
      alert(err.message || 'Failed to post review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2874F0] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 mt-3">Loading product details...</p>
      </div>
    );
  }

  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.primaryImage];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <button onClick={onBack} className="hover:text-[#2874F0] cursor-pointer">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="capitalize">{product.categoryName || 'Catalog'}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.title}</span>
      </div>

      <div className="bg-white rounded-xs p-6 shadow-xs border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Image Gallery & Sticky CTA Action Buttons */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-96">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`w-14 h-14 p-1 rounded-xs border transition shrink-0 cursor-pointer ${
                        activeImage === img ? 'border-[#2874F0] shadow-xs' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="flex-1 h-80 sm:h-96 border border-gray-100 rounded-xs flex items-center justify-center p-4 relative group">
                <button
                  onClick={() => onWishlistToggle && onWishlistToggle(product.id)}
                  className={`absolute top-3 right-3 p-2 rounded-full transition shadow-xs z-10 ${
                    isWishlisted ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-white hover:text-red-500'
                  }`}
                  title="Wishlist"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
                <img
                  src={activeImage || product.primaryImage}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                />
              </div>
            </div>

            {/* Action Buttons: ADD TO CART & BUY NOW */}
            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`py-3.5 px-4 rounded-xs font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition uppercase cursor-pointer ${
                  product.stock === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : added
                    ? 'bg-green-600 text-white'
                    : 'bg-[#FF9F00] hover:bg-[#e68e00] text-white'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className={`py-3.5 px-4 rounded-xs font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition uppercase cursor-pointer ${
                  product.stock === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#FB641B] hover:bg-[#e05816] text-white'
                }`}
              >
                <Zap className="w-4 h-4 fill-current" /> Buy Now
              </button>
            </div>
          </div>

          {/* Right Column: Title, Ratings, Offers, Delivery & Specs */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {product.brand}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 leading-snug">
                {product.title}
              </h1>
            </div>

            {/* Rating pill & ShopKart Assured badge */}
            <div className="flex items-center gap-3">
              <div className="bg-[#388E3C] text-white text-xs font-bold px-2 py-0.5 rounded-xs flex items-center gap-1">
                <span>{product.rating ? product.rating.toFixed(1) : '4.2'}</span>
                <Star className="w-3 h-3 fill-current" />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {product.ratingCount || 120} Ratings & {product.reviewCount || 45} Reviews
              </span>
              <div className="flex items-center gap-1 bg-blue-50 text-[#2874F0] px-2 py-0.5 rounded-xs text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ShopKart Assured</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs text-[#388E3C] font-bold block mb-1">Special Price</span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  ₹{product.price?.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-gray-500 line-through">
                      ₹{product.originalPrice?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-bold text-[#388E3C]">
                      {product.discountPercentage}% off
                    </span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-gray-500 block mt-1">+ ₹49 Secured Packaging Fee</span>
            </div>

            {/* Available Offers Box */}
            <div className="p-3 bg-green-50/50 border border-green-200 rounded-xs space-y-2 text-xs">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#388E3C]" /> Available Offers
              </h4>
              <ul className="space-y-1 text-gray-700">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-[#388E3C] shrink-0">Bank Offer:</span>
                  <span>5% Unlimited Cashback on ShopKart Axis Bank Credit Card.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-[#388E3C] shrink-0">Special Price:</span>
                  <span>Get extra ₹3,000 off on exchange of old functional electronics.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-[#388E3C] shrink-0">Partner Offer:</span>
                  <span>Sign-up for ShopKart Pay Later & get free ₹500 shopping voucher.</span>
                </li>
              </ul>
            </div>

            {/* Delivery & Pincode Checker */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#2874F0]" /> Delivery
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    maxLength={6}
                    placeholder="Enter pincode"
                    className="w-28 text-xs p-1.5 border-b-2 border-[#2874F0] focus:outline-none font-semibold text-gray-800"
                  />
                  <button
                    onClick={() => setPincodeChecked(true)}
                    className="text-xs font-bold text-[#2874F0] hover:underline cursor-pointer"
                  >
                    Check
                  </button>
                </div>
              </div>
              {pincodeChecked && (
                <div className="text-xs text-gray-700 mt-2 space-y-0.5">
                  <p className="font-semibold text-[#388E3C]">
                    Delivery by Tomorrow, 9 PM | Free ₹40
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Fast delivery available for pincode {pincode}
                  </p>
                </div>
              )}
            </div>

            {/* Description & Specifications */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Product Description</h4>
              <p className="text-xs text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {product.specifications && (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <h4 className="text-sm font-bold text-gray-900">Specifications</h4>
                <div className="bg-gray-50 p-3 rounded-xs text-xs space-y-1.5 text-gray-800 font-mono whitespace-pre-line border border-gray-200">
                  {product.specifications}
                </div>
              </div>
            )}

            {/* Seller & Warranty Information */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-3 rounded-xs">
              <div>
                <span className="text-gray-500 block">Seller</span>
                <span className="font-bold text-gray-900 text-sm">
                  {product.sellerName || 'ShopKart Authorized Retail'}
                </span>
                <span className="text-[11px] text-[#388E3C] font-semibold flex items-center gap-1 mt-0.5">
                  <span>4.8</span>
                  <Star className="w-3 h-3 fill-current inline" />
                  <span>Seller Rating</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <RotateCcw className="w-4 h-4 text-[#2874F0]" />
                <span className="font-medium">7 Days Replacement Policy</span>
              </div>
            </div>

            {/* Customer Ratings & Reviews Section */}
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Ratings & Reviews</h3>
                  <p className="text-xs text-gray-500">{reviews.length} customer reviews verified</p>
                </div>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="bg-white border border-gray-300 hover:border-gray-500 text-gray-800 font-bold text-xs px-4 py-2 rounded-xs shadow-xs transition cursor-pointer"
                >
                  Rate Product
                </button>
              </div>

              {/* Reviews List */}
              <div className="divide-y divide-gray-100">
                {reviews.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4">No reviews yet. Be the first to review this product!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="py-3 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="bg-[#388E3C] text-white font-bold text-[10px] px-1.5 py-0.2 rounded-xs flex items-center gap-0.5">
                          <span>{rev.rating}</span>
                          <Star className="w-2 h-2 fill-current" />
                        </div>
                        <span className="font-bold text-gray-900">{rev.title}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{rev.comment}</p>
                      <div className="flex items-center gap-2 text-gray-400 text-[10px] pt-1">
                        <span className="font-semibold text-gray-600">{rev.userName}</span>
                        <span>•</span>
                        {rev.verifiedPurchase && (
                          <span className="text-[#388E3C] font-semibold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Certified Buyer
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xs shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Rate & Review Product</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`p-1.5 rounded transition ${
                        star <= reviewRating ? 'text-[#388E3C]' : 'text-gray-300'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">{reviewRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Sensational display and battery"
                  className="w-full text-xs p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Review</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell us what you liked or disliked about this product..."
                  className="w-full text-xs p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 text-xs font-bold bg-[#2874F0] hover:bg-blue-600 text-white rounded-xs shadow-xs"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
