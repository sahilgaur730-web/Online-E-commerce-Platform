import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle,
  Clock,
  AlertTriangle,
  BellRing,
  Plus,
  Image as ImageIcon,
  ThumbsUp,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { getFallbackProductById } from '../data/fallbackProducts';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FlyToCartProjectile } from '../components/FlyToCartProjectile';

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
  const [reviewMediaUrls, setReviewMediaUrls] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Variant Selectors (Size / Color / Storage)
  const [selectedSize, setSelectedSize] = useState('128GB');
  const [selectedColor, setSelectedColor] = useState('Space Grey');
  const [selectedStorage, setSelectedStorage] = useState('128GB');

  // Pincode Validator State
  const [pincode, setPincode] = useState('560103');
  const [pincodeStatus, setPincodeStatus] = useState('VALID'); // 'VALID' | 'INVALID' | 'EMPTY'
  const [pincodeMessage, setPincodeMessage] = useState('Delivery by Tomorrow, 9 PM | Free ₹40');

  // Real-Time Delivery Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 42, seconds: 18 });

  // Price Drop / Back in Stock Alert Modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMode, setAlertMode] = useState('PRICE_DROP'); // 'PRICE_DROP' | 'BACK_IN_STOCK'
  const [alertEmail, setAlertEmail] = useState('');
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  const [alertSubscribed, setAlertSubscribed] = useState(false);

  // Loupe Zoom State
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [loupePosition, setLoupePosition] = useState({ x: 0, y: 0, bgX: 0, bgY: 0 });
  const imageContainerRef = useRef(null);

  // Fly-to-Cart Animation State
  const [projectile, setProjectile] = useState(null);
  const [added, setAdded] = useState(false);

  // Wishlist Heart Bounce
  const [heartBouncing, setHeartBouncing] = useState(false);

  // Bundle Offer Added State
  const [bundleAdded, setBundleAdded] = useState(false);

  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  // Delivery countdown interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        console.error('Failed to load product, falling back to local dataset:', err);
        const fallback = getFallbackProductById(productId);
        setProduct(fallback);
        setActiveImage(fallback.primaryImage || (fallback.imageUrls && fallback.imageUrls[0]) || '');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  // Image Loupe Mouse Movement Handler
  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const bgX = (x / rect.width) * 100;
      const bgY = (y / rect.height) * 100;
      setLoupePosition({ x, y, bgX, bgY });
    }
  };

  // Pincode Validator Function (Supports synthetic test failure paths)
  const handleCheckPincode = () => {
    const clean = pincode.trim();
    if (!clean || clean.length !== 6 || !/^\d+$/.test(clean)) {
      setPincodeStatus('INVALID');
      setPincodeMessage('Please enter a valid 6-digit numeric postal code.');
      return;
    }
    // Simulation edge cases: 999999 or 000000 are unserviceable
    if (clean.startsWith('00') || clean === '999999') {
      setPincodeStatus('INVALID');
      setPincodeMessage('Delivery currently unavailable to this region. Please try another pincode.');
      return;
    }

    setPincodeStatus('VALID');
    setPincodeMessage(`Delivery by Tomorrow, 9 PM | Free ₹40 for pincode ${clean}`);
  };

  // Fly-to-Cart Trigger
  const triggerFlyToCart = (startEl) => {
    if (!startEl) return;
    const cartBtn = document.getElementById('navbar-cart-btn');
    const startRect = startEl.getBoundingClientRect();
    const cartRect = cartBtn
      ? cartBtn.getBoundingClientRect()
      : { left: window.innerWidth - 60, top: 15 };

    setProjectile({
      startX: startRect.left + startRect.width / 2 - 28,
      startY: startRect.top + startRect.height / 2 - 28,
      targetX: cartRect.left + cartRect.width / 2 - 28,
      targetY: cartRect.top + cartRect.height / 2 - 28,
      imageUrl: activeImage || product?.primaryImage,
    });
  };

  const handleAddToCart = async (e) => {
    if (!product) return;
    try {
      if (e?.currentTarget) {
        triggerFlyToCart(e.currentTarget);
      }
      await addToCart(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    } catch (err) {
      alert(err.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      await addToCart(product, 1);
      if (onProceedToCheckout) {
        onProceedToCheckout();
      }
    } catch (err) {
      alert(err.message || 'Failed to proceed to checkout');
    }
  };

  const handleWishlistClick = () => {
    setHeartBouncing(true);
    setTimeout(() => setHeartBouncing(false), 500);
    if (onWishlistToggle && product) {
      onWishlistToggle(product.id);
    }
  };

  // Add 1-Click Frequently Bought Together Bundle
  const handleAddBundle = async () => {
    if (!product) return;
    try {
      await addToCart(product, 1);
      // Mock complementary accessories
      const accessory1 = {
        id: 991,
        title: `${product.brand} Armor Shockproof Protective Case`,
        brand: product.brand,
        price: 499,
        originalPrice: 999,
        discountPercentage: 50,
        primaryImage: activeImage || product.primaryImage,
        stock: 50,
      };
      await addToCart(accessory1, 1);
      setBundleAdded(true);
      setTimeout(() => setBundleAdded(false), 2500);
    } catch (err) {
      alert(err.message || 'Failed to add bundle to cart');
    }
  };

  // Customer Reviews & Media Upload Simulation
  const handleMediaUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Create local object URLs for immediate preview
      const urls = Array.from(files).map((f) => URL.createObjectURL(f));
      setReviewMediaUrls([...reviewMediaUrls, ...urls]);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to submit a certified product review.');
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
      // Refresh product & reviews
      const updatedP = await api.getProductById(productId);
      setProduct(updatedP);
      const revs = await api.getReviews(productId);
      setReviews(revs || []);
      setReviewTitle('');
      setReviewComment('');
      setReviewMediaUrls([]);
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
        <p className="text-xs text-gray-500 mt-3 font-semibold">
          Loading ShopKart product details...
        </p>
      </div>
    );
  }

  const images =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : [product.primaryImage];

  // Dynamic price adjustment based on variant
  const variantStorageAdd =
    selectedStorage === '256GB' ? 4000 : selectedStorage === '512GB' ? 9000 : 0;
  const currentPrice = product.price + variantStorageAdd;
  const currentOriginalPrice = product.originalPrice
    ? product.originalPrice + variantStorageAdd
    : null;

  // Star Breakdown statistics
  const totalRev = reviews.length || 45;
  const ratingDistribution = [
    { stars: 5, pct: 68, count: Math.round(totalRev * 0.68) },
    { stars: 4, pct: 20, count: Math.round(totalRev * 0.2) },
    { stars: 3, pct: 8, count: Math.round(totalRev * 0.08) },
    { stars: 2, pct: 3, count: Math.round(totalRev * 0.03) },
    { stars: 1, pct: 1, count: Math.round(totalRev * 0.01) },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* Physics Fly-to-Cart Projectile */}
      <FlyToCartProjectile
        projectile={projectile}
        onComplete={() => setProjectile(null)}
      />

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
          {/* LEFT COLUMN: Gallery with Loupe Zoom & Action Buttons */}
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
                        activeImage === img
                          ? 'border-[#2874F0] ring-1 ring-[#2874F0]'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image with Interactive Loupe Zoom */}
              <div
                ref={imageContainerRef}
                onMouseEnter={() => setIsHoveringImage(true)}
                onMouseLeave={() => setIsHoveringImage(false)}
                onMouseMove={handleMouseMove}
                className="flex-1 h-80 sm:h-96 border border-gray-100 rounded-xs flex items-center justify-center p-4 relative group cursor-crosshair overflow-hidden select-none"
              >
                {/* Wishlist Heart with Bounce Animation */}
                <button
                  onClick={handleWishlistClick}
                  className={`absolute top-3 right-3 p-2 rounded-full transition shadow-xs z-10 cursor-pointer ${
                    isWishlisted
                      ? 'text-red-500 bg-red-50 ring-1 ring-red-200'
                      : 'text-gray-400 bg-white hover:text-red-500'
                  } ${heartBouncing ? 'animate-heart-bounce' : ''}`}
                  title="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>

                {/* Base Product Image */}
                <img
                  src={activeImage || product.primaryImage}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain transition duration-200"
                />

                {/* Loupe Zoom Overlay when hovering */}
                {isHoveringImage && (
                  <div
                    className="hidden lg:block absolute inset-0 pointer-events-none bg-no-repeat bg-white z-20"
                    style={{
                      backgroundImage: `url(${activeImage || product.primaryImage})`,
                      backgroundPosition: `${loupePosition.bgX}% ${loupePosition.bgY}%`,
                      backgroundSize: '220%',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Desktop Action Buttons (Agent 04 & 13) */}
            {product.stock === 0 ? (
              <div className="w-full mt-6 p-4 bg-red-50 border border-red-200 rounded-xs space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Currently Out of Stock</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  This item is currently unavailable from our fulfillment centers.
                </p>
                <button
                  onClick={() => {
                    setAlertMode('BACK_IN_STOCK');
                    setShowAlertModal(true);
                  }}
                  className="w-full py-2.5 px-4 bg-[#0A3B74] hover:bg-[#002F6C] text-white font-bold text-xs uppercase rounded-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Notify Me When Back in Stock</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 w-full mt-6">
                <button
                  onClick={handleAddToCart}
                  className={`py-3.5 px-4 rounded-xs font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-98 ${
                    added
                      ? 'bg-[#388E3C] text-white'
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
                  className="py-3.5 px-4 rounded-xs font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-98 bg-[#FF7A00] hover:bg-[#E66A00] text-white"
                >
                  <Zap className="w-4 h-4 fill-current" /> Buy Now
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Details, Variants, Triggers, Offers & Reviews */}
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
              <div className="flex items-center gap-1 bg-blue-50 text-[#0A3B74] px-2 py-0.5 rounded-xs text-xs font-bold border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2874F0]" />
                <span>ShopKart Assured</span>
              </div>
            </div>

            {/* Dynamic Price Box */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs text-[#388E3C] font-bold block mb-1">Special Price</span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
                {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                  <>
                    <span className="text-sm text-gray-500 line-through">
                      ₹{currentOriginalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-bold text-[#388E3C]">
                      {product.discountPercentage}% off
                    </span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-gray-500 block mt-1">+ ₹49 Secured Packaging Fee</span>
            </div>

            {/* Conversion Trigger: Scarcity Low Stock & Delivery Countdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Dynamic Low Stock Alert */}
              {product.stock <= 5 && product.stock > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xs p-2.5 flex items-center gap-2 text-xs font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Hurry, only {product.stock} items left in stock!</span>
                </div>
              )}

              {/* Real-Time Delivery Countdown Timer */}
              <div className="bg-blue-50 border border-blue-200 rounded-xs p-2.5 flex items-center gap-2 text-xs font-semibold text-[#0A3B74]">
                <Clock className="w-4 h-4 text-[#2874F0] shrink-0" />
                <span>
                  Order within{' '}
                  <span className="font-mono font-bold text-red-600">
                    {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
                  </span>{' '}
                  for tomorrow delivery
                </span>
              </div>
            </div>

            {/* Variant Selector (Size / Color / Storage) */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              {/* Size Variant */}
              <div>
                <span className="text-xs font-bold text-gray-700 block mb-1.5 uppercase">
                  Size / Edition: <span className="text-[#2874F0]">{selectedSize}</span>
                </span>
                <div className="flex gap-2">
                  {['Standard', 'Pro Edition', 'Max Edition'].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`text-xs px-3.5 py-1.5 rounded-xs border font-bold transition cursor-pointer ${
                        selectedSize === sz
                          ? 'border-[#2874F0] bg-blue-50 text-[#2874F0] ring-1 ring-[#2874F0]'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Storage Variant */}
              <div>
                <span className="text-xs font-bold text-gray-700 block mb-1.5 uppercase">
                  Storage / Capacity: <span className="text-[#2874F0]">{selectedStorage}</span>
                </span>
                <div className="flex gap-2">
                  {['128GB', '256GB', '512GB'].map((stg) => (
                    <button
                      key={stg}
                      onClick={() => setSelectedStorage(stg)}
                      className={`text-xs px-3.5 py-1.5 rounded-xs border font-bold transition cursor-pointer ${
                        selectedStorage === stg
                          ? 'border-[#2874F0] bg-blue-50 text-[#2874F0] ring-1 ring-[#2874F0]'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {stg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Variant */}
              <div>
                <span className="text-xs font-bold text-gray-700 block mb-1.5 uppercase">
                  Color: <span className="text-[#2874F0]">{selectedColor}</span>
                </span>
                <div className="flex gap-2">
                  {[
                    { name: 'Space Grey', bg: '#4A4A4A' },
                    { name: 'Silver', bg: '#E0E0E0' },
                    { name: 'Deep Navy', bg: '#0A3B74' },
                  ].map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xs border font-medium transition cursor-pointer ${
                        selectedColor === c.name
                          ? 'border-[#2874F0] bg-blue-50 text-[#2874F0] ring-1 ring-[#2874F0]'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: c.bg }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
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

            {/* Pincode Validator with Error Path Testing */}
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
                    onClick={handleCheckPincode}
                    className="text-xs font-bold text-[#2874F0] hover:underline cursor-pointer"
                  >
                    Check
                  </button>
                </div>
              </div>

              {pincodeStatus === 'VALID' ? (
                <div className="text-xs text-gray-700 mt-2 space-y-0.5">
                  <p className="font-semibold text-[#388E3C]">{pincodeMessage}</p>
                  <p className="text-gray-500 text-[11px]">
                    Fast delivery available for pincode {pincode}
                  </p>
                </div>
              ) : pincodeStatus === 'INVALID' ? (
                <div className="text-xs text-red-600 font-semibold mt-2">
                  {pincodeMessage}
                </div>
              ) : null}
            </div>

            {/* Frequently Bought Together Bundle Card (Agent 12) */}
            <div className="pt-3 border-t border-gray-100 bg-gray-50/80 p-3.5 rounded-xs border border-gray-200">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#2874F0]" /> Frequently Bought Together
              </h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src={activeImage || product.primaryImage}
                    alt=""
                    className="w-12 h-12 object-contain bg-white rounded border border-gray-200 p-1"
                  />
                  <span className="text-gray-400 font-black">+</span>
                  <div className="w-12 h-12 bg-white rounded border border-gray-200 p-1 flex items-center justify-center text-center">
                    <span className="text-[9px] font-bold text-gray-600 leading-tight">Armor Case</span>
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900">
                      Total Bundle: ₹{(currentPrice + 499).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-[#388E3C] font-semibold">
                      Save ₹500 when bought together
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleAddBundle}
                  className={`px-4 py-2 text-xs font-bold uppercase rounded-xs transition cursor-pointer shadow-xs ${
                    bundleAdded
                      ? 'bg-[#388E3C] text-white'
                      : 'bg-[#0A3B74] hover:bg-blue-900 text-white'
                  }`}
                >
                  {bundleAdded ? 'Bundle Added!' : 'Add 2 Items to Cart'}
                </button>
              </div>
            </div>

            {/* Viral Loops: Price Drop / Back-in-Stock Alert Toggle (Agent 13) */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
              <span className="text-gray-600">Want notifications for this item?</span>
              <button
                onClick={() => setShowAlertModal(true)}
                className="flex items-center gap-1.5 text-[#2874F0] font-bold hover:underline cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Notify me on Price Drop</span>
              </button>
            </div>

            {/* Description & Specifications */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Product Description</h4>
              <p className="text-xs text-gray-700 leading-relaxed">{product.description}</p>
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

            {/* SOCIAL PROOF & MEDIA REVIEWS (Agent 14) */}
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Ratings & Reviews</h3>
                  <p className="text-xs text-gray-500">{totalRev} customer reviews verified</p>
                </div>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="bg-white border border-gray-300 hover:border-gray-500 text-gray-800 font-bold text-xs px-4 py-2 rounded-xs shadow-xs transition cursor-pointer"
                >
                  Rate Product
                </button>
              </div>

              {/* Rating Breakdown Progress Bars */}
              <div className="bg-gray-50 p-4 rounded-xs border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-4 text-center border-b sm:border-b-0 sm:border-r border-gray-200 pb-3 sm:pb-0">
                  <div className="text-4xl font-black text-gray-900">
                    {product.rating ? product.rating.toFixed(1) : '4.3'}
                    <Star className="w-6 h-6 fill-current text-[#388E3C] inline ml-1" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{totalRev} Ratings & Reviews</p>
                </div>

                <div className="sm:col-span-8 space-y-1.5 text-xs">
                  {ratingDistribution.map((r) => (
                    <div key={r.stars} className="flex items-center gap-2">
                      <span className="w-6 text-right font-bold text-gray-700 flex items-center justify-end gap-0.5">
                        {r.stars} <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#388E3C] rounded-full"
                          style={{ width: `${r.pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-400 text-[10px]">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="divide-y divide-gray-100">
                {reviews.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4">
                    No reviews yet. Be the first to review this product!
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="py-3 text-xs space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="bg-[#388E3C] text-white font-bold text-[10px] px-1.5 py-0.2 rounded-xs flex items-center gap-0.5">
                          <span>{rev.rating}</span>
                          <Star className="w-2 h-2 fill-current" />
                        </div>
                        <span className="font-bold text-gray-900">{rev.title}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{rev.comment}</p>

                      {/* Mock Verified Buyer & Media Attachments */}
                      <div className="flex items-center gap-2 text-gray-400 text-[10px] pt-1">
                        <span className="font-semibold text-gray-600">{rev.userName}</span>
                        <span>•</span>
                        {rev.verifiedPurchase && (
                          <span className="text-[#388E3C] font-semibold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Certified Buyer
                          </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1 text-gray-500 cursor-pointer hover:text-gray-800">
                          <ThumbsUp className="w-2.5 h-2.5" /> Helpful (14)
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile / Scroll CTA Bar (Agent 04) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-2.5 px-4 flex items-center justify-between sm:hidden shadow-lg">
        <div>
          <span className="text-xs text-gray-500 block">Total</span>
          <span className="font-black text-base text-gray-900">
            ₹{currentPrice.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            className="bg-[#FF9F00] text-white font-bold text-xs px-4 py-2.5 rounded-xs uppercase shadow-xs"
          >
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="bg-[#FF7A00] hover:bg-[#E66A00] text-white font-bold text-xs px-5 py-2.5 rounded-xs uppercase shadow-xs cursor-pointer transition"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Review Submission Modal with Media Attachment Support */}
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
                      className={`p-1.5 rounded transition cursor-pointer ${
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
                  placeholder="e.g. Exceptional battery life and build quality"
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
                  placeholder="Share your experience regarding performance, packaging, and reliability..."
                  className="w-full text-xs p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                />
              </div>

              {/* Photo / Media Attachment Field (Agent 14) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Upload Photos / Video
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                    id="review-media-input"
                  />
                  <label
                    htmlFor="review-media-input"
                    className="cursor-pointer text-xs text-[#2874F0] font-bold flex items-center justify-center gap-1.5"
                  >
                    <ImageIcon className="w-4 h-4" /> Add Photos or Unboxing Video
                  </label>
                  {reviewMediaUrls.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto justify-center">
                      {reviewMediaUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 text-xs font-bold bg-[#2874F0] hover:bg-blue-600 text-white rounded-xs shadow-xs cursor-pointer"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Certified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price Drop & Back in Stock Alert Modal (Agent 13) */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xs shadow-2xl max-w-sm w-full p-5 relative">
            <button
              onClick={() => {
                setShowAlertModal(false);
                setAlertSubscribed(false);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <BellRing className="w-5 h-5 text-[#2874F0]" />
              <h3 className="font-bold text-sm text-gray-900">
                {alertMode === 'BACK_IN_STOCK' ? 'Set Back-in-Stock Alert' : 'Set Price Drop Alert'}
              </h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              {alertMode === 'BACK_IN_STOCK'
                ? 'We will notify you immediately via email as soon as this item is restocked.'
                : 'We will notify you immediately via email when the price drops below your target!'}
            </p>

            {alertSubscribed ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-xs text-[#388E3C] font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#388E3C] shrink-0" />
                <span>
                  {alertMode === 'BACK_IN_STOCK'
                    ? 'Back-in-stock alert saved! We will notify you when this item is restocked.'
                    : 'Price alert saved! You will receive an instant notification when this item goes on sale.'}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Notification Email
                  </label>
                  <input
                    type="email"
                    value={alertEmail || (user?.email || '')}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full text-xs p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
                {alertMode === 'PRICE_DROP' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Target Price (₹)
                    </label>
                    <input
                      type="number"
                      value={alertTargetPrice}
                      onChange={(e) => setAlertTargetPrice(e.target.value)}
                      placeholder={`e.g. ${Math.round(currentPrice * 0.9)}`}
                      className="w-full text-xs p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                    />
                  </div>
                )}
                <button
                  onClick={() => setAlertSubscribed(true)}
                  className="w-full py-2 bg-[#2874F0] text-white font-bold text-xs uppercase rounded-xs hover:bg-blue-600 transition cursor-pointer"
                >
                  {alertMode === 'BACK_IN_STOCK' ? 'Notify Me' : 'Activate Alert'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom CTA Bar (Agent 04: Mobile & Scroll View) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3 md:hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={activeImage || product.primaryImage}
            alt=""
            className="w-10 h-10 object-contain rounded bg-white border border-gray-100 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{product.title}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-black text-gray-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {currentOriginalPrice && (
                <span className="text-[10px] text-gray-400 line-through">
                  ₹{currentOriginalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {product.stock === 0 ? (
            <button
              onClick={() => {
                setAlertMode('BACK_IN_STOCK');
                setShowAlertModal(true);
              }}
              className="py-2 px-3 bg-[#2874F0] hover:bg-blue-600 text-white font-bold text-xs uppercase rounded-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Notify Me</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleAddToCart}
                className="py-2 px-3 bg-[#FF9F00] hover:bg-[#e68e00] text-white font-bold text-xs uppercase rounded-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              <button
                onClick={handleBuyNow}
                className="py-2 px-4 bg-[#FF7A00] hover:bg-[#E66A00] text-white font-bold text-xs uppercase rounded-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Buy Now</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
