import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  Plus,
  Trash2,
  CheckCircle,
  X,
  Star,
} from 'lucide-react';

export function SellerPortalPage({ onViewProduct }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'inventory'
  const [loading, setLoading] = useState(true);

  // New Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [productForm, setProductForm] = useState({
    title: '',
    brand: '',
    categoryId: '',
    price: '',
    originalPrice: '',
    stock: 15,
    description: '',
    specifications: '',
    imageUrls: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80'],
    featured: false,
    dealOfTheDay: false,
    topOffer: false,
  });
  const [savingProduct, setSavingProduct] = useState(false);

  const loadSellerData = async () => {
    try {
      setLoading(true);
      const [statsData, prodsData, ordersData, catsData] = await Promise.all([
        api.getSellerDashboard(),
        api.getSellerProducts(),
        api.getSellerOrders(),
        api.getCategories(),
      ]);
      setStats(statsData);
      setProducts(prodsData || []);
      setOrders(ordersData || []);
      setCategories(catsData || []);
      if (catsData && catsData.length > 0 && !productForm.categoryId) {
        setProductForm((prev) => ({ ...prev, categoryId: catsData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load seller portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setSavingProduct(true);
      const payload = {
        ...productForm,
        categoryId: Number(productForm.categoryId),
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : Number(productForm.price),
        stock: Number(productForm.stock),
      };
      await api.createSellerProduct(payload);
      setShowAddModal(false);
      loadSellerData();
      alert('Product published to ShopKart catalog successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteSellerProduct(id);
      loadSellerData();
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus, `Status updated to ${newStatus} by seller`);
      loadSellerData();
      alert(`Order updated to ${newStatus}`);
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleRestockProduct = async (productId, currentStock) => {
    const qty = prompt(`Enter new stock quantity for this item (current: ${currentStock}):`, currentStock + 20);
    if (qty !== null && !isNaN(qty)) {
      try {
        await api.updateProductStock(productId, Number(qty));
        loadSellerData();
      } catch (err) {
        alert(err.message || 'Failed to update stock');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2874F0] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 mt-2">Loading Seller Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Seller Header */}
      <div className="bg-white rounded-xs p-5 shadow-xs border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-xs flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {user?.storeName || 'Seller Hub'}
            </h1>
            <p className="text-xs text-gray-500">
              Seller Portal • {user?.email} • Verified Partner
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#2874F0] hover:bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xs p-4 border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500">Total Products</span>
          <div className="text-2xl font-black text-gray-900 mt-1">{stats?.totalProducts || 0}</div>
          <span className="text-[11px] text-[#388E3C] font-semibold">Active in Catalog</span>
        </div>

        <div className="bg-white rounded-xs p-4 border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500">Total Orders</span>
          <div className="text-2xl font-black text-gray-900 mt-1">{stats?.totalOrders || 0}</div>
          <span className="text-[11px] text-blue-600 font-semibold">{stats?.pendingOrders || 0} pending fulfilment</span>
        </div>

        <div className="bg-white rounded-xs p-4 border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500">Gross Revenue</span>
          <div className="text-2xl font-black text-gray-900 mt-1">₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}</div>
          <span className="text-[11px] text-[#388E3C] font-semibold">Processed Sales</span>
        </div>

        <div className="bg-white rounded-xs p-4 border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500">Low Stock Alerts</span>
          <div className="text-2xl font-black text-red-600 mt-1">{stats?.lowStockCount || 0}</div>
          <span className="text-[11px] text-red-500 font-semibold">Needs Restocking</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 cursor-pointer transition ${
            activeTab === 'products'
              ? 'text-[#2874F0] border-b-2 border-[#2874F0]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Products Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 cursor-pointer transition ${
            activeTab === 'orders'
              ? 'text-[#2874F0] border-b-2 border-[#2874F0]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Orders Received ({orders.length})
        </button>
      </div>

      {/* Tab 1: Products Table */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xs border border-gray-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Selling Price</th>
                <th className="p-3">MRP</th>
                <th className="p-3">Stock Units</th>
                <th className="p-3">Rating</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No products added yet. Click 'Add New Product' to list your items.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.primaryImage || 'https://placehold.co/50x50'}
                          alt=""
                          className="w-9 h-9 object-contain rounded border border-gray-200"
                        />
                        <div>
                          <p
                            onClick={() => onViewProduct(p.id)}
                            className="font-bold text-gray-900 hover:text-[#2874F0] cursor-pointer line-clamp-1 max-w-xs"
                          >
                            {p.title}
                          </p>
                          <span className="text-[10px] text-gray-400 font-semibold">{p.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-gray-700">{p.categoryName}</td>
                    <td className="p-3 font-bold text-gray-900">₹{p.price?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-gray-400 line-through">₹{p.originalPrice?.toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleRestockProduct(p.id, p.stock)}
                        className={`font-bold px-2 py-0.5 rounded text-xs cursor-pointer ${
                          p.stock < 10
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-green-50 text-green-700'
                        }`}
                        title="Click to restock"
                      >
                        {p.stock} units
                      </button>
                    </td>
                    <td className="p-3 font-semibold text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <span>{p.rating}</span>
                        <Star className="w-3 h-3 fill-current text-amber-500 inline" />
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Orders Received Table */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xs border border-gray-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Update Progression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No orders received yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 font-mono font-bold text-gray-900">{o.orderNumber}</td>
                    <td className="p-3">
                      <p className="font-semibold text-gray-800">{o.buyerName}</p>
                      <span className="text-[10px] text-gray-400">{o.buyerEmail}</span>
                    </td>
                    <td className="p-3 font-bold text-gray-900">₹{o.finalAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span className="font-semibold text-gray-700">{o.paymentMethod}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#2874F0]">
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {o.orderStatus === 'PLACED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'CONFIRMED')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1 rounded cursor-pointer"
                          >
                            Confirm Order
                          </button>
                        )}
                        {o.orderStatus === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'SHIPPED')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1 rounded cursor-pointer"
                          >
                            Mark Shipped
                          </button>
                        )}
                        {o.orderStatus === 'SHIPPED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'OUT_FOR_DELIVERY')}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2.5 py-1 rounded cursor-pointer"
                          >
                            Out for Delivery
                          </button>
                        )}
                        {o.orderStatus === 'OUT_FOR_DELIVERY' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED')}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] px-2.5 py-1 rounded cursor-pointer"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {o.orderStatus === 'DELIVERED' && (
                          <span className="text-green-700 font-bold text-[11px] flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xs shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">Add Product to Catalog</h3>
              <X className="w-5 h-5 text-gray-400 hover:text-gray-700 cursor-pointer" onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-CH520 Wireless Bluetooth Headphones"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony, Apple, Nike"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="4499"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">MRP Original (₹)</label>
                  <input
                    type="number"
                    placeholder="5999"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={productForm.imageUrls[0]}
                  onChange={(e) => setProductForm({ ...productForm, imageUrls: [e.target.value] })}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detailed product features..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Technical Specifications (Key: Value)</label>
                <textarea
                  rows={2}
                  placeholder="Battery: 50 Hours&#10;Connectivity: Bluetooth 5.2&#10;Weight: 147g"
                  value={productForm.specifications}
                  onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none font-mono"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.dealOfTheDay}
                    onChange={(e) => setProductForm({ ...productForm, dealOfTheDay: e.target.checked })}
                  />
                  Deal of the Day
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.topOffer}
                    onChange={(e) => setProductForm({ ...productForm, topOffer: e.target.checked })}
                  />
                  Top Offer
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 font-bold bg-[#2874F0] hover:bg-blue-600 text-white rounded-xs shadow-xs"
                >
                  {savingProduct ? 'Publishing...' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
