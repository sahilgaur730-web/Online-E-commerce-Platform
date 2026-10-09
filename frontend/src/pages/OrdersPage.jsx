import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { Package, Search, ChevronRight, CheckCircle, Clock, XCircle } from 'lucide-react';

export function OrdersPage({ onViewOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="flex items-center gap-1 text-[#388E3C] font-bold text-xs">
            <CheckCircle className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center gap-1 text-red-600 font-bold text-xs">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="flex items-center gap-1 text-[#0A3B74] font-bold text-xs">
            <Clock className="w-3.5 h-3.5" /> In Transit
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[#FF7A00] font-bold text-xs">
            <Clock className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.items?.some((i) => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      {/* Title & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Orders</h1>
          <p className="text-xs text-gray-500">Track, return or cancel your items</p>
        </div>

        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your orders here"
            className="w-full text-xs p-2 pl-8 bg-white border border-gray-300 rounded focus:border-[#0A3B74] focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 py-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xs p-12 text-center border border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-800">No orders placed yet</h3>
          <p className="text-xs text-gray-500 mt-1">
            When you purchase products, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onViewOrder(order.id)}
              className="bg-white rounded-xs p-4 shadow-xs border border-gray-200 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Product thumbnails & details */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-20 h-20 bg-white border border-gray-100 rounded p-1 flex items-center justify-center shrink-0">
                  <img
                    src={order.items?.[0]?.productImageUrl || 'https://placehold.co/100x100'}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 hover:text-[#0A3B74]">
                    {order.items?.[0]?.productName}
                    {order.items?.length > 1 && ` + ${order.items.length - 1} more items`}
                  </h4>
                  <div className="text-xs text-gray-500">
                    Order ID: <span className="font-mono text-gray-800">{order.orderNumber}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Placed on: {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="text-left md:text-right shrink-0">
                <div className="text-base font-bold text-gray-900">
                  ₹{order.finalAmount?.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-gray-500">{order.paymentMethod} • {order.paymentStatus}</span>
              </div>

              {/* Status */}
              <div className="text-left md:text-right shrink-0 min-w-[140px]">
                {getStatusBadge(order.orderStatus)}
                <div className="text-[11px] text-gray-500 mt-1">
                  Tracking: <span className="font-semibold text-gray-800">{order.trackingNumber}</span>
                </div>
              </div>

              <div className="text-gray-400 hidden md:block">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
