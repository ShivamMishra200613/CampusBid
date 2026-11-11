const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
export const TOKEN_KEY = 'campusbid_token';

export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    try {
      const serverOrigin = new URL(apiUrl).origin;
      return `${serverOrigin}${url.startsWith('/') ? url : `/${url}`}`;
    } catch {
      return url;
    }
  }
  return url;
};

export class ApiError extends Error {
  constructor(code, message, details = null, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // If body is FormData, delete Content-Type so the browser sets boundary automatically
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return { success: true };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = { success: false, error: { code: 'PARSE_ERROR', message: response.statusText } };
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = '/login';
      }
    }

    const errObj = data.error || {};
    throw new ApiError(
      errObj.code || 'REQUEST_FAILED',
      errObj.message || 'Request failed.',
      errObj.details || null,
      response.status
    );
  }

  return data;
}

// REST helper methods
export const api = {
  get: (endpoint, options) => apiFetch(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    apiFetch(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options
    }),
  put: (endpoint, body, options) =>
    apiFetch(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options
    }),
  patch: (endpoint, body, options) =>
    apiFetch(endpoint, {
      method: 'PATCH',
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
      ...options
    }),
  delete: (endpoint, options) => apiFetch(endpoint, { method: 'DELETE', ...options })
};

// ==========================================
// API Domain Modules
// ==========================================

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (payload) => api.post('/auth/register', payload),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  getMe: () => api.get('/users/me'),
  updateMe: (payload) => api.put('/users/me', payload)
};

export const productsApi = {
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        query.set(key, val);
      }
    });
    const qs = query.toString();
    return api.get(`/products${qs ? `?${qs}` : ''}`);
  },
  getProductById: (id) => api.get(`/products/${id}`),
  getMyProducts: () => api.get('/products/mine'),
  createProduct: (payload) => api.post('/products', payload),
  updateProduct: (id, payload) => api.put(`/products/${id}`, payload),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  publishProduct: (id) => api.post(`/products/${id}/publish`),
  reportProduct: (id, reason) => api.post(`/products/${id}/report`, { reason })
};

export const bidsApi = {
  placeBid: (productId, amount) => api.post(`/products/${productId}/bids`, { amount: Number(amount) }),
  getProductBids: (productId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/products/${productId}/bids${query ? `?${query}` : ''}`);
  },
  getMyBids: (filter = 'all') => api.get(`/bids/my-bids?filter=${filter}`)
};

export const notificationsApi = {
  getNotifications: (unreadOnly = false) => api.get(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all')
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getPendingListings: () => api.get('/admin/listings/pending'),
  moderateListing: (id, action, reason = '') => api.post(`/admin/listings/${id}/moderate`, { action, reason }),
  getReports: () => api.get('/admin/reports'),
  resolveReport: (id, resolutionAction, notes = '') =>
    api.post(`/admin/reports/${id}/resolve`, { resolutionAction, notes }),
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/admin/users${query ? `?${query}` : ''}`);
  },
  suspendUser: (id) => api.patch(`/admin/users/${id}/suspend`),
  unsuspendUser: (id) => api.patch(`/admin/users/${id}/unsuspend`)
};

export const uploadApi = {
  uploadImages: (files) => {
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('images', f));
    return api.post('/uploads', formData);
  }
};
