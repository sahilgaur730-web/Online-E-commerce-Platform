import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ShieldCheck } from 'lucide-react';

export function AdminDashboardPage({ onViewOrder }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'orders', 'inventory', 'audit'
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [dash, userList, orderList, logs, lowStockItems] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminUsers(),
        api.getAllOrders(),
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
  };

  useEffect(() => {
    loadAdminData();
  }, []);

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
    const qty = prompt(`Enter new stock units:`, current + 25);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2874F0] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 mt-2">Loading ShopKart Admin Portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Admin Header */}
      <div className="bg-white rounded-xs p-5 shadow-xs border border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 text-purple-800 rounded-xs flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">ShopKart Central Administration</h1>
            <p className="text-xs text-gray-500">
              Platform Analytics • Role Permissions • Multi-vendor Oversight • Audit Trails
            </p>
          </div>
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
          <span className="text-[11px] font-semibold text-gray-500 block">Catalog Products</span>
          <span className="text-xl font-black text-gray-900 mt-1 block">{stats?.totalProducts || 0}</span>
          <span className="text-[10px] text-green-600 font-semibold">Active Listings</span>
        </div>

        <div className="bg-white rounded-xs p-3.5 border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block">Total Orders</span>
          <span className="text-xl font-black text-gray-900 mt-1 block">{stats?.totalOrders || 0}</span>
          <span className="text-[10px] text-amber-600 font-semibold">{stats?.pendingOrders || 0} In-Flight</span>
        </div>

        <div className="bg-white rounded-xs p-3.5 border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block">Platform GMV</span>
          <span className="text-xl font-black text-gray-900 mt-1 block">₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}</span>
          <span className="text-[10px] text-green-600 font-semibold">Completed Sales</span>
        </div>

        <div className="bg-white rounded-xs p-3.5 border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block">Delivered Orders</span>
          <span className="text-xl font-black text-[#388E3C] mt-1 block">{stats?.deliveredOrders || 0}</span>
          <span className="text-[10px] text-gray-500 font-semibold">Fulfilled</span>
        </div>

        <div className="bg-white rounded-xs p-3.5 border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block">Low Stock Alerts</span>
          <span className="text-xl font-black text-red-600 mt-1 block">{stats?.lowStockCount || 0}</span>
          <span className="text-[10px] text-red-500 font-semibold">&lt; 10 Units</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 cursor-pointer transition ${
            activeTab === 'overview'
              ? 'text-[#2874F0] border-b-2 border-[#2874F0]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Overview & Categories
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 cursor-pointer transition ${
            activeTab === 'users'
              ? 'text-[#2874F0] border-b-2 border-[#2874F0]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          User Permissions ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 cursor-pointer transition ${
            activeTab === 'orders'
              ? 'text-[#2874F0] border-b-2 border-[#2874F0]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          System Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 cursor-pointer transition ${
            activeTab === 'inventory'
              ? 'text-[#2874F0] border-b-2 border-[#2874F0]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Inventory Warnings ({lowStock.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 cursor-pointer transition ${
            activeTab === 'audit'
              ? 'text-[#2874F0] border-b-2 border-[#2874F0]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Distribution Card */}
          <div className="bg-white rounded-xs p-5 border border-gray-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Catalog Category Distribution
            </h3>
            <div className="space-y-2">
              {stats?.categoryProductCount &&
                Object.entries(stats.categoryProductCount).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100">
                    <span className="font-semibold text-gray-800">{cat}</span>
                    <span className="bg-blue-50 text-[#2874F0] font-bold px-2 py-0.5 rounded">
                      {count} items
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick System Health */}
          <div className="bg-white rounded-xs p-5 border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Backend Architecture & Status
            </h3>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Core Architecture:</span>
                <span className="font-bold">Spring Boot 3.3.4 (Modular Monolith)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Java Version:</span>
                <span className="font-bold">Java 26 SE Runtime</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Security Provider:</span>
                <span className="font-bold">Spring Security 6 + JJWT HMAC-SHA256</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Database Engine:</span>
                <span className="font-bold">H2 In-Memory with JPA / Hibernate 6</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Inventory Concurrency:</span>
                <span className="font-bold text-[#388E3C]">Optimistic Locking (@Version)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: USERS */}
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
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
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

      {/* TAB: ALL ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xs border border-gray-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Buyer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Order Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 font-mono font-bold text-gray-900">{o.orderNumber}</td>
                  <td className="p-3">
                    <p className="font-semibold text-gray-800">{o.buyerName}</p>
                    <span className="text-[10px] text-gray-400">{o.buyerEmail}</span>
                  </td>
                  <td className="p-3 font-bold text-gray-900">₹{o.finalAmount?.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <span className="font-semibold text-gray-700">{o.paymentMethod}</span> ({o.paymentStatus})
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#2874F0]">
                      {o.orderStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onViewOrder && onViewOrder(o.id)}
                      className="text-xs font-bold text-[#2874F0] hover:underline cursor-pointer"
                    >
                      View Tracking
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: INVENTORY WARNINGS */}
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

      {/* TAB: AUDIT LOGS */}
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
                  <td className="p-3 text-gray-500 font-semibold">{log.entityType} #{log.entityId}</td>
                  <td className="p-3 text-gray-800 max-w-md truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
