import React, { useState } from 'react';
import { X, User, Lock, Mail, Phone, Store, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginModal({ isOpen, onClose, initialMode = 'login' }) {
  const { login, register, loginDemo } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'seller_reg'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          phone,
          role: mode === 'seller_reg' ? 'SELLER' : 'BUYER',
          storeName: mode === 'seller_reg' ? storeName : undefined,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      await loginDemo(role);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xs shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 z-10 p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Flipkart Signature Blue Branding Banner */}
        <div className="bg-[#2874F0] text-white p-8 md:w-5/12 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === 'login'
                ? 'Login'
                : mode === 'seller_reg'
                ? 'Join as Seller'
                : 'Looks like you’re new here!'}
            </h2>
            <p className="text-blue-100 text-sm mt-3 leading-relaxed">
              {mode === 'login'
                ? 'Get access to your Orders, Wishlist, Recommendations & Fast Delivery.'
                : mode === 'seller_reg'
                ? 'Reach millions of buyers across India on ShopKart’s marketplace.'
                : 'Sign up with your details to start shopping on ShopKart.'}
            </p>
          </div>

          <div className="mt-8 flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="ShopKart"
              className="w-10 h-10 object-contain bg-white rounded p-1"
            />
            <div>
              <div className="font-bold text-sm">ShopKart</div>
              <div className="text-[11px] text-yellow-300 italic">Shop Smart • Live Better</div>
            </div>
          </div>
        </div>

        {/* Right Side: Form & Quick Logins */}
        <div className="p-8 md:w-7/12 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded border border-red-200">
                {error}
              </div>
            )}

            {mode !== 'login' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {mode === 'seller_reg' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Store / Business Name
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Apex Electronics Hub"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                />
              </div>
            </div>

            {mode !== 'login' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-tight">
              By continuing, you agree to ShopKart’s Terms of Use and Privacy Policy.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FB641B] hover:bg-[#e85b17] text-white font-bold py-2.5 rounded shadow-sm transition text-sm cursor-pointer"
            >
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Login'
                : mode === 'seller_reg'
                ? 'Register as Seller'
                : 'Continue'}
            </button>
          </form>

          {/* Quick Demo Logins for instant evaluation */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <span className="text-[11px] font-semibold text-gray-500 block mb-2 uppercase">
              1-Click Demo Accounts (Instant Access):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('BUYER')}
                className="text-xs py-1.5 px-2 bg-blue-50 text-[#2874F0] hover:bg-blue-100 font-semibold rounded border border-blue-200 transition text-center cursor-pointer"
              >
                Buyer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('SELLER')}
                className="text-xs py-1.5 px-2 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold rounded border border-amber-200 transition text-center cursor-pointer"
              >
                Seller
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="text-xs py-1.5 px-2 bg-purple-50 text-purple-800 hover:bg-purple-100 font-semibold rounded border border-purple-200 transition text-center cursor-pointer"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="mt-4 text-center text-xs text-gray-600">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-[#2874F0] font-semibold hover:underline cursor-pointer"
              >
                New to ShopKart? Create an account
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#2874F0] font-semibold hover:underline cursor-pointer"
              >
                Existing User? Log in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
