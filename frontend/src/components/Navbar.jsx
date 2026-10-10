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
  TrendingUp,
  X,
  Share2,
  Camera,
  Home,
  Menu,
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
  const [searchCategory, setSearchCategory] = useState('all');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(true);
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
  const headerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const userMenuRef = useRef(null);
  const userMenuButtonRef = useRef(null);

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
    { label: 'Mobiles', slug: 'mobiles' },
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
      const insideDesktop = searchContainerRef.current && searchContainerRef.current.contains(e.target);
      const insideMobile = mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(e.target);
      if (!insideDesktop && !insideMobile) {
        setIsSearchFocused(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target) &&
        userMenuButtonRef.current &&
        !userMenuButtonRef.current.contains(e.target)
      ) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Synchronize dynamic header height for sticky CategoryBar
  useEffect(() => {
    if (!headerRef.current) return;
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--navbar-height', `${height}px`);
      }
    };
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(headerRef.current);
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  // Lock body scroll when mobile drawer is open, and auto-close when resized to desktop (>= 1024px)
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

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
    const cat = searchCategory && searchCategory !== 'all' ? searchCategory : '';
    if (onSearch) {
      onSearch(searchTerm.trim(), cat);
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

  const renderSearchBar = (isMobile) => (
    <form
      onSubmit={handleSearchSubmit}
      className="relative flex items-center h-10 w-full bg-white rounded-sm shadow-xs border border-gray-200 focus-within:ring-2 focus-within:ring-[#FF7A00] focus-within:border-transparent transition-all box-border"
    >
      {/* Integrated category selector dropdown to the left */}
      <div className="relative shrink-0 h-full flex items-center border-r border-gray-200 bg-gray-50 rounded-l-sm">
        <select
          value={searchCategory}
          onChange={(e) => setSearchCategory(e.target.value)}
          className="h-full appearance-none bg-transparent hover:bg-gray-100 text-gray-700 text-xs font-semibold pl-2.5 pr-6 py-0 rounded-l-sm focus:outline-none cursor-pointer border-none transition-colors"
          aria-label="Filter by Category"
        >
          <option value="all">All</option>
          <option value="mobiles">Mobiles</option>
          <option value="electronics">Electronics</option>
          <option value="fashion">Fashion</option>
          <option value="home-kitchen">Home</option>
          <option value="appliances">Appliances</option>
        </select>
        <ChevronDown className="w-3 h-3 text-gray-500 absolute right-1.5 pointer-events-none" />
      </div>

      <input
        ref={isMobile ? searchInputRef : undefined}
        type="text"
        value={searchTerm}
        onFocus={() => setIsSearchFocused(true)}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search for Products, Brands and More..."
        className="flex-1 min-w-0 h-full bg-transparent text-gray-900 placeholder-gray-500 text-xs sm:text-sm px-3 py-0 focus:outline-none"
      />

      {/* Right side controls: Clear, Camera, and Search button with zero vertical jitter */}
      <div className="flex items-center h-full gap-0.5 sm:gap-1 pr-2 shrink-0">
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="h-full text-gray-400 hover:text-gray-700 transition cursor-pointer px-1 flex items-center justify-center"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onOpenVisualSearch}
          className="h-full text-gray-400 hover:text-[#FF7A00] transition px-1 cursor-pointer flex items-center justify-center"
          title="Visual Search / Search by Image"
        >
          <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          type="submit"
          className="h-full text-[#0A3B74] hover:text-[#002F6C] transition px-1 cursor-pointer flex items-center justify-center"
          title="Search"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </form>
  );

  const renderSearchDropdown = () => (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white text-gray-900 rounded-sm shadow-2xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100">
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
  );

  const renderNotifications = () => (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications) loadNotifications();
        }}
        className="relative p-1.5 hover:text-amber-300 transition flex items-center cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#FF7A00] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-md shadow-xl border border-gray-100 z-50">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
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
  );

  const renderAccountDropdown = () => (
    <div
      ref={userMenuRef}
      className="absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded-lg shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in duration-150"
    >
      {/* User Header / Guest Info */}
      {isAuthenticated ? (
        <div className="px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/40">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Signed in as</p>
          <p className="font-bold text-sm truncate text-gray-900">{user?.name || user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A3B74] text-white">
              {user?.role}
            </span>
            <span className="text-[11px] text-gray-500 truncate">{user?.email}</span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/40">
          <p className="font-bold text-sm text-gray-900">Welcome to ShopKart</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-2.5">Sign in to access your orders & rewards</p>
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(false);
              openAuthModal('login');
            }}
            className="w-full bg-[#0A3B74] hover:bg-[#002F6C] text-white font-bold text-xs py-2 px-3 rounded-md transition shadow-xs cursor-pointer text-center"
          >
            Login / Sign Up
          </button>
        </div>
      )}

      {/* Consolidated Secondary Marketing Links Hub */}
      <div className="px-3 py-2 border-b border-gray-100 bg-amber-50/40">
        <p className="px-1 text-[10px] font-extrabold text-amber-900/70 uppercase tracking-wider mb-1.5">
          Rewards & Gamification
        </p>
        <div className="space-y-1">
          {/* 135 Coins SuperCoins Pill */}
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(false);
              if (onOpenLedger) onOpenLedger();
            }}
            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-amber-100/70 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xs shadow-xs">
                C
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 group-hover:text-[#0A3B74]">
                  SuperCoins Wallet
                </span>
                <span className="block text-[10px] text-gray-500">View coin balance & ledger</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 bg-amber-200 text-amber-900 text-xs font-black px-2 py-0.5 rounded-full border border-amber-300">
              {superCoins} Coins
            </span>
          </button>

          {/* Daily Streak Trigger */}
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(false);
              if (onOpenStreak) onOpenStreak();
            }}
            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-orange-50 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FF7A00] text-white flex items-center justify-center shadow-xs">
                <Flame className="w-3.5 h-3.5 fill-current" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 group-hover:text-[#FF7A00]">
                  Daily Streak Check-in
                </span>
                <span className="block text-[10px] text-gray-500">7-day continuous bonus</span>
              </div>
            </div>
            <span className="bg-[#FF7A00] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
              +50 Coins
            </span>
          </button>

          {/* Referral Share Trigger */}
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(false);
              if (onOpenReferral) onOpenReferral();
            }}
            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-blue-50 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0A3B74] text-white flex items-center justify-center shadow-xs">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 group-hover:text-[#0A3B74]">
                  Invite & Earn
                </span>
                <span className="block text-[10px] text-gray-500">Refer friends & get ₹100</span>
              </div>
            </div>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
              Get ₹100
            </span>
          </button>
        </div>
      </div>

      {/* Account Links & Mode Controls */}
      <div className="py-1">
        {isSeller ? (
          <>
            <button
              type="button"
              onClick={() => {
                handleDemoSwitch('BUYER');
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 cursor-pointer font-medium"
            >
              <User className="w-4 h-4 text-[#0A3B74]" /> Switch to Buyer Mode
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('seller');
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-xs hover:bg-blue-50 flex items-center gap-2.5 text-[#0A3B74] font-bold cursor-pointer"
            >
              <Store className="w-4 h-4 text-[#FF7A00]" /> Seller Dashboard
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('profile');
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 cursor-pointer font-medium"
            >
              <User className="w-4 h-4 text-[#0A3B74]" /> Account Settings
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer font-medium"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setCurrentView('profile');
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 cursor-pointer font-medium"
            >
              <User className="w-4 h-4 text-[#0A3B74]" /> Account Settings
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('orders');
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 cursor-pointer font-medium"
            >
              <Package className="w-4 h-4 text-[#0A3B74]" /> Orders
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('wishlist');
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 cursor-pointer font-medium"
            >
              <Heart className="w-4 h-4 text-[#0A3B74]" /> Wishlist
            </button>
          </>
        )}
      </div>

      {/* Role Switcher */}
      <div className="border-t border-gray-100 my-1 py-1.5 bg-gray-50/70">
        <p className="px-4 py-0.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Quick Role Switch
        </p>
        <div className="flex px-3 gap-1 mt-1">
          <button
            type="button"
            onClick={() => handleDemoSwitch('BUYER')}
            className={`flex-1 text-[10px] py-1 rounded font-semibold transition ${
              user?.role === 'BUYER'
                ? 'bg-[#0A3B74] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Buyer
          </button>
          <button
            type="button"
            onClick={() => handleDemoSwitch('SELLER')}
            className={`flex-1 text-[10px] py-1 rounded font-semibold transition ${
              user?.role === 'SELLER'
                ? 'bg-[#0A3B74] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Seller
          </button>
          <button
            type="button"
            onClick={() => handleDemoSwitch('ADMIN')}
            className={`flex-1 text-[10px] py-1 rounded font-semibold transition ${
              user?.role === 'ADMIN'
                ? 'bg-[#0A3B74] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Log Out */}
      {isAuthenticated && (
        <div className="border-t border-gray-100 pt-1">
          <button
            type="button"
            onClick={() => {
              logout();
              setShowUserMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer font-medium"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );

  return (
    <header ref={headerRef} className="bg-gradient-to-r from-[#0A3B74] to-[#002F6C] text-white sticky top-0 z-40 shadow-md border-b border-blue-900/40 w-full">
      <div className="w-full max-w-[1280px] mx-auto px-3 md:px-6">
        {/* =========================================================================
            DESKTOP HEADER ARCHITECTURE (>= 1024px)
            Fixed horizontal header: Brand Logo, Expandable Search Bar, Action Icons
            ========================================================================= */}
        <div className="hidden lg:flex items-center justify-between gap-5 py-2.5">
          {/* Brand Logo & Tagline (Isolated from vertical expansion) */}
          <div className="flex items-center gap-3 xl:gap-4 shrink-0">
            <div
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
            >
              <img
                src="/logo.png"
                alt="ShopKart"
                className="w-10 h-10 object-contain rounded-md bg-white p-0.5 shadow-xs shrink-0"
              />
              <div className="flex flex-col justify-center leading-none">
                <span className="font-black text-2xl tracking-tight text-white flex items-center whitespace-nowrap">
                  Shop<span className="text-[#FF7A00]">Kart</span>
                </span>
                <span className="text-[10px] text-amber-300 font-semibold tracking-wider uppercase mt-1 whitespace-nowrap">
                  Shop Smart • Live Better
                </span>
              </div>
            </div>

            {/* Persistent Home Button (Responsive to viewport room) */}
            <button
              type="button"
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition cursor-pointer shrink-0 border ${
                currentView === 'home'
                  ? 'bg-white/20 text-white border-white/40 shadow-xs'
                  : 'hover:bg-white/10 text-blue-100 hover:text-white border-transparent'
              }`}
              title="Go to Home"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
          </div>

          {/* Expandable Search Bar */}
          <div
            ref={searchContainerRef}
            className="flex-1 max-w-md lg:focus-within:max-w-xl xl:focus-within:max-w-2xl transition-all duration-300 ease-in-out relative"
          >
            {renderSearchBar(false)}
            {isSearchFocused && renderSearchDropdown()}
          </div>

          {/* Desktop Action Icons */}
          <div className="flex items-center gap-4 xl:gap-5 shrink-0 text-sm font-medium">
            {/* Become a Seller Link (Hidden when authenticated as a Seller) */}
            {!isSeller && (
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) openAuthModal('seller_reg');
                  else handleDemoSwitch('SELLER');
                }}
                className="flex items-center gap-1.5 hover:text-amber-300 transition text-xs font-semibold cursor-pointer"
                title="Become a Seller"
              >
                <Store className="w-4 h-4" />
                <span>Become a Seller</span>
              </button>
            )}

            {/* Admin Dashboard Link */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className="flex items-center gap-1.5 bg-[#FF7A00] text-white font-bold px-2.5 py-1 rounded-sm hover:bg-[#E66A00] transition text-xs cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}

            {/* Notifications Bell */}
            {isAuthenticated && renderNotifications()}

            {/* Account Dropdown Trigger (Contains Consolidated Rewards & Marketing) */}
            <div className="relative">
              <button
                ref={userMenuButtonRef}
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition text-white font-medium cursor-pointer border border-transparent hover:border-white/20"
              >
                <User className="w-4 h-4" />
                <span className="max-w-[110px] truncate text-xs font-bold">
                  {isAuthenticated ? (isSeller ? (user?.storeName || user?.name || 'Seller') : (user?.name || 'Sign In')) : 'Sign In'}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showUserMenu && renderAccountDropdown()}
            </div>

            {/* Cart with Item Counter & Bouncing Badge */}
            <button
              id="navbar-cart-btn"
              type="button"
              onClick={() => setCurrentView('cart')}
              className="flex items-center gap-2 hover:text-amber-300 transition relative cursor-pointer px-2 py-1"
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
              <span className="font-bold text-xs">Cart</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            MOBILE HEADER ARCHITECTURE (< 1024px)
            Compact sticky header: Hamburger Icon, Centered Brand Logo, Search trigger, Cart
            Followed by search bar and swipeable category track below
            ========================================================================= */}
        <div className="lg:hidden flex flex-col py-2 gap-2">
          {/* Top Row: Hamburger | Centered Brand Logo | Search + Cart */}
          <div className="relative flex items-center justify-between min-h-[40px]">
            {/* Hamburger Menu Icon */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-md text-white hover:bg-white/10 transition cursor-pointer z-10"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Mathematically Centered Brand Logo */}
            <div
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 cursor-pointer select-none pointer-events-auto"
            >
              <img
                src="/logo.png"
                alt="ShopKart"
                className="w-8 h-8 object-contain rounded-md bg-white p-0.5 shadow-xs shrink-0"
              />
              <span className="font-black text-xl tracking-tight text-white whitespace-nowrap">
                Shop<span className="text-[#FF7A00]">Kart</span>
              </span>
            </div>

            {/* Right Controls: Search Trigger & Cart Badge */}
            <div className="flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={() => {
                  setIsMobileSearchOpen((prev) => !prev);
                  setTimeout(() => {
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }, 100);
                }}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  isMobileSearchOpen ? 'text-amber-300 bg-white/10' : 'text-white hover:bg-white/10'
                }`}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                id="mobile-navbar-cart-btn"
                type="button"
                onClick={() => setCurrentView('cart')}
                className="p-1.5 relative text-white hover:text-amber-300 transition cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.totalItems > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 bg-[#FF7A00] text-white text-[10px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center shadow-xs ${
                      badgeBouncing ? 'animate-cart-bounce' : ''
                    }`}
                  >
                    {cart.totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar Row below header top bar */}
          {isMobileSearchOpen && (
            <div ref={mobileSearchContainerRef} className="w-full relative pb-1">
              {renderSearchBar(true)}
              {isSearchFocused && renderSearchDropdown()}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          RESPONSIVE MOBILE SIDE DRAWER
          Opens when Hamburger Icon is clicked
          ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          {/* Backdrop Blur */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Side Drawer Content Panel */}
          <div className="fixed inset-y-0 left-0 w-[300px] max-w-[85vw] bg-white text-gray-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-300 overflow-y-auto">
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-[#0A3B74] to-[#002F6C] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="ShopKart"
                  className="w-8 h-8 object-contain rounded bg-white p-0.5"
                />
                <span className="font-black text-lg tracking-tight">
                  Shop<span className="text-[#FF7A00]">Kart</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-white hover:text-amber-300 rounded-md transition cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Greeting / Auth Status */}
            <div className="p-4 border-b border-gray-100 bg-blue-50/50">
              {isAuthenticated ? (
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0A3B74] text-white font-black flex items-center justify-center text-sm shadow-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A3B74] text-white">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-bold text-sm text-gray-900">Welcome to ShopKart</p>
                  <p className="text-xs text-gray-500">Sign in to access your orders & rewards</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full bg-[#0A3B74] text-white font-bold text-xs py-2 rounded-md hover:bg-[#002F6C] transition shadow-xs cursor-pointer"
                  >
                    Login / Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Consolidated Marketing & Rewards Strip in Drawer */}
            <div className="p-3 border-b border-gray-100 bg-amber-50/40 space-y-2">
              <p className="text-[10px] font-extrabold text-amber-900/70 uppercase tracking-wider px-1">
                Rewards & Gamification
              </p>

              {/* SuperCoins Pill */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenLedger) onOpenLedger();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-amber-200/80 hover:border-amber-400 transition cursor-pointer shadow-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xs shadow-xs">
                    C
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">SuperCoins Wallet</span>
                    <span className="text-[10px] text-gray-500">View coin balance & ledger</span>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-900 font-black text-xs px-2.5 py-1 rounded-full border border-amber-300">
                  {superCoins} Coins
                </span>
              </button>

              {/* Daily Streak Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenStreak) onOpenStreak();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-orange-200/80 hover:border-orange-400 transition cursor-pointer shadow-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#FF7A00] text-white flex items-center justify-center shadow-xs">
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">7-Day Daily Streak</span>
                    <span className="text-[10px] text-gray-500">Claim continuous check-in bonus</span>
                  </div>
                </div>
                <span className="bg-[#FF7A00] text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                  +50
                </span>
              </button>

              {/* Invite & Earn Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenReferral) onOpenReferral();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-blue-200/80 hover:border-blue-400 transition cursor-pointer shadow-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#0A3B74] text-white flex items-center justify-center shadow-xs">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Invite & Earn</span>
                    <span className="text-[10px] text-gray-500">Share referral code with friends</span>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                  ₹100
                </span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="p-2 space-y-1 divide-y divide-gray-100">
              <div className="space-y-0.5 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('home');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md hover:bg-gray-100 transition text-gray-800 cursor-pointer text-left"
                >
                  <Home className="w-4 h-4 text-[#0A3B74]" /> Home
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('catalog');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md hover:bg-gray-100 transition text-gray-800 cursor-pointer text-left"
                >
                  <Search className="w-4 h-4 text-[#0A3B74]" /> All Products
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenVisualSearch();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md hover:bg-gray-100 transition text-gray-800 cursor-pointer text-left"
                >
                  <Camera className="w-4 h-4 text-[#FF7A00]" /> Visual Search / Search by Image
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('orders');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md hover:bg-gray-100 transition text-gray-800 cursor-pointer text-left"
                >
                  <Package className="w-4 h-4 text-[#0A3B74]" /> My Orders
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('wishlist');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md hover:bg-gray-100 transition text-gray-800 cursor-pointer text-left"
                >
                  <Heart className="w-4 h-4 text-[#0A3B74]" /> Wishlist
                </button>

                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowNotifications(true);
                      loadNotifications();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md hover:bg-gray-100 transition text-gray-800 cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-[#0A3B74]" /> Notifications
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-[#FF7A00] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                        {unreadCount} new
                      </span>
                    )}
                  </button>
                )}
              </div>

              <div className="pt-2 space-y-0.5 pb-2">
                {!isSeller ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (!isAuthenticated) openAuthModal('seller_reg');
                      else handleDemoSwitch('SELLER');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md hover:bg-gray-100 transition text-gray-800 cursor-pointer text-left"
                  >
                    <Store className="w-4 h-4 text-[#0A3B74]" /> Become a Seller
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleDemoSwitch('BUYER');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md hover:bg-gray-100 transition text-gray-800 cursor-pointer text-left"
                    >
                      <User className="w-4 h-4 text-[#0A3B74]" /> Switch to Buyer Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setCurrentView('seller');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md hover:bg-gray-100 transition text-[#0A3B74] cursor-pointer text-left font-bold"
                    >
                      <Store className="w-4 h-4 text-[#FF7A00]" /> Seller Dashboard
                    </button>
                  </>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setCurrentView('admin');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md hover:bg-gray-100 transition text-gray-800 cursor-pointer text-left"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#FF7A00]" /> Admin Dashboard
                  </button>
                )}
              </div>

              {/* Quick Demo Role Switcher in Drawer */}
              <div className="pt-2">
                <p className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Quick Role Switch
                </p>
                <div className="flex gap-1.5 px-3 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleDemoSwitch('BUYER');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex-1 text-[10px] py-1.5 rounded font-semibold transition ${
                      user?.role === 'BUYER'
                        ? 'bg-[#0A3B74] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDemoSwitch('SELLER');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex-1 text-[10px] py-1.5 rounded font-semibold transition ${
                      user?.role === 'SELLER'
                        ? 'bg-[#0A3B74] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Seller
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDemoSwitch('ADMIN');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex-1 text-[10px] py-1.5 rounded font-semibold transition ${
                      user?.role === 'ADMIN'
                        ? 'bg-[#0A3B74] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Logout Button if Authenticated */}
              {isAuthenticated && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Notification Modal (Accessible on Mobile Screens) */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="w-full max-w-sm bg-white text-gray-800 rounded-lg shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-[#0A3B74] text-white flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider">Notifications ({unreadCount})</span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-amber-300 hover:underline font-semibold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:text-amber-300 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
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
        </div>
      )}
    </header>
  );
}
