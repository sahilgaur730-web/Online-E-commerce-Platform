import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  CheckCircle,
  Plus,
  ShieldCheck,
  Package,
} from 'lucide-react';

export function CheckoutPage({ onOrderPlaced, onViewOrders }) {
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [activeStep, setActiveStep] = useState(2); // 1: Login, 2: Address, 3: Summary, 4: Payment
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // New Address Form State
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    pincode: '',
    streetAddress: '',
    city: '',
    state: '',
    landmark: '',
    addressType: 'HOME',
  });

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI', 'CARD', 'NET_BANKING', 'COD'
  const [upiId, setUpiId] = useState('rahul.sharma@okaxis');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const loadAddresses = async () => {
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
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated]);

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

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert('Please select a delivery address');
      setActiveStep(2);
      return;
    }

    try {
      setIsSubmitting(true);
      // 1. Place order via backend
      const order = await api.createOrder(selectedAddressId, paymentMethod);

      // 2. If online payment (UPI/Card), verify payment via backend PaymentService
      if (paymentMethod !== 'COD') {
        const txnId = 'TXN_' + Date.now();
        await api.verifyPayment(order.id, txnId, true);
      }

      await clearCart();
      setConfirmedOrder(order);
    } catch (err) {
      alert(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xs shadow-md border border-gray-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 text-[#388E3C] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Order Placed Successfully!
          </h2>
          <p className="text-sm text-gray-600">
            Thank you for shopping on ShopKart. Your order has been placed and confirmed.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xs p-4 max-w-md mx-auto text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID:</span>
              <span className="font-bold text-gray-900">{confirmedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tracking Number:</span>
              <span className="font-bold text-blue-600">{confirmedOrder.trackingNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="font-bold text-gray-900">₹{confirmedOrder.finalAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Mode:</span>
              <span className="font-semibold text-gray-800">{confirmedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-500">Estimated Delivery:</span>
              <span className="font-bold text-[#388E3C]">Tomorrow by 9:00 PM</span>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => onOrderPlaced && onOrderPlaced(confirmedOrder.id)}
              className="bg-[#2874F0] hover:bg-blue-600 text-white font-bold text-xs px-6 py-2.5 rounded-xs shadow-xs transition"
            >
              Track Order
            </button>
            <button
              onClick={onViewOrders}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs px-6 py-2.5 rounded-xs transition"
            >
              My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!confirmedOrder && (!cart.items || cart.items.length === 0)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xs p-10 border border-gray-200 shadow-xs space-y-4">
          <Package className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">Your shopping cart is empty</h2>
          <p className="text-xs text-gray-500">Please add products to your cart before proceeding to checkout.</p>
          <button
            onClick={onViewOrders}
            className="bg-[#2874F0] text-white font-bold text-xs px-6 py-2.5 rounded-xs cursor-pointer"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 4-Step Accordion Flow */}
        <div className="lg:col-span-8 space-y-4">
          {/* STEP 1: LOGIN */}
          <div className="bg-white rounded-xs shadow-xs border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#2874F0] text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="font-bold text-sm text-gray-700 uppercase">LOGIN</span>
                <CheckCircle className="w-4 h-4 text-[#388E3C]" />
              </div>
              <span className="text-xs font-semibold text-gray-800">
                {user ? `${user.name} (+91 ${user.phone || '9876543210'})` : 'Guest'}
              </span>
            </div>
          </div>

          {/* STEP 2: DELIVERY ADDRESS */}
          <div className="bg-white rounded-xs shadow-xs border border-gray-200 overflow-hidden">
            <div
              onClick={() => setActiveStep(2)}
              className="p-4 bg-[#2874F0] text-white flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white text-[#2874F0] text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-sm uppercase">DELIVERY ADDRESS</span>
              </div>
              {activeStep !== 2 && selectedAddr && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveStep(2);
                  }}
                  className="bg-white text-[#2874F0] font-bold text-xs px-4 py-1 rounded-xs"
                >
                  CHANGE
                </button>
              )}
            </div>

            {activeStep === 2 ? (
              <div className="p-4 space-y-4">
                {/* List of saved addresses */}
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-3.5 rounded-xs border cursor-pointer transition ${
                        selectedAddressId === addr.id
                          ? 'border-[#2874F0] bg-blue-50/40 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="addressRadio"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="text-[#2874F0]"
                        />
                        <span className="font-bold text-sm text-gray-900">{addr.fullName}</span>
                        <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded font-semibold uppercase">
                          {addr.addressType}
                        </span>
                        <span className="font-semibold text-xs text-gray-700 ml-2">
                          {addr.phone}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 pl-6">
                        {addr.streetAddress}, {addr.city}, {addr.state} -{' '}
                        <span className="font-bold text-gray-800">{addr.pincode}</span>
                      </p>

                      {selectedAddressId === addr.id && (
                        <div className="pl-6 pt-3">
                          <button
                            onClick={() => setActiveStep(3)}
                            className="bg-[#FB641B] hover:bg-[#e05816] text-white font-bold text-xs px-6 py-2.5 rounded-xs shadow-xs uppercase tracking-wide cursor-pointer"
                          >
                            DELIVER HERE
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New Address Button & Form */}
                {!showNewAddressForm ? (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="flex items-center gap-2 text-xs font-bold text-[#2874F0] hover:underline pt-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add a new address
                  </button>
                ) : (
                  <form onSubmit={handleAddNewAddress} className="border border-gray-200 p-4 rounded-xs bg-gray-50 space-y-3">
                    <h4 className="text-xs font-bold text-gray-800 uppercase">Add New Address</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        className="text-xs p-2 bg-white border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="10-digit Mobile Number"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="text-xs p-2 bg-white border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Pincode (e.g. 560103)"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        className="text-xs p-2 bg-white border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="City / District"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="text-xs p-2 bg-white border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                      />
                    </div>
                    <textarea
                      rows={2}
                      required
                      placeholder="Flat, House no., Building, Company, Apartment, Street"
                      value={newAddress.streetAddress}
                      onChange={(e) => setNewAddress({ ...newAddress, streetAddress: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="text-xs p-2 bg-white border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Landmark (Optional)"
                        value={newAddress.landmark}
                        onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                        className="text-xs p-2 bg-white border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-4 items-center">
                      <label className="text-xs font-semibold text-gray-700">Type:</label>
                      <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="addrType"
                          checked={newAddress.addressType === 'HOME'}
                          onChange={() => setNewAddress({ ...newAddress, addressType: 'HOME' })}
                        />
                        Home
                      </label>
                      <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="addrType"
                          checked={newAddress.addressType === 'WORK'}
                          onChange={() => setNewAddress({ ...newAddress, addressType: 'WORK' })}
                        />
                        Work
                      </label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="bg-[#2874F0] hover:bg-blue-600 text-white font-bold text-xs px-5 py-2 rounded-xs shadow-xs"
                      >
                        SAVE AND DELIVER HERE
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="bg-white border border-gray-300 text-gray-700 font-bold text-xs px-4 py-2 rounded-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              selectedAddr && (
                <div className="p-4 text-xs text-gray-700 bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900">{selectedAddr.fullName}</span>
                    <span className="text-gray-500 ml-2">
                      {selectedAddr.streetAddress}, {selectedAddr.city} - {selectedAddr.pincode}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>

          {/* STEP 3: ORDER SUMMARY */}
          <div className="bg-white rounded-xs shadow-xs border border-gray-200 overflow-hidden">
            <div
              onClick={() => setActiveStep(3)}
              className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#2874F0] text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span className="font-bold text-sm text-gray-800 uppercase">ORDER SUMMARY</span>
              </div>
              <span className="text-xs font-semibold text-gray-600">
                {cart.totalItems} Items
              </span>
            </div>

            {activeStep === 3 && (
              <div className="p-4 space-y-4">
                <div className="divide-y divide-gray-100">
                  {cart.items.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <img src={item.imageUrl} alt="" className="w-12 h-12 object-contain" />
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                          <p className="text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-sm text-gray-900">
                        ₹{item.subtotal?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setActiveStep(4)}
                    className="bg-[#FB641B] hover:bg-[#e05816] text-white font-bold text-xs px-8 py-3 rounded-xs shadow-xs uppercase tracking-wide cursor-pointer"
                  >
                    CONTINUE TO PAYMENT
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: PAYMENT OPTIONS */}
          <div className="bg-white rounded-xs shadow-xs border border-gray-200 overflow-hidden">
            <div
              onClick={() => setActiveStep(4)}
              className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#2874F0] text-white text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <span className="font-bold text-sm text-gray-800 uppercase">PAYMENT OPTIONS</span>
              </div>
            </div>

            {activeStep === 4 && (
              <div className="p-4 space-y-4">
                {/* UPI Option */}
                <div
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3.5 rounded-xs border cursor-pointer transition ${
                    paymentMethod === 'UPI' ? 'border-[#2874F0] bg-blue-50/30' : 'border-gray-200'
                  }`}
                >
                  <label className="flex items-center gap-2.5 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                    />
                    UPI (Instant Discount & Fast Checkout)
                  </label>
                  {paymentMethod === 'UPI' && (
                    <div className="pl-6 pt-3 space-y-2">
                      <p className="text-[11px] text-gray-600">
                        Choose your UPI App (Google Pay / PhonePe / Paytm / BHIM)
                      </p>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="Enter UPI ID (e.g. mobile@upi)"
                        className="text-xs p-2 border border-gray-300 rounded w-full max-w-sm focus:border-[#2874F0] focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Credit / Debit Card Option */}
                <div
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3.5 rounded-xs border cursor-pointer transition ${
                    paymentMethod === 'CARD' ? 'border-[#2874F0] bg-blue-50/30' : 'border-gray-200'
                  }`}
                >
                  <label className="flex items-center gap-2.5 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === 'CARD'}
                      onChange={() => setPaymentMethod('CARD')}
                    />
                    Credit / Debit / ATM Card
                  </label>
                  {paymentMethod === 'CARD' && (
                    <div className="pl-6 pt-3 space-y-2 max-w-sm">
                      <input
                        type="text"
                        placeholder="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="text-xs p-2 border border-gray-300 rounded w-full focus:border-[#2874F0] focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="text-xs p-2 border border-gray-300 rounded w-full focus:border-[#2874F0] focus:outline-none"
                        />
                        <input
                          type="password"
                          placeholder="CVV"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="text-xs p-2 border border-gray-300 rounded w-full focus:border-[#2874F0] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Net Banking */}
                <div
                  onClick={() => setPaymentMethod('NET_BANKING')}
                  className={`p-3.5 rounded-xs border cursor-pointer transition ${
                    paymentMethod === 'NET_BANKING' ? 'border-[#2874F0] bg-blue-50/30' : 'border-gray-200'
                  }`}
                >
                  <label className="flex items-center gap-2.5 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === 'NET_BANKING'}
                      onChange={() => setPaymentMethod('NET_BANKING')}
                    />
                    Net Banking (HDFC, ICICI, SBI, Axis)
                  </label>
                </div>

                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3.5 rounded-xs border cursor-pointer transition ${
                    paymentMethod === 'COD' ? 'border-[#2874F0] bg-blue-50/30' : 'border-gray-200'
                  }`}
                >
                  <label className="flex items-center gap-2.5 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                    />
                    Cash on Delivery (Pay cash at your doorstep)
                  </label>
                </div>

                {/* Final Order Placement Button */}
                <div className="pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="bg-[#FB641B] hover:bg-[#e05816] text-white font-bold text-sm px-10 py-3.5 rounded-xs shadow-md uppercase tracking-wide cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing Payment...' : `PAY ₹${cart.finalTotal?.toLocaleString('en-IN')} & PLACE ORDER`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Price Details Summary */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="bg-white rounded-xs shadow-xs border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-3 border-b border-gray-200">
              Price Details
            </h3>

            <div className="space-y-3 py-3 text-xs border-b border-gray-200">
              <div className="flex justify-between text-gray-700">
                <span>Price ({cart.totalItems} items)</span>
                <span>₹{cart.originalTotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Discount</span>
                <span className="text-[#388E3C] font-bold">
                  − ₹{cart.discountTotal?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Delivery Charges</span>
                <span className={cart.deliveryFee === 0 ? 'text-[#388E3C] font-bold' : ''}>
                  {cart.deliveryFee === 0 ? 'FREE' : `₹${cart.deliveryFee}`}
                </span>
              </div>
            </div>

            <div className="py-3 flex justify-between text-base font-bold text-gray-900 border-b border-gray-200">
              <span>Total Payable</span>
              <span>₹{cart.finalTotal?.toLocaleString('en-IN')}</span>
            </div>

            {cart.savings > 0 && (
              <div className="pt-3 text-xs font-bold text-[#388E3C]">
                Your total savings on this order: ₹{cart.savings?.toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
            <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0" />
            <p className="text-[11px] leading-tight">
              100% Safe Payments with 256-bit encryption. Certified PCI-DSS compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
