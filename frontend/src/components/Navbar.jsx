import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Package,
  Bell,
  Store,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Flame,
  Award,
  TrendingUp,
  X,
  Share2,
  Camera,
  Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../api/client';

export function Navbar({
  onSearch,
  currentView,
  setCurrentView,
  openAuthModal,
  onOpenStreak,
  onOpenLedger,
  onOpenReferral,
  onOpenVisualSearch,
  onSelectProduct,
}) {
  const { user, isAuthenticated, isSeller, isAdmin, logout, loginDemo } = useAuth();
  const { cart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [superCoins, setSuperCoins] = useState(() => {
    try {
      return parseInt(localStorage.getItem('shopkart_supercoins') || '120', 10);
    } catch {
      return 120;
    }
  });

  // Predictive Auto-Suggest Search States
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchContainerRef = useRef(null);

  // Cart Badge Bounce trigger
  const [badgeBouncing, setBadgeBouncing] = useState(false);
  const prevCartTotal = useRef(cart?.totalItems || 0);

  const trendingQueries = [
    'iPhone 16 Pro',
    'Wireless Earbuds',
    'Gaming Laptop',
    'Running Shoes',
    'Smart Watch',
  ];

  const categoryPills = [
    { label: 'Mobiles', slug: 'smartphones' },
    { label: 'Laptops', slug: 'electronics' },
    { label: 'Fashion', slug: 'fashion' },
    { label: 'Home', slug: 'home-kitchen' },
  ];

  useEffect(() => {
    const handleStorageChange = () => {
      const coins = parseInt(localStorage.getItem('shopkart_supercoins') || '120', 10);
      setSuperCoins(coins);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('shopkart_coins_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('shopkart_coins_updated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (cart?.totalItems !== prevCartTotal.current) {
      setBadgeBouncing(true);
      const timer = setTimeout(() => setBadgeBouncing(false), 600);
      prevCartTotal.current = cart?.totalItems || 0;
      return () => clearTimeout(timer);
    }
  }, [cart?.totalItems]);

  const loadNotifications = React.useCallback(async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list || []);
      const countRes = await api.getUnreadNotificationsCount();
      setUnreadCount(countRes?.unreadCount || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, loadNotifications]);

  // Handle outside click for search suggestions
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Auto-Suggest Query debouncing
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestedProducts([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const data = await api.getProducts({ keyword: searchTerm.trim(), size: 5 });
        const list = Array.isArray(data) ? data : data?.content || [];
        setSuggestedProducts(list.slice(0, 5));
      } catch {
        setSuggestedProducts([]);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setIsSearchFocused(false);
    if (onSearch) {
      onSearch(searchTerm);
    }
    if (currentView !== 'catalog') {
      setCurrentView('catalog');
    }
  };

  const handleSelectSuggestion = (product) => {
    setIsSearchFocused(false);
    setSearchTerm('');
    if (onSelectProduct) {
      onSelectProduct(product.id);
    } else if (onSearch) {
      onSearch(product.title);
    }
  };

  const handleSelectTrending = (query) => {
    setSearchTerm(query);
    setIsSearchFocused(false);
    if (onSearch) {
      onSearch(query);
    }
    if (currentView !== 'catalog') {
      setCurrentView('catalog');
    }
  };

  const handleDemoSwitch = async (role) => {
    await loginDemo(role);
    setShowUserMenu(false);
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      loadNotifications();
    } catch {
      // ignore
    }
  };

  return (
    <header className="bg-gradient-to-r from-[#0A3B74] to-[#002F6C] text-white sticky top-0 z-50 shadow-md border-b border-blue-900/40">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo matching official logo */}
        <div
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
        >
          <img
            src="/logo.png"
            alt="ShopKart"
            className="w-10 h-10 object-contain rounded-md bg-white p-0.5 shadow-sm"
          />
          <div className="flex flex-col leading-none">
            <span className="font-black text-xl tracking-tight text-white flex items-center">
              Shop<span className="text-[#FF7A00]">Kart</span>
            </span>
            <span className="text-[10px] text-amber-300 font-semibold tracking-wider uppercase mt-0.5 hidden sm:inline">
              Shop Smart • Live Better
            </span>
          </div>
        </div>

        {/* Universal Persistent Home Button */}
        <button
          type="button"
          onClick={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md font-semibold text-xs sm:text-sm transition cursor-pointer shrink-0 border ${
            currentView === 'home'
              ? 'bg-white/20 text-white border-white/40 shadow-xs'
              : 'hover:bg-white/10 text-blue-100 hover:text-white border-transparent'
          }`}
          title="Go to Home"
        >
          <Home className="w-4 h-4" />
          <span className="font-bold hidden sm:inline">Home</span>
        </button>

        {/* Predictive Auto-Suggest Search Bar */}
        <div ref={searchContainerRef} className="flex-1 max-w-2xl relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for Products, Brands and More..."
              className="w-full bg-white text-gray-900 placeholder-gray-500 text-xs sm:text-sm px-4 py-2.5 rounded-xs focus:outline-none focus:ring-2 focus:ring-[#FF7A00] pr-24 shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-18 text-gray-400 hover:text-gray-700 transition cursor-pointer p-1"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenVisualSearch}
              className="absolute right-10 text-gray-400 hover:text-[#FF7A00] transition p-1 cursor-pointer"
              title="Visual Search / Search by Image"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="submit"
              className="absolute right-2.5 text-[#0A3B74] hover:text-[#002F6C] transition p-1 cursor-pointer"
              title="Search"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>

          {/* Instant Auto-Suggest Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white text-gray-900 rounded-xs shadow-2xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100">
              {/* Category Search Pills */}
              <div className="p-2.5 bg-gray-50 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">
                  Categories:
                </span>
                {categoryPills.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      setIsSearchFocused(false);
                      if (onSearch) onSearch(c.label);
                    }}
                    className="text-[11px] font-semibold bg-white border border-gray-200 hover:border-[#0A3B74] hover:text-[#0A3B74] px-2.5 py-0.5 rounded-full transition cursor-pointer"
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Trending Searches */}
              {!searchTerm.trim() && (
                <div className="p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#FF7A00]" />
                    <span>Trending Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingQueries.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleSelectTrending(t)}
                        className="text-xs bg-blue-50 text-[#0A3B74] font-medium px-3 py-1 rounded-full hover:bg-blue-100 transition cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Matching Products */}
              {searchTerm.trim() && (
                <div className="max-h-72 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      Searching catalog...
                    </div>
                  ) : suggestedProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No matching products found. Press Enter to search all.
                    </div>
                  ) : (
                    suggestedProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectSuggestion(p)}
                        className="p-2.5 hover:bg-blue-50/70 cursor-pointer flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.primaryImage || (p.imageUrls && p.imageUrls[0])}
                            alt=""
                            className="w-10 h-10 object-contain rounded bg-white border border-gray-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {p.title}
                            </p>
                            <p className="text-[10px] text-gray-500 capitalize">
                              {p.brand} • {p.categoryName || 'Catalog'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-gray-900">
                            ₹{p.price?.toLocaleString('en-IN')}
                          </span>
                          {p.discountPercentage > 0 && (
                            <span className="block text-[10px] font-bold text-[#388E3C]">
                              {p.discountPercentage}% off
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gamification, SuperCoins & Referral Shortcuts */}
        <div className="hidden md:flex items-center gap-2">
          {/* SuperCoins Pill */}
          <button
            onClick={onOpenLedger}
            className="flex items-center gap-1.5 bg-[#002F6C] hover:bg-[#07244C] text-amber-300 px-2.5 py-1 rounded-full text-xs font-black shadow-xs transition cursor-pointer border border-amber-300/30"
            title="View SuperCoins Ledger"
          >
            <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[10px]">
              C
            </span>
            <span>{superCoins} Coins</span>
          </button>

          {/* Daily Streak Trigger */}
          <button
            onClick={onOpenStreak}
            className="flex items-center gap-1 bg-[#FF7A00] hover:bg-[#E66A00] text-white px-2.5 py-1 rounded-full text-xs font-bold transition shadow-xs cursor-pointer"
            title="7-Day Daily Streak Check-in"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Streak</span>
          </button>

          {/* Referral Trigger */}
          <button
            onClick={onOpenReferral}
            className="flex items-center gap-1 text-white hover:text-amber-200 text-xs font-semibold px-2 py-1 transition cursor-pointer"
            title="Refer & Earn ₹100"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Invite & Earn</span>
          </button>
        </div>

        {/* Right Nav Action Links */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0 text-sm font-medium">
          {/* User Account / Login Button */}
          <div className="relative">
            {isAuthenticated ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs hover:bg-[#002F6C] transition text-white font-medium cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span className="max-w-[100px] truncate hidden sm:inline">{user?.name}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="bg-white text-[#0A3B74] font-bold px-5 sm:px-7 py-1.5 rounded-xs hover:bg-amber-50 transition shadow-xs text-xs sm:text-sm cursor-pointer"
              >
                Login
              </button>
            )}

            {/* Account Dropdown */}
            {showUserMenu && isAuthenticated && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded-xs shadow-xl border border-gray-100 py-1 z-50"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500">Signed in as</p>
                  <p className="font-semibold text-sm truncate text-gray-900">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#0A3B74]">
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCurrentView('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#0A3B74]" /> My Profile
                </button>

                <button
                  onClick={() => {
                    setCurrentView('orders');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 cursor-pointer"
                >
                  <Package className="w-4 h-4 text-[#0A3B74]" /> Orders
                </button>

                <button
                  onClick={() => {
                    setCurrentView('wishlist');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-[#0A3B74]" /> Wishlist
                </button>

                <button
                  onClick={() => {
                    if (onOpenLedger) onOpenLedger();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-[#FF7A00]" /> SuperCoins Wallet ({superCoins})
                </button>

                {/* Role Switcher for verification */}
                <div className="border-t border-gray-100 my-1 py-1 bg-blue-50/50">
                  <p className="px-4 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Quick Role Switch
                  </p>
                  <div className="flex px-3 gap-1">
                    <button
                      onClick={() => handleDemoSwitch('BUYER')}
                      className={`flex-1 text-[10px] py-1 rounded font-semibold ${
                        user?.role === 'BUYER'
                          ? 'bg-[#0A3B74] text-white border-blue-800'
                          : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                    >
                      Buyer
                    </button>
                    <button
                      onClick={() => handleDemoSwitch('SELLER')}
                      className={`flex-1 text-[10px] py-1 rounded font-semibold ${
                        user?.role === 'SELLER'
                          ? 'bg-[#0A3B74] text-white border-blue-800'
                          : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                    >
                      Seller
                    </button>
                    <button
                      onClick={() => handleDemoSwitch('ADMIN')}
                      className={`flex-1 text-[10px] py-1 rounded font-semibold ${
                        user?.role === 'ADMIN'
                          ? 'bg-[#0A3B74] text-white border-blue-800'
                          : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Seller Link */}
          {isSeller || isAdmin ? (
            <button
              onClick={() => setCurrentView('seller')}
              className="flex items-center gap-1.5 hover:text-amber-300 transition text-xs font-semibold cursor-pointer"
              title="Seller Portal"
            >
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Seller Hub</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (!isAuthenticated) openAuthModal('seller_reg');
                else handleDemoSwitch('SELLER');
              }}
              className="flex items-center gap-1.5 hover:text-amber-300 transition text-xs font-semibold cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Become Seller</span>
            </button>
          )}

          {/* Admin Dashboard Link */}
          {isAdmin && (
            <button
              onClick={() => setCurrentView('admin')}
              className="flex items-center gap-1.5 bg-[#FF7A00] text-white font-bold px-2.5 py-1 rounded-xs hover:bg-[#E66A00] transition text-xs cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
          )}

          {/* Notifications Bell */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) loadNotifications();
                }}
                className="relative p-1 hover:text-amber-300 transition flex items-center cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF7A00] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Center */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-xs shadow-xl border border-gray-100 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-[#0A3B74] hover:underline font-semibold cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-xs">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs ${n.read ? 'bg-white' : 'bg-blue-50/50'}`}
                        >
                          <div className="font-bold text-gray-900">{n.title}</div>
                          <div className="text-gray-600 mt-0.5">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart with Item Counter & Bouncing Badge */}
          <button
            id="navbar-cart-btn"
            onClick={() => setCurrentView('cart')}
            className="flex items-center gap-1.5 hover:text-amber-300 transition relative cursor-pointer"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cart.totalItems > 0 && (
                <span
                  className={`absolute -top-2 -right-2 bg-[#FF7A00] text-white text-[10px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center shadow-xs ${
                    badgeBouncing ? 'animate-cart-bounce' : ''
                  }`}
                >
                  {cart.totalItems}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-bold">Cart</span>
          </button>
        </div>
      </div>
    </header>
  );
}
