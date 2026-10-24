import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Utility to extract a cookie value by name from document.cookie
 */
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

// Request interceptor to automatically attach the double-submit CSRF token
api.interceptors.request.use(async (config) => {
  const method = (config.method || 'GET').toUpperCase();

  // For state-changing requests, attach X-CSRF-Token
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    let csrfToken = getCookie('iktis_csrf');

    // If cookie is not yet present, fetch it from the server
    if (!csrfToken) {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/csrf`,
          { withCredentials: true }
        );
        csrfToken = response.data?.data?.csrfToken;
      } catch (err) {
        console.warn('Failed to pre-fetch CSRF token:', err);
      }
    }

    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return config;
});

export const authApi = {
  getCsrf: () => api.get('/auth/csrf'),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const propertyApi = {
  list: (params) => api.get('/properties', { params }),
  get: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.patch(`/properties/${id}`, data),
  archive: (id) => api.delete(`/properties/${id}`),
};

export const roomApi = {
  listByProperty: (propertyId, params) => api.get(`/properties/${propertyId}/rooms`, { params }),
  get: (id) => api.get(`/rooms/${id}`),
  create: (propertyId, data) => api.post(`/properties/${propertyId}/rooms`, data),
  update: (id, data) => api.patch(`/rooms/${id}`, data),
  archive: (id) => api.delete(`/rooms/${id}`),
};

export const tenantApi = {
  list: (params) => api.get('/tenants', { params }),
  get: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.patch(`/tenants/${id}`, data),
  archive: (id) => api.delete(`/tenants/${id}`),
};

export const tenancyApi = {
  list: (params) => api.get('/tenancies', { params }),
  get: (id) => api.get(`/tenancies/${id}`),
  create: (data) => api.post('/tenancies', data),
  end: (id, data) => api.patch(`/tenancies/${id}/end`, data),
};

export const rentChargeApi = {
  list: (params) => api.get('/rent-charges', { params }),
  get: (id) => api.get(`/rent-charges/${id}`),
  summary: (month) => api.get('/rent-charges/summary', { params: { month } }),
  generate: (month) => api.post('/rent-charges/generate', { month }),
  create: (data) => api.post('/rent-charges', data),
  update: (id, data) => api.patch(`/rent-charges/${id}`, data),
  remove: (id) => api.delete(`/rent-charges/${id}`),
};

export const paymentApi = {
  list: (params) => api.get('/payments', { params }),
  get: (id) => api.get(`/payments/${id}`),
  getReceipt: (id) => api.get(`/payments/${id}/receipt`),
  getTenantOutstanding: (tenantId) => api.get(`/payments/tenant-outstanding/${tenantId}`),
  record: (data) => api.post('/payments', data),
  void: (id, data) => api.post(`/payments/${id}/void`, data),
};

export const dashboardApi = {
  getSummary: (month) => api.get('/dashboard/summary', { params: month ? { month } : {} }),
};

export const reportApi = {
  getMonthlyTrends: (params) => api.get('/reports/monthly-trends', { params }),
  getTenantBalances: () => api.get('/reports/tenant-balances'),
  getPropertyPerformance: (month) => api.get('/reports/property-performance', { params: month ? { month } : {} }),
  getPaymentsLedger: (params) => api.get('/reports/payments-ledger', { params }),
};

export default api;

