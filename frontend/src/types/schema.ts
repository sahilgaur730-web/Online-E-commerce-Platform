/**
 * ShopKart E-Commerce Platform - Complete TypeScript Data Models & Schemas
 * Covers normalized relational entities for Users, Products, Variants, Orders,
 * Gamification/SuperCoins, Loyalty Streaks, Reviews, Wishlists, and Discovery.
 */

// ==========================================
// 1. USER & AUTHENTICATION SCHEMAS
// ==========================================

export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  active: boolean;
  storeName?: string;
  storeDescription?: string;
  createdAt: string;
}

export interface Address {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  pincode: string;
  streetAddress: string;
  city: string;
  state: string;
  landmark?: string;
  addressType: 'HOME' | 'WORK';
  isDefault: boolean;
  createdAt: string;
}

// ==========================================
// 2. PRODUCT & VARIANT SCHEMAS
// ==========================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  imageUrl?: string;
  displayOrder: number;
  parentId?: number | null;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size?: 'S' | 'M' | 'L' | 'XL' | 'XXL' | string;
  color?: string;
  colorHex?: string;
  storage?: '64GB' | '128GB' | '256GB' | '512GB' | '1TB' | string;
  priceModifier: number; // Offset from base price
  stock: number;
  imageUrl?: string;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  stock: number;
  version?: number;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
  sellerId: number;
  sellerName?: string;
  rating: number;
  ratingCount: number;
  reviewCount: number;
  specifications?: string;
  featured?: boolean;
  dealOfTheDay?: boolean;
  topOffer?: boolean;
  primaryImage: string;
  imageUrls: string[];
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. ORDER & LIFECYCLE SCHEMAS
// ==========================================

export type OrderLifecycleState =
  | 'PLACED'          // Ordered / Pending
  | 'CONFIRMED'       // Packed
  | 'SHIPPED'         // Shipped
  | 'OUT_FOR_DELIVERY'// Out for delivery
  | 'DELIVERED'       // Delivered
  | 'CANCELLED'       // Cancelled
  | 'RETURN_REFUND';  // Returned / Refunded

export type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'COD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: number;
  orderId: number;
  subOrderId?: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderTrackingEvent {
  id: number;
  orderId: number;
  subOrderId?: number;
  status: OrderLifecycleState;
  title: string;
  description: string;
  timestamp: string;
}

export interface SubOrder {
  id: number;
  subOrderNumber: string;
  orderId: number;
  sellerId: number;
  sellerName?: string;
  status: OrderLifecycleState;
  subtotal: number;
  shippingFee: number;
  trackingNumber: string;
  carrier?: string;
  cancellationReason?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  buyerId: number;
  buyerName?: string;
  buyerEmail?: string;
  totalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  orderStatus: OrderLifecycleState;
  shippingAddressSnapshot: string;
  trackingNumber: string;
  cancellationReason?: string;
  items: OrderItem[];
  subOrders: SubOrder[];
  trackingEvents: OrderTrackingEvent[];
  coinsEarned?: number;
  coinsRedeemed?: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. CART & WISHLIST SCHEMAS
// ==========================================

export interface CartItem {
  id: number;
  productId: number;
  title: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  imageUrl: string;
  quantity: number;
  stock: number;
  subtotal: number;
  selectedVariant?: ProductVariant;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  originalTotal: number;
  discountTotal: number;
  deliveryFee: number;
  finalTotal: number;
  savings: number;
  coinsUsable?: number;
}

export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  product?: Product;
  createdAt: string;
}

// ==========================================
// 5. SOCIAL PROOF & MEDIA REVIEW SCHEMAS
// ==========================================

export interface MediaReview {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  mediaUrls?: string[]; // Photos or Videos attached
  helpfulCount?: number;
  createdAt: string;
}

export interface RatingBreakdown {
  averageRating: number;
  totalReviews: number;
  starsBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// ==========================================
// 6. GAMIFICATION, LOYALTY & RETENTION
// ==========================================

export interface SuperCoinsWallet {
  userId: number;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

export interface SuperCoinsTransaction {
  id: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'STREAK_BONUS';
  amount: number;
  description: string;
  orderId?: number;
  timestamp: string;
}

export interface DailyStreakState {
  currentStreak: number;
  lastCheckInDate: string | null;
  hasClaimedToday: boolean;
  streakRewards: {
    day: number;
    coins: number;
    claimed: boolean;
  }[];
}

export interface ScratchCardReward {
  id: string;
  revealed: boolean;
  promoCode: string;
  discountAmount: number;
  coinsBonus: number;
  expiryDate: string;
}

// ==========================================
// 7. CONVERSION & URGENCY TRIGGERS
// ==========================================

export interface LowStockAlert {
  productId: number;
  stockRemaining: number;
  isUrgent: boolean; // stock < 5
}

export interface DeliveryCountdown {
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  isTomorrowGuaranteed: boolean;
}

export interface BundleOffer {
  id: string;
  mainProductId: number;
  bundleProductIds: number[];
  bundleItems: Product[];
  comboDiscountPercentage: number;
  totalRegularPrice: number;
  bundlePrice: number;
  totalSavings: number;
}

// ==========================================
// 8. DISCOVERY & SEARCH SCHEMAS
// ==========================================

export interface SearchSuggestion {
  id: number;
  title: string;
  brand: string;
  category: string;
  price: number;
  primaryImage: string;
  rating: number;
}

export interface StoryHighlight {
  id: string;
  title: string;
  categorySlug: string;
  iconName: string;
  badge?: string;
  color: string;
  coverImage: string;
  itemsPreview: {
    title: string;
    subtitle: string;
    imageUrl: string;
    discount: string;
  }[];
}

export interface VisualSearchQuery {
  imageUrl: string;
  presetKeyword?: string;
  presetTags?: string[];
}

export interface VisualSearchResult {
  product: Product;
  matchScore: number;
  matchedFeatures: string[];
}

