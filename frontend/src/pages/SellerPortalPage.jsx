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
  Package,
  UploadCloud,
  Truck,
  Layers,
} from 'lucide-react';

export function SellerPortalPage({ onViewProduct }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'packages', 'orders'
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const loadSellerData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, prodsData, ordersData, subOrdersData, catsData] = await Promise.all([
        api.getSellerDashboard(),
        api.getSellerProducts(),
        api.getSellerOrders(),
        api.getSellerSubOrders().catch(() => []),
        api.getCategories(),
      ]);
      setStats(statsData);
      setProducts(prodsData || []);
      setOrders(ordersData || []);
      setSubOrders(subOrdersData || []);
      setCategories(catsData || []);
      if (catsData && catsData.length > 0) {
        setProductForm((prev) => (prev.categoryId ? prev : { ...prev, categoryId: catsData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load seller portal data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSellerData();
  }, [loadSellerData]);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      setUploadingImage(true);
      const uploaded = await api.uploadSellerImage(file);
      if (uploaded?.imageUrl) {
        setProductForm((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls.filter((url) => !url.includes('unsplash') || prev.imageUrls.length > 1), uploaded.imageUrl],
        }));
      }
    } catch (err) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

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

  const handleUpdatePackageStatus = async (subOrderId, newStatus, customNote = null) => {
    try {
      const note = customNote || `Package updated to ${newStatus} by vendor`;
      await api.updateSubOrderStatus(subOrderId, newStatus, note);
      loadSellerData();
      alert(`Vendor package successfully updated to ${newStatus}`);
    } catch (err) {
      alert(err.message || 'Failed to update package status');
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
        <p className="text-xs text-slate-500 mt-2">Loading Seller Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Seller Header */}
      <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/90 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-blue-50 text-[#0A3B74] rounded-xl flex items-center justify-center border border-blue-200/60">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {user?.storeName || 'Seller Hub'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Verified Partner Portal • {user?.email} • GST Registered
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#2874F0] hover:bg-[#0A3B74] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Active Products</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.totalProducts || 0}</div>
          <span className="text-[11px] text-[#388E3C] font-semibold">Live in Catalog</span>
        </div>

        <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Vendor Packages</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{subOrders.length}</div>
          <span className="text-[11px] text-blue-600 font-semibold">{stats?.pendingOrders || 0} pending dispatch</span>
        </div>

        <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Gross Sales</span>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}</div>
          <span className="text-[11px] text-[#388E3C] font-semibold">Settled Revenue</span>
        </div>

        <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Low Stock Alerts</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats?.lowStockCount || 0}</div>
          <span className="text-[11px] text-rose-500 font-semibold">Immediate Restock</span>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 cursor-pointer transition-all ${
            activeTab === 'products'
              ? 'text-[#0A3B74] border-b-2 border-[#2874F0]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Products Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`pb-3 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === 'packages'
              ? 'text-[#0A3B74] border-b-2 border-[#2874F0]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 text-[#2874F0]" />
          Vendor Packages ({subOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 cursor-pointer transition-all ${
            activeTab === 'orders'
              ? 'text-[#0A3B74] border-b-2 border-[#2874F0]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Master Orders ({orders.length})
        </button>
      </div>

      {/* Tab 1: Products Table */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">MRP</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Rating</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    No products added yet. Click 'Add New Product' to list your items.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.primaryImage || 'https://placehold.co/50x50'}
                          alt=""
                          className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5"
                        />
                        <div>
                          <p
                            onClick={() => onViewProduct(p.id)}
                            className="font-bold text-slate-900 hover:text-[#2874F0] cursor-pointer line-clamp-1 max-w-xs"
                          >
                            {p.title}
                          </p>
                          <span className="text-[10px] text-slate-400 font-semibold">{p.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">{p.categoryName}</td>
                    <td className="p-3.5 font-bold text-slate-900">₹{p.price?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-slate-400 line-through">₹{p.originalPrice?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleRestockProduct(p.id, p.stock)}
                        className={`font-bold px-2.5 py-1 rounded-md text-xs cursor-pointer transition ${
                          p.stock < 10
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                        title="Click to restock"
                      >
                        {p.stock} units
                      </button>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <span>{p.rating}</span>
                        <Star className="w-3 h-3 fill-current text-amber-500 inline" />
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-md hover:bg-rose-50 transition cursor-pointer"
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

      {/* Tab 2: Vendor Packages / Sub-Orders (Package Splitting Fulfillment) */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex items-center justify-between text-xs text-[#0A3B74]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2874F0]" />
              <span className="font-semibold">
                Multi-Seller Package Splitting: Your dispatches operate independently from other sellers in the same customer order.
              </span>
            </div>
            <span className="font-bold text-[11px] bg-white px-2.5 py-1 rounded-full border border-blue-200">
              Zero Vendor Premature Alteration
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Package ID</th>
                  <th className="p-3.5">Master Order</th>
                  <th className="p-3.5">Package Items</th>
                  <th className="p-3.5">Parcel Value</th>
                  <th className="p-3.5">Tracking No.</th>
                  <th className="p-3.5">Package Status</th>
                  <th className="p-3.5 text-right">Fulfillment Progression</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      No vendor packages assigned yet. When buyers purchase your items, parcels appear here.
                    </td>
                  </tr>
                ) : (
                  subOrders.map((so) => (
                    <tr key={so.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 font-mono font-bold text-[#0A3B74]">{so.subOrderNumber}</td>
                      <td className="p-3.5 font-mono text-slate-600">{so.orderNumber}</td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          {so.items?.map((it) => (
                            <div key={it.id} className="flex items-center gap-1.5 text-slate-800">
                              <span className="truncate max-w-[180px] font-medium">{it.productName}</span>
                              <span className="text-slate-500 font-bold">x{it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">₹{so.subtotal?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-mono text-blue-600 font-semibold">{so.trackingNumber || 'Pending'}</td>
                      <td className="p-3.5">
                        <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                          so.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : so.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : so.status === 'CONFIRMED'
                            ? 'bg-amber-100 text-amber-800'
                            : so.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {so.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {so.status === 'PLACED' && (
                            <>
                              <button
                                onClick={() => handleUpdatePackageStatus(so.id, 'CONFIRMED')}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer shadow-2xs"
                              >
                                Confirm Parcel
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Reason for cancelling this package:');
                                  if (reason) handleUpdatePackageStatus(so.id, 'CANCELLED', reason);
                                }}
                                className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1.5 rounded text-xs font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {so.status === 'CONFIRMED' && (
                            <>
                              <button
                                onClick={() => handleUpdatePackageStatus(so.id, 'SHIPPED')}
                                className="bg-[#2874F0] hover:bg-[#0A3B74] text-white font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer shadow-2xs flex items-center gap-1"
                              >
                                <Truck className="w-3.5 h-3.5" /> Mark Shipped
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Reason for cancelling this package:');
                                  if (reason) handleUpdatePackageStatus(so.id, 'CANCELLED', reason);
                                }}
                                className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1.5 rounded text-xs font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {so.status === 'SHIPPED' && (
                            <button
                              onClick={() => handleUpdatePackageStatus(so.id, 'OUT_FOR_DELIVERY')}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer shadow-2xs"
                            >
                              Out for Delivery
                            </button>
                          )}
                          {so.status === 'OUT_FOR_DELIVERY' && (
                            <button
                              onClick={() => handleUpdatePackageStatus(so.id, 'DELIVERED')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer shadow-2xs"
                            >
                              Mark Delivered
                            </button>
                          )}
                          {so.status === 'DELIVERED' && (
                            <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Fulfilled
                            </span>
                          )}
                          {so.status === 'CANCELLED' && (
                            <span className="text-rose-600 font-bold text-xs">
                              Cancelled
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
        </div>
      )}

      {/* Tab 3: Orders Received Table */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Update Progression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No orders received yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{o.buyerName}</p>
                      <span className="text-[10px] text-slate-400">{o.buyerEmail}</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">₹{o.finalAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-700">{o.paymentMethod}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({o.paymentStatus})</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        o.orderStatus === 'DELIVERED'
                          ? 'bg-green-100 text-green-800'
                          : o.orderStatus === 'SHIPPED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {o.orderStatus === 'PLACED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, 'CONFIRMED')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-xs cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      {o.orderStatus === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, 'SHIPPED')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-xs cursor-pointer"
                        >
                          Ship
                        </button>
                      )}
                      {o.orderStatus === 'SHIPPED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, 'OUT_FOR_DELIVERY')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded text-xs cursor-pointer"
                        >
                          Out for Delivery
                        </button>
                      )}
                      {o.orderStatus === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED')}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-2.5 py-1 rounded text-xs cursor-pointer"
                        >
                          Deliver
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add New Product Modal with Real Drag-and-Drop Physical Image Upload */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Add New Product to Catalog</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony, Apple, Samsung"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2874F0] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="4499"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MRP Original (₹)</label>
                  <input
                    type="number"
                    placeholder="5999"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Units</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
              </div>

              {/* Physical Product Image Drag & Drop Uploader */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Product Photos (Physical Upload or URL)</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                    dragActive
                      ? 'border-[#2874F0] bg-blue-50/50'
                      : 'border-slate-300 hover:border-[#2874F0] bg-slate-50/50'
                  }`}
                >
                  <UploadCloud className="w-8 h-8 text-[#2874F0] mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">
                    {uploadingImage ? 'Streaming physical image to storage...' : 'Drag & drop physical product image here'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, WEBP, GIF up to 10MB</p>
                  <label className="inline-block mt-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-3 py-1.5 rounded-md cursor-pointer transition shadow-2xs">
                    Browse Local File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                  </label>
                </div>

                {/* Uploaded Images Preview Strip */}
                {productForm.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mt-3">
                    {productForm.imageUrls.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-white p-1 group">
                        <img src={url} alt="" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setProductForm({
                            ...productForm,
                            imageUrls: productForm.imageUrls.filter((_, i) => i !== idx),
                          })}
                          className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detailed product features..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2874F0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Technical Specifications (Key: Value)</label>
                <textarea
                  rows={2}
                  placeholder="Battery: 50 Hours&#10;Connectivity: Bluetooth 5.2&#10;Weight: 147g"
                  value={productForm.specifications}
                  onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2874F0] focus:outline-none font-mono"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={productForm.dealOfTheDay}
                    onChange={(e) => setProductForm({ ...productForm, dealOfTheDay: e.target.checked })}
                  />
                  Deal of the Day
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={productForm.topOffer}
                    onChange={(e) => setProductForm({ ...productForm, topOffer: e.target.checked })}
                  />
                  Top Offer
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                  className="bg-[#2874F0] hover:bg-[#0A3B74] text-white font-bold px-6 py-2 rounded-lg cursor-pointer transition shadow-xs disabled:opacity-50"
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
