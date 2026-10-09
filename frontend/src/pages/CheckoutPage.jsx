import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  CheckCircle,
  Plus,
  ShieldCheck,
  Package,
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  Check,
  ArrowRight,
  Award,
  RefreshCw,
  X,
} from 'lucide-react';
import { ScratchCard } from '../components/ScratchCard';

export function CheckoutPage({ onOrderPlaced, onViewOrders }) {
  const { cart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  // 3-Step Checkout Stepper: 1: Delivery Address, 2: Payment Option, 3: Confirmation
  const [activeStep, setActiveStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // New Address Form State
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    pincode: '560103',
    streetAddress: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    landmark: '',
    addressType: 'HOME',
  });

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI', 'CARD', 'NET_BANKING', 'COD'

  // UPI State
  const [selectedUpiApp, setSelectedUpiApp] = useState('GPay');
  const [upiId, setUpiId] = useState('rahul.sharma@okaxis');
  const [upiVerified, setUpiVerified] = useState(false);

  // Card State
  const [cardNumber, setCardNumber] = useState('4532 8921 7734 9012');
  const [cardHolder, setCardHolder] = useState('RAHUL SHARMA');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('834');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('7392');

  // Net Banking State
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // COD Captcha State
  const [captchaCode, setCaptchaCode] = useState('8492');
  const [enteredCaptcha, setEnteredCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // SuperCoins Loyalty Redemption
  const [superCoinsBalance, setSuperCoinsBalance] = useState(() => {
    try {
      return parseInt(localStorage.getItem('shopkart_supercoins') || '120', 10);
    } catch {
      return 120;
    }
  });
  const [useSuperCoins, setUseSuperCoins] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    const handleStorage = () => {
      const coins = parseInt(localStorage.getItem('shopkart_supercoins') || '120', 10);
      setSuperCoinsBalance(coins);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('shopkart_coins_updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('shopkart_coins_updated', handleStorage);
    };
  }, []);

  const loadAddresses = React.useCallback(async () => {
    try {
      const data = await api.getAddresses();
      setAddresses(data || []);
      if (data && data.length > 0) {
        const def = data.find((a) => a.default) || data[0];
        setSelectedAddressId(def.id);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated, loadAddresses]);

  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setEnteredCaptcha('');
    setCaptchaError('');
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    try {
      const saved = await api.addAddress(newAddress);
      setAddresses([saved, ...addresses]);
      setSelectedAddressId(saved.id);
      setShowNewAddressForm(false);
    } catch (err) {
      alert(err.message || 'Failed to add address');
    }
  };

  // SuperCoins & Total calculations
  const securedPackagingFee = 49;
  const coinsDeduction = useSuperCoins ? Math.min(superCoinsBalance, 100) : 0;
  const finalCalculatedAmount = Math.max(0, (cart.finalTotal || 0) - coinsDeduction);
  const totalPayableAmount = finalCalculatedAmount + securedPackagingFee;
  const coinsToEarn = Math.floor(finalCalculatedAmount * 0.04);

  const handleProceedToPayment = () => {
    if (!selectedAddressId) {
      alert('Please select or add a delivery address to proceed.');
      return;
    }
    setActiveStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeOrderPlacement = async () => {
    try {
      setIsSubmitting(true);
      // Place order via backend
      const order = await api.createOrder(selectedAddressId, paymentMethod);

      // Verify payment in demo sandbox
      const txnId = 'TXN_' + Date.now();
      await api.verifyPayment(order.id, txnId, true, null);

      // SuperCoins Ledger & Balance Tracking
      const ledger = JSON.parse(localStorage.getItem('shopkart_coins_ledger') || '[]');
      let updatedCoins = superCoinsBalance;

      if (useSuperCoins && coinsDeduction > 0) {
        updatedCoins = Math.max(0, updatedCoins - coinsDeduction);
        ledger.unshift({
          id: 'TXN_' + Date.now() + '_RED',
          type: 'REDEEMED',
          amount: coinsDeduction,
          description: `Instant Discount on Order #${order.orderNumber || order.id}`,
          timestamp: new Date().toISOString(),
        });
      }

      if (coinsToEarn > 0) {
        updatedCoins = updatedCoins + coinsToEarn;
        ledger.unshift({
          id: 'TXN_' + Date.now() + '_EARN',
          type: 'EARNED',
          amount: coinsToEarn,
          description: `4% SuperCoins Earned on Order #${order.orderNumber || order.id}`,
          timestamp: new Date().toISOString(),
        });
      }

      localStorage.setItem('shopkart_supercoins', updatedCoins.toString());
      localStorage.setItem('shopkart_coins_ledger', JSON.stringify(ledger));
      window.dispatchEvent(new Event('shopkart_coins_updated'));

      await clearCart();
      setConfirmedOrder({
        ...order,
        coinsEarned: coinsToEarn,
        coinsRedeemed: coinsDeduction,
      });
      setActiveStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
      setShowOtpModal(false);
    }
  };

  const handleScratchRevealed = () => {
    const creditedKey = `shopkart_scratch_credited_${confirmedOrder?.id || 'latest'}`;
    if (sessionStorage.getItem(creditedKey)) return;
    sessionStorage.setItem(creditedKey, 'true');

    const bonus = 50;
    const currentCoins = parseInt(localStorage.getItem('shopkart_supercoins') || '120', 10);
    const updated = currentCoins + bonus;
    localStorage.setItem('shopkart_supercoins', updated.toString());

    const ledger = JSON.parse(localStorage.getItem('shopkart_coins_ledger') || '[]');
    ledger.unshift({
      id: 'TXN_' + Date.now(),
      type: 'SCRATCH_BONUS',
      amount: bonus,
      description: 'Mystery Scratch Card Reward (Promo: SHOPKART200)',
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('shopkart_coins_ledger', JSON.stringify(ledger));
    window.dispatchEvent(new Event('shopkart_coins_updated'));
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'COD') {
      if (enteredCaptcha.trim() !== captchaCode) {
        setCaptchaError('Incorrect captcha code. Please re-enter.');
        return;
      }
      await executeOrderPlacement();
      return;
    }

    if (paymentMethod === 'CARD') {
      setShowOtpModal(true);
      return;
    }

    // Default UPI or Net Banking
    await executeOrderPlacement();
  };

  // STEP 3: ORDER CONFIRMED VIEW
  if (confirmedOrder || activeStep === 3) {
    const orderData = confirmedOrder || {
      orderNumber: 'OD894102931',
      trackingNumber: 'SK982741029',
      finalAmount: finalCalculatedAmount,
      paymentMethod,
      coinsEarned: coinsToEarn,
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Order Success Banner */}
        <div className="bg-white rounded-xs shadow-md border border-gray-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 text-[#388E3C] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Order Placed Successfully!
          </h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            Thank you for shopping on ShopKart. Your order has been placed and is currently being packed by our verified fulfillment center.
          </p>

          {/* Key Details Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xs p-4 max-w-md mx-auto text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID:</span>
              <span className="font-bold text-gray-900">{orderData.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tracking Number:</span>
              <span className="font-bold text-blue-600">{orderData.trackingNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="font-bold text-gray-900">
                ₹{orderData.finalAmount?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Mode:</span>
              <span className="font-semibold text-gray-800">{orderData.paymentMethod}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-500">SuperCoins Earned:</span>
              <span className="font-bold text-amber-600 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> +{orderData.coinsEarned || 48} SuperCoins Credited
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-500">Estimated Delivery:</span>
              <span className="font-bold text-[#388E3C]">Tomorrow by 9:00 PM</span>
            </div>
          </div>

          {/* Post-Purchase Gamification Scratch Card (Agent 11) */}
          <div className="pt-4 max-w-md mx-auto">
            <ScratchCard
              promoCode="SHOPKART200"
              discountText="₹200 Instant Off on Your Next Purchase"
              coinsBonus={50}
              onRevealed={handleScratchRevealed}
            />
          </div>

          {/* Action CTAs */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => onOrderPlaced && onOrderPlaced(orderData.id || 1)}
              className="bg-[#0A3B74] hover:bg-[#002F6C] text-white font-bold text-xs uppercase px-6 py-2.5 rounded-xs shadow-xs transition cursor-pointer"
            >
              Track Order Live
            </button>
            <button
              onClick={onViewOrders}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs uppercase px-6 py-2.5 rounded-xs transition cursor-pointer"
            >
              My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART CHECK
  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xs p-10 border border-gray-200 shadow-xs space-y-4">
          <Package className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">Your shopping cart is empty</h2>
          <p className="text-xs text-gray-500">
            Please add products to your cart before proceeding to checkout.
          </p>
          <button
            onClick={onViewOrders}
            className="bg-[#0A3B74] text-white font-bold text-xs px-6 py-2.5 rounded-xs cursor-pointer uppercase"
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  const selectedAddr = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 3-Step Checkout Stepper Header */}
      <div className="bg-white p-4 rounded-xs border border-gray-200 shadow-xs mb-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-bold uppercase tracking-wider">
          <div
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-2 cursor-pointer ${
              activeStep >= 1 ? 'text-[#0A3B74]' : 'text-gray-400'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                activeStep > 1 ? 'bg-[#388E3C]' : 'bg-[#0A3B74]'
              }`}
            >
              {activeStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </span>
            <span>Delivery Address</span>
          </div>

          <div className="h-0.5 flex-1 mx-4 bg-gray-200">
            <div
              className={`h-full bg-[#0A3B74] transition-all duration-300 ${
                activeStep >= 2 ? 'w-full' : 'w-0'
              }`}
            />
          </div>

          <div
            className={`flex items-center gap-2 ${
              activeStep >= 2 ? 'text-[#0A3B74]' : 'text-gray-400'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                activeStep === 2 ? 'bg-[#0A3B74]' : activeStep > 2 ? 'bg-[#388E3C]' : 'bg-gray-300'
              }`}
            >
              2
            </span>
            <span>Payment Method</span>
          </div>

          <div className="h-0.5 flex-1 mx-4 bg-gray-200">
            <div
              className={`h-full bg-[#0A3B74] transition-all duration-300 ${
                activeStep === 3 ? 'w-full' : 'w-0'
              }`}
            />
          </div>

          <div
            className={`flex items-center gap-2 ${
              activeStep === 3 ? 'text-[#388E3C]' : 'text-gray-400'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                activeStep === 3 ? 'bg-[#388E3C]' : 'bg-gray-300'
              }`}
            >
              3
            </span>
            <span>Confirmation</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Step Details */}
        <div className="lg:col-span-8 space-y-4">
          {/* STEP 1: DELIVERY ADDRESS */}
          {activeStep === 1 && (
            <div className="bg-white rounded-xs shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 bg-[#0A3B74] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white text-[#0A3B74] text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span className="font-bold text-sm uppercase">SELECT DELIVERY ADDRESS</span>
                </div>
              </div>

              <div className="p-4 divide-y divide-gray-100">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer rounded-xs transition ${
                      selectedAddressId === addr.id ? 'bg-blue-50/70 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 text-[#0A3B74]"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{addr.fullName}</span>
                        <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                          {addr.addressType}
                        </span>
                        <span className="text-gray-500 font-semibold">{addr.phone}</span>
                      </div>
                      <p className="text-gray-700 mt-1">
                        {addr.streetAddress}, {addr.city}, {addr.state} -{' '}
                        <span className="font-bold">{addr.pincode}</span>
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add New Address Toggle */}
                {!showNewAddressForm ? (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="w-full text-left py-3.5 px-2 text-xs font-bold text-[#0A3B74] hover:text-[#002F6C] flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add a new delivery address
                  </button>
                ) : (
                  <form onSubmit={handleAddNewAddress} className="p-4 bg-gray-50 space-y-3">
                    <h4 className="text-xs font-bold text-gray-800 uppercase">New Address</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        className="p-2 border border-gray-300 rounded bg-white"
                      />
                      <input
                        type="text"
                        required
                        placeholder="10-digit Phone Number"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="p-2 border border-gray-300 rounded bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <input
                        type="text"
                        required
                        placeholder="Pincode"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        className="p-2 border border-gray-300 rounded bg-white"
                      />
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="p-2 border border-gray-300 rounded bg-white"
                      />
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="p-2 border border-gray-300 rounded bg-white"
                      />
                    </div>
                    <textarea
                      required
                      placeholder="Street Address / House No. / Flat"
                      value={newAddress.streetAddress}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, streetAddress: e.target.value })
                      }
                      rows={2}
                      className="w-full text-xs p-2 border border-gray-300 rounded bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-[#0A3B74] hover:bg-[#002F6C] text-white font-bold text-xs px-4 py-2 rounded-xs"
                      >
                        Save & Deliver Here
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="text-xs font-bold text-gray-600 px-3 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Continue CTA */}
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleProceedToPayment}
                    className="bg-[#FF7A00] hover:bg-[#E66A00] text-white font-bold text-xs uppercase px-8 py-3 rounded-xs shadow-md transition cursor-pointer flex items-center gap-2"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {activeStep === 2 && (
            <div className="bg-white rounded-xs shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 bg-[#0A3B74] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white text-[#0A3B74] text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="font-bold text-sm uppercase">PAYMENT OPTIONS</span>
                  {selectedAddr && (
                    <span className="text-[11px] text-blue-100 hidden sm:inline font-normal">
                      • Deliver to: {selectedAddr.fullName} ({selectedAddr.pincode})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActiveStep(1)}
                  className="bg-white text-[#0A3B74] font-bold text-xs px-3 py-1 rounded-xs cursor-pointer"
                >
                  Change Address
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* SuperCoins Loyalty Redemption Toggle */}
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-amber-600" />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">
                        Use SuperCoins Balance
                      </span>
                      <span className="text-[11px] text-gray-600">
                        You have {superCoinsBalance} SuperCoins available (1 Coin = ₹1)
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSuperCoins}
                      onChange={(e) => setUseSuperCoins(e.target.checked)}
                      className="w-4 h-4 text-[#FF7A00] rounded"
                    />
                    <span className="text-xs font-bold text-amber-800">
                      Redeem {Math.min(superCoinsBalance, 100)} Coins (-₹{Math.min(superCoinsBalance, 100)})
                    </span>
                  </label>
                </div>

                {/* Gateway Tab Selectors */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                    { id: 'CARD', label: 'Cards', icon: CreditCard },
                    { id: 'NET_BANKING', label: 'Net Banking', icon: Building2 },
                    { id: 'COD', label: 'Cash on Delivery', icon: Banknote },
                  ].map((gw) => {
                    const Icon = gw.icon;
                    return (
                      <button
                        key={gw.id}
                        onClick={() => setPaymentMethod(gw.id)}
                        className={`p-3 rounded-xs border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                          paymentMethod === gw.id
                            ? 'border-[#0A3B74] bg-blue-50 text-[#0A3B74] ring-1 ring-[#0A3B74]'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{gw.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* GATEWAY 1: UPI */}
                {paymentMethod === 'UPI' && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xs space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
                      {/* QR Code Mock */}
                      <div className="bg-white p-3 rounded-xs border border-gray-300 text-center shadow-xs">
                        <div className="w-32 h-32 bg-gray-100 flex items-center justify-center border border-dashed border-gray-400 mx-auto">
                          <QrCode className="w-24 h-24 text-gray-800" />
                        </div>
                        <span className="text-[10px] text-gray-500 font-semibold block mt-1">
                          Scan to pay with any UPI App
                        </span>
                      </div>

                      {/* UPI ID Form */}
                      <div className="flex-1 w-full space-y-3">
                        <label className="block text-xs font-bold text-gray-700">
                          Enter VPA / UPI ID
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="username@bank"
                            className="flex-1 text-xs p-2.5 border border-gray-300 rounded bg-white font-mono"
                          />
                          <button
                            onClick={() => setUpiVerified(true)}
                            className="bg-[#0A3B74] hover:bg-[#002F6C] text-white text-xs font-bold px-4 py-2 rounded-xs"
                          >
                            Verify
                          </button>
                        </div>
                        {upiVerified && (
                          <p className="text-xs font-bold text-[#388E3C] flex items-center gap-1">
                            <Check className="w-4 h-4" /> Verified: Rahul Sharma (Axis Bank)
                          </p>
                        )}

                        <div className="flex gap-2 pt-2">
                          {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                            <button
                              key={app}
                              onClick={() => setSelectedUpiApp(app)}
                              className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${
                                selectedUpiApp === app
                                  ? 'bg-[#0A3B74] text-white border-[#0A3B74]'
                                  : 'bg-white text-gray-700 border-gray-300'
                              }`}
                            >
                              {app}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* GATEWAY 2: CREDIT / DEBIT CARD */}
                {paymentMethod === 'CARD' && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xs space-y-4">
                    {/* Realistic ATM Card Mock */}
                    <div className="max-w-xs mx-auto bg-gradient-to-tr from-[#0A3B74] to-[#002F6C] text-white p-4 rounded-xl shadow-lg space-y-4 select-none">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                        <span>ShopKart Platinum</span>
                        <span>VISA</span>
                      </div>
                      <div className="w-9 h-7 bg-amber-300/80 rounded-sm border border-amber-400" />
                      <p className="font-mono text-base tracking-widest text-center">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </p>
                      <div className="flex justify-between text-[10px]">
                        <div>
                          <span className="text-gray-300 block">CARD HOLDER</span>
                          <span className="font-bold">{cardHolder}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-300 block">EXPIRES</span>
                          <span className="font-bold">{cardExpiry}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <label className="block text-gray-700 font-bold mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded bg-white uppercase font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-gray-700 font-bold mb-1">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          maxLength={19}
                          className="w-full p-2 border border-gray-300 rounded bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          maxLength={5}
                          className="w-full p-2 border border-gray-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-bold mb-1">CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          maxLength={4}
                          className="w-full p-2 border border-gray-300 rounded bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* GATEWAY 3: NET BANKING */}
                {paymentMethod === 'NET_BANKING' && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xs space-y-3">
                    <label className="block text-xs font-bold text-gray-700">
                      Popular Supported Banks
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {['HDFC', 'ICICI', 'State Bank of India', 'Axis Bank', 'Kotak', 'Punjab National'].map(
                        (b) => (
                          <button
                            key={b}
                            onClick={() => setSelectedBank(b)}
                            className={`p-3 rounded border text-left font-bold transition ${
                              selectedBank === b
                                ? 'border-[#0A3B74] bg-blue-50 text-[#0A3B74]'
                                : 'bg-white border-gray-200 text-gray-800'
                            }`}
                          >
                            {b}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* GATEWAY 4: CASH ON DELIVERY WITH CAPTCHA */}
                {paymentMethod === 'COD' && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xs space-y-3">
                    <p className="text-xs text-gray-700">
                      Pay cash upon delivery at your doorstep. Please solve the security code challenge to confirm your booking.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 border-2 border-amber-300 px-4 py-2 font-mono font-black text-lg tracking-widest text-amber-900 select-none rounded">
                        {captchaCode}
                      </div>
                      <button
                        onClick={generateCaptcha}
                        className="text-gray-500 hover:text-gray-800 p-1"
                        title="New Captcha"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={enteredCaptcha}
                        onChange={(e) => setEnteredCaptcha(e.target.value)}
                        placeholder="Enter 4 digits"
                        maxLength={4}
                        className="w-28 text-xs p-2 border border-gray-300 rounded bg-white font-mono font-bold"
                      />
                    </div>
                    {captchaError && (
                      <p className="text-xs text-red-600 font-bold">{captchaError}</p>
                    )}
                  </div>
                )}

                {/* Submit Order Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-[#FF7A00] hover:bg-[#E66A00] text-white font-bold text-xs uppercase px-10 py-3.5 rounded-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      'Processing Order...'
                    ) : (
                      <>
                        <span>Pay ₹{totalPayableAmount.toLocaleString('en-IN')} & Confirm</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Price Summary */}
        <div className="lg:col-span-4 bg-white rounded-xs shadow-xs border border-gray-200 p-5 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-100">
            Price Details ({cart.totalItems} Items)
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-gray-700">
              <span>Total MRP:</span>
              <span>₹{(cart.originalTotal || cart.finalTotal).toLocaleString('en-IN')}</span>
            </div>

            {cart.discountTotal > 0 && (
              <div className="flex justify-between text-[#388E3C] font-semibold">
                <span>Discount on MRP:</span>
                <span>- ₹{cart.discountTotal.toLocaleString('en-IN')}</span>
              </div>
            )}

            {useSuperCoins && (
              <div className="flex justify-between text-[#388E3C] font-semibold">
                <span>SuperCoins Redemption:</span>
                <span>- ₹{coinsDeduction}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-700">
              <span>Delivery Charges:</span>
              <span className="text-[#388E3C] font-semibold">
                {cart.deliveryFee === 0 ? 'FREE' : `₹${cart.deliveryFee}`}
              </span>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>Secured Packaging Fee:</span>
              <span>₹49</span>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between text-sm font-black text-gray-900">
              <span>Total Payable Amount:</span>
              <span>₹{totalPayableAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Reward Earning Callout */}
          <div className="p-3 bg-amber-50 rounded-xs border border-amber-200 flex items-center gap-2 text-xs font-bold text-amber-900">
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
            <span>You will earn +{coinsToEarn} SuperCoins on this purchase!</span>
          </div>

          <div className="text-[11px] text-gray-500 space-y-1 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-600">
              <ShieldCheck className="w-4 h-4 text-[#0A3B74]" />
              <span>Safe and Secure Payments. 100% Authentic Products.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card OTP Verification Simulation Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xs shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-black text-sm text-[#0A3B74]">Bank OTP Verification</span>
              <button onClick={() => setShowOtpModal(false)} className="text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600">
              A 4-digit verification code was sent to your registered mobile number ending with 8291.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Enter OTP</label>
              <input
                type="text"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                maxLength={4}
                className="w-full text-center font-mono font-black text-lg p-2 border border-gray-300 rounded tracking-widest"
              />
            </div>
            <button
              onClick={executeOrderPlacement}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#388E3C] hover:bg-green-700 text-white font-bold text-xs uppercase rounded-xs transition"
            >
              {isSubmitting ? 'Verifying...' : 'Verify OTP & Authorize Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
