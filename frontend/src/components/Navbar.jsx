import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../api/client';

export function Navbar({ onSearch, currentView, setCurrentView, openAuthModal }) {
  const { user, isAuthenticated, isSeller, isAdmin, logout, loginDemo } = useAuth();
  const { cart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list || []);
      const countRes = await api.getUnreadNotificationsCount();
      setUnreadCount(countRes?.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
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
    } catch (e) {
      // ignore
    }
  };

  return (
    <header className="bg-[#2874F0] text-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
        >
          <img
            src="/favicon.png"
            alt="ShopKart"
            className="w-10 h-10 object-contain rounded bg-white p-0.5 shadow-xs"
          />
          <div className="flex flex-col leading-none">
            <span className="font-black text-xl tracking-tight text-white flex items-center">
              Shop<span className="text-[#FFE500]">Kart</span>
            </span>
            <span className="text-[10px] text-yellow-300 font-semibold tracking-wider uppercase mt-0.5">
              Shop Smart • Live Better
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-2xl relative"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for Products, Brands and More..."
              className="w-full bg-white text-gray-800 placeholder-gray-500 text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-10"
            />
            <button
              type="submit"
              className="absolute right-2.5 text-[#2874F0] hover:text-blue-700 transition"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Right Nav Action Links */}
        <div className="flex items-center gap-6 shrink-0 text-sm font-medium">
          {/* User Account / Login Button */}
          <div className="relative">
            {isAuthenticated ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm hover:bg-blue-600 transition text-white font-medium"
              >
                <User className="w-4 h-4" />
                <span className="max-w-[120px] truncate">{user?.name}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="bg-white text-[#2874F0] font-semibold px-7 py-1.5 rounded-sm hover:bg-blue-50 transition shadow-xs text-sm"
              >
                Login
              </button>
            )}

            {/* Account Dropdown */}
            {showUserMenu && isAuthenticated && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded-sm shadow-xl border border-gray-100 py-1 z-50"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500">Signed in as</p>
                  <p className="font-semibold text-sm truncate text-gray-900">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#2874F0]">
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCurrentView('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                >
                  <User className="w-4 h-4 text-[#2874F0]" /> My Profile
                </button>

                <button
                  onClick={() => {
                    setCurrentView('orders');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                >
                  <Package className="w-4 h-4 text-[#2874F0]" /> Orders
                </button>

                <button
                  onClick={() => {
                    setCurrentView('wishlist');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                >
                  <Heart className="w-4 h-4 text-[#2874F0]" /> Wishlist
                </button>

                {/* Role Switcher for verification */}
                <div className="border-t border-gray-100 my-1 py-1 bg-blue-50/50">
                  <p className="px-4 py-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Quick Role Switch
                  </p>
                  <div className="flex px-3 gap-1">
                    <button
                      onClick={() => handleDemoSwitch('BUYER')}
                      className={`flex-1 text-[11px] py-1 rounded border font-medium ${
                        user?.role === 'BUYER' ? 'bg-[#2874F0] text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      Buyer
                    </button>
                    <button
                      onClick={() => handleDemoSwitch('SELLER')}
                      className={`flex-1 text-[11px] py-1 rounded border font-medium ${
                        user?.role === 'SELLER' ? 'bg-[#2874F0] text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      Seller
                    </button>
                    <button
                      onClick={() => handleDemoSwitch('ADMIN')}
                      className={`flex-1 text-[11px] py-1 rounded border font-medium ${
                        user?.role === 'ADMIN' ? 'bg-[#2874F0] text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'
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
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Become a Seller / Seller Dashboard Link */}
          {isSeller || isAdmin ? (
            <button
              onClick={() => setCurrentView('seller')}
              className="flex items-center gap-1.5 hover:text-yellow-300 transition"
              title="Seller Portal"
            >
              <Store className="w-4 h-4" />
              <span>Seller Hub</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (!isAuthenticated) openAuthModal('seller_reg');
                else handleDemoSwitch('SELLER');
              }}
              className="flex items-center gap-1.5 hover:text-yellow-300 transition"
            >
              <Store className="w-4 h-4" />
              <span>Become a Seller</span>
            </button>
          )}

          {/* Admin Dashboard Link */}
          {isAdmin && (
            <button
              onClick={() => setCurrentView('admin')}
              className="flex items-center gap-1.5 bg-yellow-400 text-gray-900 font-semibold px-2.5 py-1 rounded-sm hover:bg-yellow-300 transition text-xs"
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
                className="relative p-1 hover:text-yellow-300 transition flex items-center"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FB641B] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Center */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-sm shadow-xl border border-gray-100 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-[#2874F0] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs ${n.read ? 'bg-white' : 'bg-blue-50/50'}`}
                        >
                          <div className="font-semibold text-gray-900">{n.title}</div>
                          <div className="text-gray-600 mt-0.5">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart with Item Counter Badge */}
          <button
            onClick={() => setCurrentView('cart')}
            className="flex items-center gap-1.5 hover:text-yellow-300 transition relative"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cart.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FB641B] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.totalItems}
                </span>
              )}
            </div>
            <span>Cart</span>
          </button>
        </div>
      </div>
    </header>
  );
}
