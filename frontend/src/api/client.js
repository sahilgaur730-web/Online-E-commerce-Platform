// API client connecting to Spring Boot backend
const BASE_URL = '/api';

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('shopkart_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data?.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (data) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (data) =>
    apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Products & Categories
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    return apiRequest(`/products?${query.toString()}`);
  },
  getProductById: (id) => apiRequest(`/products/${id}`),
  getFeaturedProducts: () => apiRequest('/products/featured'),
  getDeals: () => apiRequest('/products/deals'),
  getTopOffers: () => apiRequest('/products/top-offers'),
  getBrands: (categoryId) =>
    apiRequest(`/products/brands${categoryId ? `?categoryId=${categoryId}` : ''}`),
  getCategories: () => apiRequest('/categories'),

  // Cart
  getCart: () => apiRequest('/cart'),
  addToCart: (productId, quantity = 1) =>
    apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  updateCartQuantity: (itemId, quantity) =>
    apiRequest(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  removeFromCart: (itemId) =>
    apiRequest(`/cart/items/${itemId}`, {
      method: 'DELETE',
    }),
  clearCart: () =>
    apiRequest('/cart/clear', {
      method: 'DELETE',
    }),

  // Orders
  getOrders: () => apiRequest('/orders'),
  getOrderById: (id) => apiRequest(`/orders/${id}`),
  createOrder: (addressId, paymentMethod) =>
    apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({ addressId, paymentMethod }),
    }),
  cancelOrder: (id, reason) =>
    apiRequest(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  updateOrderStatus: (id, status, note) =>
    apiRequest(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    }),

  // Payments
  createPaymentIntent: (orderId, paymentMethod) =>
    apiRequest('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentMethod }),
    }),
  verifyPayment: (orderId, transactionId, success = true, signature = null) =>
    apiRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, transactionId, success, signature }),
    }),

  // Addresses
  getAddresses: () => apiRequest('/addresses'),
  addAddress: (data) =>
    apiRequest('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAddress: (id, data) =>
    apiRequest(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAddress: (id) =>
    apiRequest(`/addresses/${id}`, {
      method: 'DELETE',
    }),

  // Reviews
  getReviews: (productId) => apiRequest(`/products/${productId}/reviews`),
  addReview: (productId, data) =>
    apiRequest(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Wishlist
  getWishlist: () => apiRequest('/wishlist'),
  toggleWishlist: (productId) =>
    apiRequest(`/wishlist/${productId}`, {
      method: 'POST',
    }),
  checkWishlist: (productId) => apiRequest(`/wishlist/check/${productId}`),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  getUnreadNotificationsCount: () => apiRequest('/notifications/unread-count'),
  markNotificationRead: (id) =>
    apiRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: () =>
    apiRequest('/notifications/read-all', {
      method: 'PUT',
    }),

  // Seller
  getSellerProducts: () => apiRequest('/seller/products'),
  createSellerProduct: (data) =>
    apiRequest('/seller/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSellerProduct: (id, data) =>
    apiRequest(`/seller/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSellerProduct: (id) =>
    apiRequest(`/seller/products/${id}`, {
      method: 'DELETE',
    }),
  getSellerOrders: () => apiRequest('/orders/seller'),
  getSellerSubOrders: () => apiRequest('/orders/seller/sub-orders'),
  getOrderSubOrders: (orderId) => apiRequest(`/orders/${orderId}/sub-orders`),
  updateSubOrderStatus: (subOrderId, status, note) =>
    apiRequest(`/orders/sub-orders/${subOrderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    }),
  uploadSellerImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('shopkart_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/seller/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to upload image');
    }
    return data?.data !== undefined ? data.data : data;
  },
  getSellerDashboard: () => apiRequest('/seller/dashboard'),

  // Admin
  getAdminDashboard: () => apiRequest('/admin/dashboard'),
  getAdminUsers: () => apiRequest('/admin/users'),
  updateUserRole: (id, role) =>
    apiRequest(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  toggleUserActive: (id) =>
    apiRequest(`/admin/users/${id}/toggle-active`, {
      method: 'PUT',
    }),
  getAdminAuditLogs: () => apiRequest('/admin/audit-logs'),
  getAdminLowStock: (threshold = 10) =>
    apiRequest(`/admin/inventory/low-stock?threshold=${threshold}`),
  updateProductStock: (id, stock) =>
    apiRequest(`/seller/products/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ stock }),
    }),
  getAllOrders: (page = 0, size = 20) =>
    apiRequest(`/orders/all?page=${page}&size=${size}`),
};
