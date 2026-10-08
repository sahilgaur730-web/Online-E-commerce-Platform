import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Package,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';

export function OrderDetailPage({ orderId, onBack, onViewProduct }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Found better price elsewhere');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await api.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      const updated = await api.cancelOrder(order.id, cancelReason);
      setOrder(updated);
      setShowCancelModal(false);
      alert('Order has been cancelled and stock has been restored to inventory.');
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2874F0] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 mt-2">Loading order details...</p>
      </div>
    );
  }

  const milestones = [
    { key: 'PLACED', title: 'Ordered' },
    { key: 'CONFIRMED', title: 'Packed' },
    { key: 'SHIPPED', title: 'Shipped' },
    { key: 'OUT_FOR_DELIVERY', title: 'Out for Delivery' },
    { key: 'DELIVERED', title: 'Delivered' },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'PLACED': return 0;
      case 'CONFIRMED': return 1;
      case 'SHIPPED': return 2;
      case 'OUT_FOR_DELIVERY': return 3;
      case 'DELIVERED': return 4;
      default: return -1;
    }
  };

  const currentStep = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === 'CANCELLED';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-[#2874F0] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-xs p-4 shadow-xs border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="text-xs text-gray-500">Order ID: </span>
          <span className="font-bold text-gray-900 font-mono">{order.orderNumber}</span>
          <span className="text-xs text-gray-400 mx-2">•</span>
          <span className="text-xs text-gray-500">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-700">
            Tracking No: <span className="text-blue-600 font-bold">{order.trackingNumber}</span>
          </span>
          {!isCancelled && order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'SHIPPED' && order.orderStatus !== 'OUT_FOR_DELIVERY' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded border border-red-200 cursor-pointer"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Flipkart Live Tracking Stepper */}
      <div className="bg-white rounded-xs p-6 shadow-xs border border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">
          Order Tracking Status
        </h3>

        {isCancelled ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xs flex items-center gap-3 text-red-700 text-xs">
            <XCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">Order Cancelled</p>
              <p className="mt-0.5">Reason: {order.cancellationReason || 'Cancelled by buyer'}</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Step track bar */}
            <div className="hidden sm:block absolute top-4 left-6 right-6 h-1 bg-gray-200 -z-0">
              <div
                className="h-full bg-[#388E3C] transition-all duration-500"
                style={{
                  width: `${(Math.max(0, currentStep) / (milestones.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Step points */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
              {milestones.map((m, idx) => {
                const isPassed = currentStep >= idx;
                const isCurrent = currentStep === idx;
                return (
                  <div key={m.key} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                        isPassed
                          ? 'bg-[#388E3C] text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isCurrent ? 'text-[#388E3C]' : 'text-gray-800'}`}>
                        {m.title}
                      </p>
                      {isPassed && idx === 0 && (
                        <p className="text-[10px] text-gray-400">Verified</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Milestone history log */}
        {order.trackingEvents && order.trackingEvents.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase">Tracking Timeline</h4>
            <div className="space-y-2">
              {order.trackingEvents.map((t) => (
                <div key={t.id} className="text-xs flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2874F0] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900">{t.title}</span>
                    <span className="text-gray-400 text-[10px] ml-2">
                      {new Date(t.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <p className="text-gray-600 text-[11px]">{t.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Multi-Seller Vendor Packages Split Breakdown */}
      {order.subOrders && order.subOrders.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#0A3B74]" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Multi-Seller Vendor Packages ({order.subOrders.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Independent Vendor Parcel Dispatch
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.subOrders.map((pkg, idx) => (
              <div key={pkg.id || idx} className="border border-slate-200/90 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Package {idx + 1} of {order.subOrders.length}
                    </span>
                    <span className="text-xs font-bold text-[#0A3B74] font-mono">
                      {pkg.subOrderNumber}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    pkg.status === 'DELIVERED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : pkg.status === 'SHIPPED' || pkg.status === 'OUT_FOR_DELIVERY'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : pkg.status === 'CONFIRMED'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : pkg.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {pkg.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p><span className="font-semibold text-slate-700">Fulfilled by:</span> {pkg.storeName || pkg.sellerName || 'Verified Seller'}</p>
                  <p><span className="font-semibold text-slate-700">Logistics Carrier:</span> {pkg.carrier || 'Ekart Logistics'}</p>
                  <p><span className="font-semibold text-slate-700">Package Tracking:</span> <span className="font-mono text-blue-600 font-semibold">{pkg.trackingNumber || 'Pending'}</span></p>
                  {pkg.status === 'CANCELLED' && pkg.cancellationReason && (
                    <p className="text-rose-600 font-medium"><span className="font-semibold">Cancellation Note:</span> {pkg.cancellationReason}</p>
                  )}
                </div>

                {pkg.items && pkg.items.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Package Items ({pkg.items.length})
                    </span>
                    {pkg.items.map((it) => (
                      <div key={it.id} className="flex items-center gap-2 text-xs">
                        {it.productImageUrl && (
                          <img src={it.productImageUrl} alt="" className="w-7 h-7 object-contain bg-white rounded border border-slate-200 p-0.5 shrink-0" />
                        )}
                        <span className="font-medium text-slate-800 truncate flex-1">{it.productName}</span>
                        <span className="text-slate-500 font-bold shrink-0">x{it.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Order Items & Delivery Address Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Items Ordered */}
        <div className="md:col-span-7 bg-white rounded-xs p-4 shadow-xs border border-gray-200 space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-100">
            Items in this Order ({order.items?.length || 0})
          </h3>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white border border-gray-100 p-1 rounded shrink-0 flex items-center justify-center">
                    <img src={item.productImageUrl} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <h4
                      onClick={() => item.productId && onViewProduct && onViewProduct(item.productId)}
                      className="font-semibold text-gray-900 hover:text-[#2874F0] cursor-pointer line-clamp-1"
                    >
                      {item.productName}
                    </h4>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                    <p className="font-bold text-gray-900">₹{item.price?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <span className="font-bold text-sm text-gray-900">
                  ₹{item.subtotal?.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Address and Payment Details */}
        <div className="md:col-span-5 space-y-4">
          {/* Shipping Address */}
          <div className="bg-white rounded-xs p-4 shadow-xs border border-gray-200 space-y-2 text-xs">
            <h4 className="font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2874F0]" /> Delivery Address
            </h4>
            <p className="text-gray-800 leading-relaxed font-medium">
              {order.shippingAddressSnapshot}
            </p>
          </div>

          {/* Total Price Details */}
          <div className="bg-white rounded-xs p-4 shadow-xs border border-gray-200 space-y-2 text-xs">
            <h4 className="font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-100">
              Payment Summary
            </h4>
            <div className="flex justify-between text-gray-600">
              <span>List Price</span>
              <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Selling Discount</span>
              <span className="text-[#388E3C] font-semibold">− ₹{order.discountAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-200 pt-2">
              <span>Total Paid</span>
              <span>₹{order.finalAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-[11px] text-gray-500 pt-1">
              Payment Method: <span className="font-semibold text-gray-800">{order.paymentMethod}</span> ({order.paymentStatus})
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xs shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-gray-900">Cancel this Order?</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to cancel order <span className="font-mono font-bold">{order.orderNumber}</span>?
              The reserved items will be returned to stock inventory and any digital payment will be refunded.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
              >
                <option value="Found better price elsewhere">Found better price elsewhere</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery time is too long">Delivery time is too long</option>
                <option value="Need to change shipping address">Need to change shipping address</option>
                <option value="Change of mind">Change of mind</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xs"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xs shadow-xs"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
