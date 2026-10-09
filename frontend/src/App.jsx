import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { CategoryBar } from './components/CategoryBar';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { DailyStreakModal } from './components/DailyStreakModal';
import { SuperCoinsLedgerModal } from './components/SuperCoinsLedgerModal';
import { ReferralModal } from './components/ReferralModal';
import { AbandonedCartToast } from './components/AbandonedCartToast';
import { VisualSearchModal } from './components/VisualSearchModal';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { SellerPortalPage } from './pages/SellerPortalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { api } from './api/client';

function MainApp() {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [wishlistIds, setWishlistIds] = useState([]);

  // Gamification, Discovery & Retention Modals
  const [dailyStreakOpen, setDailyStreakOpen] = useState(false);
  const [superCoinsLedgerOpen, setSuperCoinsLedgerOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);

  const loadWishlistIds = React.useCallback(async () => {
    try {
      const list = await api.getWishlist();
      setWishlistIds((list || []).map((p) => p.id));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlistIds();
    } else {
      setWishlistIds([]);
    }
  }, [isAuthenticated, loadWishlistIds]);

  const handleWishlistToggle = async (productId) => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    try {
      await api.toggleWishlist(productId);
      if (wishlistIds.includes(productId)) {
        setWishlistIds(wishlistIds.filter((id) => id !== productId));
      } else {
        setWishlistIds([...wishlistIds, productId]);
      }
    } catch (e) {
      alert(e.message || 'Failed to update wishlist');
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedProductId(id);
    setCurrentView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (slug) => {
    setSelectedCategory(slug);
    setSearchKeyword('');
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query) => {
    setSearchKeyword(query);
    setSelectedCategory('');
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setCurrentView('order_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F3F6] text-[#212121]">
      {/* Global Navigation Bar */}
      <Navbar
        onSearch={handleSearch}
        currentView={currentView}
        setCurrentView={setCurrentView}
        openAuthModal={openAuthModal}
        onOpenStreak={() => setDailyStreakOpen(true)}
        onOpenLedger={() => setSuperCoinsLedgerOpen(true)}
        onOpenReferral={() => setReferralModalOpen(true)}
        onOpenVisualSearch={() => setVisualSearchOpen(true)}
        onSelectProduct={handleSelectProduct}
      />

      {/* Subcategory Strip (shown on home and catalog) */}
      {(currentView === 'home' || currentView === 'catalog') && (
        <CategoryBar
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            onSelectProduct={handleSelectProduct}
            onSelectCategory={handleSelectCategory}
            onViewCatalog={() => setCurrentView('catalog')}
            onWishlistToggle={handleWishlistToggle}
            wishlistIds={wishlistIds}
            onOpenStreak={() => setDailyStreakOpen(true)}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogPage
            initialCategory={selectedCategory}
            initialKeyword={searchKeyword}
            onSelectProduct={handleSelectProduct}
            onWishlistToggle={handleWishlistToggle}
            wishlistIds={wishlistIds}
          />
        )}

        {currentView === 'product' && (
          <ProductDetailPage
            productId={selectedProductId}
            onBack={() => setCurrentView('home')}
            onProceedToCheckout={() => setCurrentView('checkout')}
            onWishlistToggle={handleWishlistToggle}
            isWishlisted={wishlistIds.includes(selectedProductId)}
          />
        )}

        {currentView === 'cart' && (
          <CartPage
            onProceedToCheckout={() => setCurrentView('checkout')}
            onViewProduct={handleSelectProduct}
            onContinueShopping={() => setCurrentView('home')}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutPage
            onOrderPlaced={(orderId) => {
              setSelectedOrderId(orderId);
              setCurrentView('order_detail');
            }}
            onViewOrders={() => setCurrentView('orders')}
          />
        )}

        {currentView === 'orders' && (
          <OrdersPage
            onViewOrder={handleViewOrder}
            onViewProduct={handleSelectProduct}
          />
        )}

        {currentView === 'order_detail' && (
          <OrderDetailPage
            orderId={selectedOrderId}
            onBack={() => setCurrentView('orders')}
            onViewProduct={handleSelectProduct}
          />
        )}

        {currentView === 'wishlist' && (
          <WishlistPage
            onSelectProduct={handleSelectProduct}
            onContinueShopping={() => setCurrentView('home')}
          />
        )}

        {currentView === 'profile' && <ProfilePage />}

        {currentView === 'seller' && (
          <SellerPortalPage onViewProduct={handleSelectProduct} />
        )}

        {currentView === 'admin' && (
          <AdminDashboardPage onViewOrder={handleViewOrder} />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Automated Abandoned Cart Toast Mock (Agent 13) */}
      {currentView !== 'checkout' && currentView !== 'cart' && (
        <AbandonedCartToast onResumeCheckout={() => setCurrentView('checkout')} />
      )}

      {/* Authentication Modal */}
      <LoginModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* 7-Day Daily Check-in Streak Modal (Agent 11) */}
      <DailyStreakModal
        isOpen={dailyStreakOpen}
        onClose={() => setDailyStreakOpen(false)}
      />

      {/* SuperCoins Wallet Ledger Modal (Agent 11) */}
      <SuperCoinsLedgerModal
        isOpen={superCoinsLedgerOpen}
        onClose={() => setSuperCoinsLedgerOpen(false)}
      />

      {/* Shareable Referral Modal (Agent 13) */}
      <ReferralModal
        isOpen={referralModalOpen}
        onClose={() => setReferralModalOpen(false)}
      />

      {/* Visual Search Lens Modal (Agent 10) */}
      <VisualSearchModal
        isOpen={visualSearchOpen}
        onClose={() => setVisualSearchOpen(false)}
        onSelectProduct={handleSelectProduct}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
