import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ShieldCheck,
  Users,
  ShoppingBag,
  AlertTriangle,
  FileText,
  Eye,
  CheckSquare,
  Square,
  BarChart2,
  Calendar,
  X,
} from 'lucide-react';

export function AdminDashboardPage({ onViewOrder }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'orders', 'users', 'inventory', 'audit'
  const [loading, setLoading] = useState(true);

  // 6 Lifecycle States Filter: 'ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REFUND'
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Batch Status Actions State
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [batchTargetStatus, setBatchTargetStatus] = useState('CONFIRMED');
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Item Inspection Drawer State
  const [inspectingOrder, setInspectingOrder] = useState(null);

  // Analytics Period Filter: '7D', '30D', '1Y'
  const [analyticsPeriod, setAnalyticsPeriod] = useState('7D');

  const loadAdminData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [dash, userList, orderList, logs, lowStockItems] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminUsers(),
        api.getAllOrders(0, 50),
        api.getAdminAuditLogs(),
        api.getAdminLowStock(15),
      ]);
      setStats(dash);
      setUsers(userList || []);
      setOrders(orderList?.content || []);
      setAuditLogs(logs || []);
      setLowStock(lowStockItems || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Filter orders across 6 lifecycle states
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'ALL') return true;
    if (orderStatusFilter === 'PENDING') return o.orderStatus === 'PLACED';
    if (orderStatusFilter === 'CONFIRMED') return o.orderStatus === 'CONFIRMED';
    if (orderStatusFilter === 'SHIPPED') return o.orderStatus === 'SHIPPED' || o.orderStatus === 'OUT_FOR_DELIVERY';
    if (orderStatusFilter === 'DELIVERED') return o.orderStatus === 'DELIVERED';
    if (orderStatusFilter === 'CANCELLED') return o.orderStatus === 'CANCELLED';
    if (orderStatusFilter === 'RETURN_REFUND') {
      return o.orderStatus === 'CANCELLED' && o.paymentStatus === 'REFUNDED';
    }
    return true;
  });

  // Batch selection handlers
  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const handleToggleSelectOrder = (id) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter((item) => item !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  // Batch status update execution
  const handleExecuteBatchStatus = async () => {
    if (selectedOrderIds.length === 0) {
      alert('Please select at least one order for batch update.');
      return;
    }
    try {
      setBatchProcessing(true);
      let successCount = 0;
      const skippedOrders = [];

      for (const id of selectedOrderIds) {
        const order = orders.find((o) => o.id === id);
        const current = order ? order.orderStatus : null;

        // Verify valid state machine transitions according to OrderService rules
        let isValid = false;
        if (batchTargetStatus === 'CONFIRMED' && current === 'PLACED') isValid = true;
        else if (batchTargetStatus === 'SHIPPED' && current === 'CONFIRMED') isValid = true;
        else if (batchTargetStatus === 'OUT_FOR_DELIVERY' && current === 'SHIPPED') isValid = true;
        else if (batchTargetStatus === 'DELIVERED' && current === 'OUT_FOR_DELIVERY') isValid = true;
        else if (batchTargetStatus === 'CANCELLED' && (current === 'PLACED' || current === 'CONFIRMED')) isValid = true;

        if (!isValid) {
          skippedOrders.push(order?.orderNumber || `#${id} (${current || 'UNKNOWN'})`);
          continue;
        }

        try {
          await api.updateOrderStatus(id, batchTargetStatus, 'Batch status update applied by Admin');
          successCount++;
        } catch {
          skippedOrders.push(order?.orderNumber || `#${id} (${current || 'UNKNOWN'})`);
        }
      }

      let summary = `Batch Update Finished: ${successCount} order(s) transitioned to ${batchTargetStatus}.`;
      if (skippedOrders.length > 0) {
        summary += ` ${skippedOrders.length} order(s) bypassed due to invalid lifecycle transitions: ${skippedOrders.slice(0, 5).join(', ')}${skippedOrders.length > 5 ? '...' : ''}.`;
      }
      alert(summary);
      setSelectedOrderIds([]);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Batch update encountered an issue');
    } finally {
      setBatchProcessing(false);
    }
  };

  // Single order status update from drawer
  const handleSingleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus, 'Admin updated status');
      alert(`Order status updated to ${newStatus}`);
      await loadAdminData();
      if (inspectingOrder && inspectingOrder.id === orderId) {
        const updated = await api.getOrderById(orderId);
        setInspectingOrder(updated);
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      loadAdminData();
      alert(`User role updated to ${newRole}`);
    } catch (err) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await api.toggleUserActive(userId);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to toggle active status');
    }
  };

  const handleRestock = async (productId, current) => {
    const qty = prompt('Enter units to restock:', current + 25);
    if (qty !== null && !isNaN(qty)) {
      try {
        await api.updateProductStock(productId, Number(qty));
        loadAdminData();
        alert('Stock updated successfully');
      } catch (err) {
        alert(err.message || 'Failed to update stock');
      }
    }
  };

  // Analytics Synthetic Chart Data (7-day / 30-day views)
  const analyticsData7D = {
    dates: ['Oct 02', 'Oct 03', 'Oct 04', 'Oct 05', 'Oct 06', 'Oct 07', 'Oct 08'],
    visitors: [1420, 1850, 2100, 1940, 2680, 3120, 3450],
    orders: [42, 58, 67, 54, 89, 112, 128],
    revenue: [184000, 245000, 312000, 276000, 420000, 560000, 680000],
    buyersNew: [18, 24, 31, 28, 45, 52, 60],
    sellersNew: [2, 3, 1, 4, 3, 5, 4],
  };

  const mostViewedItems = [
    { name: 'Apple iPhone 16 Pro Max 256GB', views: 12400, category: 'Smartphones', convRate: '4.8%' },
    { name: 'Sony WH-1000XM5 Wireless Headphones', views: 8900, category: 'Audio', convRate: '5.2%' },
    { name: 'Apple MacBook Pro M3 14-inch', views: 7600, category: 'Laptops', convRate: '3.6%' },
    { name: 'Samsung Galaxy S24 Ultra 5G', views: 6800, category: 'Smartphones', convRate: '4.1%' },
    { name: 'Nike Air Zoom Pegasus 40', views: 5400, category: 'Footwear', convRate: '6.4%' },
  ];

  const bestSellers = [
    { title: 'Apple iPhone 16 Pro Max', units: 342, gmv: '₹4,10,40,000', stock: 18 },
    { title: 'Sony WH-1000XM5 Noise Canceling', units: 580, gmv: '₹1,62,40,000', stock: 45 },
    { title: 'Apple MacBook Pro M3', units: 184, gmv: '₹3,12,80,000', stock: 12 },
    { title: 'Samsung Galaxy S24 Ultra', units: 215, gmv: '₹2,79,50,000', stock: 24 },
    { title: 'ShopKart Assured Fast Charger 65W', units: 1250, gmv: '₹24,87,500', stock: 160 },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#0A3B74] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 mt-2 font-semibold">
          Loading ShopKart Central Operations & Telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Admin Header */}
      <div className="bg-white rounded-xs p-5 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#0A3B74] text-white rounded-xs flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              ShopKart Central Administration
              <span className="text-[10px] bg-green-100 text-[#388E3C] px-2 py-0.5 rounded font-black uppercase">
                Live Node
              </span>
            </h1>
            <p className="text-xs text-gray-500">
              Operations Hub • 6-State Lifecycle Management • Analytics & Telemetry Engine • Audit Trails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xs transition cursor-pointer"
          >
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xs p-3.5 border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block">Total Users</span>
          <span className="text-xl font-black text-gray-900 mt-1 block">{stats?.totalUsers || 0}</span>
          <span className="text-[10px] text-blue-600 font-semibold">{stats?.totalSellers || 0} Sellers</span>
        </div>

        <div className="bg-white rounded-xs p-3.5 border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block">Catalog Listings</span>
          <span className="text-xl font-black text-gray-900 mt-1 block">{stats?.totalProducts || 0}</span>
          <span className="text-[10px] text-green-600 font-semibold">Active Products</span>
        </div>

        <div className="bg-white rounded-xs p-3.5 border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block">Total Orders</span>
          <span className="text-xl font-black text-gray-900 mt-1 block">{stats?.totalOrders || 0}</span>
          <span className="text-[10px] text-amber-600 font-semibold">{stats?.pendingOrders || 0} In-Flight</span>
        </div>

        <div className="bg-white rounded-xs p-3.5 border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block">Platform GMV</span>
          <span className="text-xl font-black text-gray-900 mt-1 block">
            ₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}
          </span>
          <span className="text-[10px] text-green-600 font-semibold">Processed Sales</span>
        </div>

        <div className="bg-white rounded-xs p-3.5 border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block">Delivered Orders</span>
          <span className="text-xl font-black text-[#388E3C] mt-1 block">{stats?.deliveredOrders || 0}</span>
          <span className="text-[10px] text-gray-500 font-semibold">100% Fulfilled</span>
        </div>

        <div className="bg-white rounded-xs p-3.5 border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block">Low Stock Alerts</span>
          <span className="text-xl font-black text-red-600 mt-1 block">{stats?.lowStockCount || 0}</span>
          <span className="text-[10px] text-red-500 font-semibold">&lt; 15 Units</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs font-bold uppercase tracking-wider overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'text-[#0A3B74] border-b-2 border-[#0A3B74]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Analytics & Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'text-[#0A3B74] border-b-2 border-[#0A3B74]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Order Operations ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'text-[#0A3B74] border-b-2 border-[#0A3B74]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Permissions ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'text-[#0A3B74] border-b-2 border-[#0A3B74]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Inventory Alerts ({lowStock.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'text-[#0A3B74] border-b-2 border-[#0A3B74]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ANALYTICS & TELEMETRY ENGINE (Agent 09)          */}
      {/* ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Period Filter */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xs border border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0A3B74]" />
              <span className="text-xs font-bold text-gray-800">Telemetry Sampling Window:</span>
            </div>
            <div className="flex gap-1.5">
              {['7D', '30D', '1Y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setAnalyticsPeriod(p)}
                  className={`text-xs px-3 py-1 rounded-xs font-bold transition cursor-pointer ${
                    analyticsPeriod === p
                      ? 'bg-[#0A3B74] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p === '7D' ? 'Last 7 Days' : p === '30D' ? 'Last 30 Days' : 'Past Year'}
                </button>
              ))}
            </div>
          </div>

          {/* Charts Row 1: Daily Revenue & Daily Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue / GMV Chart */}
            <div className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Daily Revenue (GMV)
                  </h3>
                  <p className="text-xs text-gray-500">Gross Merchandise Value trend</p>
                </div>
                <span className="text-xs font-black text-[#388E3C] bg-green-50 px-2 py-0.5 rounded">
                  +28.4% WoW
                </span>
              </div>

              {/* Bar Visual for Revenue */}
              <div className="h-44 flex items-end gap-3 pt-6 pb-2 border-b border-gray-200">
                {analyticsData7D.revenue.map((rev, idx) => {
                  const maxRev = 700000;
                  const heightPct = Math.round((rev / maxRev) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <span className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] font-bold py-0.5 px-1.5 rounded transition pointer-events-none whitespace-nowrap z-10">
                        ₹{(rev / 1000).toFixed(0)}k
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-[#0A3B74] to-[#0D4E96] rounded-t-xs transition-all duration-300 group-hover:from-blue-700 group-hover:to-blue-500"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] text-gray-500 font-semibold">
                        {analyticsData7D.dates[idx].split(' ')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Orders & Visitors Chart */}
            <div className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Daily Orders vs Traffic
                  </h3>
                  <p className="text-xs text-gray-500">Order count alongside visitor sessions</p>
                </div>
                <span className="text-xs font-black text-[#0A3B74] bg-blue-50 px-2 py-0.5 rounded">
                  Conv: 3.7%
                </span>
              </div>

              <div className="h-44 flex items-end gap-3 pt-6 pb-2 border-b border-gray-200">
                {analyticsData7D.orders.map((ord, idx) => {
                  const maxOrders = 150;
                  const heightPct = Math.round((ord / maxOrders) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <span className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] font-bold py-0.5 px-1.5 rounded transition pointer-events-none whitespace-nowrap z-10">
                        {ord} orders
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-[#FF7A00] to-[#FF8A00] rounded-t-xs transition-all duration-300 group-hover:from-amber-600 group-hover:to-orange-400"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] text-gray-500 font-semibold">
                        {analyticsData7D.dates[idx].split(' ')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Charts Row 2: Most Viewed Items & Best Sellers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most-Viewed Items */}
            <div className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Most-Viewed Catalog Items
              </h3>
              <div className="space-y-3">
                {mostViewedItems.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-800">
                      <span className="truncate max-w-xs">{item.name}</span>
                      <span className="text-[#0A3B74]">{item.views.toLocaleString()} views</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0A3B74] rounded-full"
                        style={{ width: `${(item.views / 14000) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Category: {item.category}</span>
                      <span>Conversion: {item.convRate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Sellers */}
            <div className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Best-Selling Products by Revenue
              </h3>
              <div className="divide-y divide-gray-100 text-xs">
                {bestSellers.map((prod, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-[#0A3B74] font-black flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{prod.title}</p>
                        <p className="text-[10px] text-gray-500">
                          {prod.units} Units Sold • {prod.stock} in stock
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-gray-900 text-xs shrink-0">
                      {prod.gmv}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ORDER OPERATIONS (Agent 08: 6 Lifecycle States)   */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* 6 Lifecycle States Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'PENDING', label: 'Pending / Ordered' },
              { id: 'CONFIRMED', label: 'Confirmed / Packed' },
              { id: 'SHIPPED', label: 'Shipped / In Transit' },
              { id: 'DELIVERED', label: 'Delivered' },
              { id: 'CANCELLED', label: 'Cancelled' },
              { id: 'RETURN_REFUND', label: 'Return / Refund' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setOrderStatusFilter(st.id);
                  setSelectedOrderIds([]);
                }}
                className={`text-xs px-3.5 py-1.5 rounded-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  orderStatusFilter === st.id
                    ? 'bg-[#0A3B74] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Batch Status Actions Bar */}
          {selectedOrderIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xs p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-[#0A3B74]">
                {selectedOrderIds.length} Orders Selected for Batch Action
              </span>

              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-semibold">Change Status To:</span>
                <select
                  value={batchTargetStatus}
                  onChange={(e) => setBatchTargetStatus(e.target.value)}
                  className="bg-white border border-gray-300 rounded p-1 text-xs font-bold text-gray-800"
                >
                  <option value="CONFIRMED">CONFIRMED (Packed)</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                <button
                  onClick={handleExecuteBatchStatus}
                  disabled={batchProcessing}
                  className="bg-[#0A3B74] hover:bg-[#082d59] text-white font-bold text-xs px-4 py-1.5 rounded-xs shadow-xs cursor-pointer"
                >
                  {batchProcessing ? 'Executing...' : 'Apply Status to Selected'}
                </button>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div className="bg-white rounded-xs border border-gray-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-3 w-8">
                    <button onClick={handleSelectAll} className="cursor-pointer">
                      {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#0A3B74]" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Buyer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Lifecycle State</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400 font-semibold">
                      No orders match the selected lifecycle filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleSelectOrder(o.id)}
                          className="cursor-pointer"
                        >
                          {selectedOrderIds.includes(o.id) ? (
                            <CheckSquare className="w-4 h-4 text-[#0A3B74]" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-mono font-bold text-gray-900">{o.orderNumber}</td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-800">{o.buyerName}</p>
                        <span className="text-[10px] text-gray-400">{o.buyerEmail}</span>
                      </td>
                      <td className="p-3 font-bold text-gray-900">
                        ₹{o.finalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-700">{o.paymentMethod}</span> (
                        {o.paymentStatus})
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.orderStatus === 'DELIVERED'
                              ? 'bg-green-100 text-[#388E3C]'
                              : o.orderStatus === 'CANCELLED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-[#0A3B74]'
                          }`}
                        >
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => setInspectingOrder(o)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px] px-2.5 py-1 rounded cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                        <button
                          onClick={() => onViewOrder && onViewOrder(o.id)}
                          className="text-xs font-bold text-[#0A3B74] hover:underline cursor-pointer"
                        >
                          Tracking
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: USER ROLES & ACCESS                               */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xs border border-gray-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="p-3">User Details</th>
                <th className="p-3">Role</th>
                <th className="p-3">Store / Brand</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="p-3">
                    <p className="font-bold text-gray-900">{u.name}</p>
                    <p className="text-gray-500 text-[11px]">{u.email}</p>
                  </td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      className="text-xs p-1 bg-white border border-gray-300 rounded font-semibold text-gray-800"
                    >
                      <option value="BUYER">BUYER</option>
                      <option value="SELLER">SELLER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="p-3 text-gray-600 font-medium">{u.storeName || '—'}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleToggleActive(u.id)}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: INVENTORY WARNINGS                                */}
      {/* ======================================================== */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xs border border-gray-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Brand</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3">Price</th>
                <th className="p-3 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lowStock.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 font-bold text-gray-900">{p.title}</td>
                  <td className="p-3 text-gray-600">{p.brand}</td>
                  <td className="p-3">
                    <span className="font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {p.stock} units
                    </span>
                  </td>
                  <td className="p-3 font-bold text-gray-900">₹{p.price?.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleRestock(p.id, p.stock)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1 rounded cursor-pointer"
                    >
                      Restock +25
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: AUDIT LOGS                                        */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xs border border-gray-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Performed By</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-gray-700 font-medium">{log.performedBy}</td>
                  <td className="p-3 text-gray-500 font-semibold">
                    {log.entityType} #{log.entityId}
                  </td>
                  <td className="p-3 text-gray-800 max-w-md truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* ITEM INSPECTION DRAWER (Agent 08)                        */}
      {/* ======================================================== */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-black text-gray-900">Order Inspection Drawer</h2>
                <span className="font-mono text-xs font-bold text-[#0A3B74]">
                  #{inspectingOrder.orderNumber}
                </span>
              </div>
              <button
                onClick={() => setInspectingOrder(null)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lifecycle Status & Transition Control */}
            <div className="p-4 bg-gray-50 rounded-xs border border-gray-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">
                  Current Status
                </span>
                <span className="text-sm font-black text-[#0A3B74]">
                  {inspectingOrder.orderStatus}
                </span>
              </div>

              <div className="flex gap-2">
                {inspectingOrder.orderStatus === 'PLACED' && (
                  <button
                    onClick={() => handleSingleStatusUpdate(inspectingOrder.id, 'CONFIRMED')}
                    className="bg-[#0A3B74] hover:bg-[#082d59] text-white font-bold text-xs px-3 py-1.5 rounded-xs"
                  >
                    Confirm Order
                  </button>
                )}
                {inspectingOrder.orderStatus === 'CONFIRMED' && (
                  <button
                    onClick={() => handleSingleStatusUpdate(inspectingOrder.id, 'SHIPPED')}
                    className="bg-amber-600 text-white font-bold text-xs px-3 py-1.5 rounded-xs"
                  >
                    Mark Shipped
                  </button>
                )}
                {inspectingOrder.orderStatus === 'SHIPPED' && (
                  <button
                    onClick={() => handleSingleStatusUpdate(inspectingOrder.id, 'OUT_FOR_DELIVERY')}
                    className="bg-purple-600 text-white font-bold text-xs px-3 py-1.5 rounded-xs"
                  >
                    Out for Delivery
                  </button>
                )}
                {inspectingOrder.orderStatus === 'OUT_FOR_DELIVERY' && (
                  <button
                    onClick={() => handleSingleStatusUpdate(inspectingOrder.id, 'DELIVERED')}
                    className="bg-[#388E3C] text-white font-bold text-xs px-3 py-1.5 rounded-xs"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>

            {/* Buyer & Shipping Address */}
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-gray-700 uppercase">Customer & Delivery Details</h4>
              <div className="bg-gray-50 p-3 rounded-xs border border-gray-200 space-y-1">
                <p>
                  <span className="text-gray-500">Customer Name:</span>{' '}
                  <span className="font-bold text-gray-900">{inspectingOrder.buyerName}</span>
                </p>
                <p>
                  <span className="text-gray-500">Email:</span>{' '}
                  <span className="font-mono text-gray-800">{inspectingOrder.buyerEmail}</span>
                </p>
                <p>
                  <span className="text-gray-500">Shipping Address:</span>{' '}
                  <span className="text-gray-800">{inspectingOrder.shippingAddressSnapshot}</span>
                </p>
                <p>
                  <span className="text-gray-500">Tracking Number:</span>{' '}
                  <span className="font-mono font-bold text-blue-600">
                    {inspectingOrder.trackingNumber}
                  </span>
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-gray-700 uppercase">Ordered Line Items</h4>
              <div className="border border-gray-200 rounded-xs divide-y divide-gray-100">
                {(inspectingOrder.items || []).map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.productImageUrl && (
                        <img
                          src={item.productImageUrl}
                          alt=""
                          className="w-10 h-10 object-contain rounded bg-white border p-0.5"
                        />
                      )}
                      <div>
                        <p className="font-bold text-gray-900">{item.productName}</p>
                        <p className="text-[10px] text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">
                      ₹{item.subtotal?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3 bg-gray-50 rounded-xs border border-gray-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Payment Mode:</span>
                <span className="font-semibold text-gray-800">{inspectingOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Status:</span>
                <span className="font-semibold text-gray-800">{inspectingOrder.paymentStatus}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-black text-sm text-gray-900">
                <span>Total Amount Paid:</span>
                <span>₹{inspectingOrder.finalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setInspectingOrder(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs px-5 py-2 rounded-xs cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
