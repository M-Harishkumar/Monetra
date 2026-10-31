/**
 * NEXORA Unified API Client
 */

const API_BASE = '/api';

export class ApiError extends Error {
  code: string;
  errors?: any;
  status: number;

  constructor(message: string, code = 'ERROR', status = 400, errors?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.errors = errors;
  }
}

let authToken: string | null = localStorage.getItem('nexora_token');
let demoRoleOverride: string | null = localStorage.getItem('nexora_demo_role') || 'ADMIN';

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('nexora_token', token);
  } else {
    localStorage.removeItem('nexora_token');
  }
}

export function setDemoRole(role: string) {
  demoRoleOverride = role;
  localStorage.setItem('nexora_demo_role', role);
}

export function getDemoRole(): string {
  return demoRoleOverride || 'ADMIN';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  } else if (demoRoleOverride) {
    headers.set('x-demo-role', demoRoleOverride);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new ApiError(
      data.message || 'An unexpected error occurred while communicating with the server.',
      data.code || 'REQUEST_FAILED',
      response.status,
      data.errors
    );
  }

  return data.data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (payload: any) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  forgotPassword: (email: string) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  switchRole: (role: string) =>
    request<{ token: string; user: any }>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  getMe: () => request<any>('/auth/me'),

  // Profile & User Directory Management
  getProfile: () => request<any>('/users/profile'),
  getUserProfile: (id: string) => request<any>(`/users/${id}/profile`),
  getAllUsers: () => request<any[]>('/users/all'),
  updateProfile: (payload: any) =>
    request<any>('/users/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  updateUserProfile: (id: string, payload: any) =>
    request<any>(`/users/${id}/profile`, { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload: { currentPassword?: string; newPassword: string; confirmPassword: string }) =>
    request<any>('/users/change-password', { method: 'PUT', body: JSON.stringify(payload) }),
  updateUserPassword: (id: string, payload: { currentPassword?: string; newPassword: string; confirmPassword: string }) =>
    request<any>(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Staff
  getStaff: () => request<any[]>('/users/staff'),
  createStaff: (payload: any) =>
    request('/users/staff', { method: 'POST', body: JSON.stringify(payload) }),

  // Customers
  getCustomers: (params?: { search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    return request<any[]>(`/customers?${q.toString()}`);
  },
  getCustomer: (id: string) => request<any>(`/customers/${id}`),
  createCustomer: (payload: any) =>
    request('/customers', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomer: (id: string, payload: any) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  setCustomerStatus: (id: string, status: string) =>
    request(`/customers/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),

  // Products
  getProducts: () => request<any[]>('/products'),
  createProduct: (payload: any) =>
    request('/products', { method: 'POST', body: JSON.stringify(payload) }),

  // Plans
  getPlans: () => request<any[]>('/plans'),
  createPlan: (payload: any) =>
    request('/plans', { method: 'POST', body: JSON.stringify(payload) }),

  // Quotations
  getQuotations: () => request<any[]>('/quotations'),
  createQuotation: (payload: any) =>
    request('/quotations', { method: 'POST', body: JSON.stringify(payload) }),
  updateQuotationStatus: (id: string, status: string) =>
    request(`/quotations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  convertQuotation: (id: string) =>
    request<{ subscription: any; invoice: any }>(`/quotations/${id}/convert`, { method: 'POST' }),

  // Subscriptions
  getSubscriptions: () => request<any[]>('/subscriptions'),
  getSubscription: (id: string) => request<any>(`/subscriptions/${id}`),
  transitionSubscription: (id: string, action: string, reason?: string) =>
    request(`/subscriptions/${id}/transition`, { method: 'POST', body: JSON.stringify({ action, reason }) }),

  // Billing Engine
  getBillingRuns: () => request<any[]>('/billing/runs'),
  triggerBillingRun: () => request<any>('/billing/trigger', { method: 'POST' }),

  // Invoices
  getInvoices: () => request<any[]>('/invoices'),
  getInvoice: (id: string) => request<any>(`/invoices/${id}`),
  confirmInvoice: (id: string) => request(`/invoices/${id}/confirm`, { method: 'POST' }),
  cancelInvoice: (id: string, reason: string) =>
    request(`/invoices/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Payments
  getPayments: () => request<any[]>('/payments'),
  recordPayment: (payload: any) =>
    request('/payments', { method: 'POST', body: JSON.stringify(payload) }),
  reversePayment: (id: string, reason: string) =>
    request(`/payments/${id}/reverse`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Revenue Guard
  getRevenueGuardAlerts: () => request<any[]>('/revenue-guard/alerts'),
  scanRevenueGuard: () => request<any>('/revenue-guard/scan', { method: 'POST' }),
  updateAlert: (id: string, payload: any) =>
    request(`/revenue-guard/alerts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Health Score
  getSubscriptionHealth: () => request<any[]>('/subscription-health'),

  // Renewals & Dunning
  getUpcomingRenewals: () => request<any>('/renewals/upcoming'),
  sendReminder: (payload: any) =>
    request('/renewals/send-reminder', { method: 'POST', body: JSON.stringify(payload) }),

  // Simulators
  previewSubscriptionChange: (payload: any) =>
    request<any>('/simulator/subscription-change', { method: 'POST', body: JSON.stringify(payload) }),
  applySubscriptionChange: (payload: any) =>
    request<any>('/simulator/apply-change', { method: 'POST', body: JSON.stringify(payload) }),
  getScenarios: () => request<any[]>('/simulator/scenarios'),
  createScenario: (payload: any) =>
    request<any>('/simulator/scenarios', { method: 'POST', body: JSON.stringify(payload) }),

  // Reconciliation
  getReconciliationData: () => request<any>('/reconciliation/transactions'),
  uploadReconciliationCsv: (payload: { fileName: string; csvContent: string }) =>
    request<any>('/reconciliation/upload', { method: 'POST', body: JSON.stringify(payload) }),
  matchReconciliation: (payload: { bankTransactionId: string; invoiceId: string }) =>
    request<any>('/reconciliation/match', { method: 'POST', body: JSON.stringify(payload) }),

  // Analytics & Logs
  getDashboardAnalytics: () => request<any>('/analytics/dashboard'),
  getAuditLogs: () => request<any[]>('/audit-logs'),
  getEmailLogs: () => request<any[]>('/email-logs'),
  getSettings: () => request<any[]>('/settings'),
  saveSettings: (settings: any[]) =>
    request('/settings', { method: 'POST', body: JSON.stringify({ settings }) }),
  loginWithGoogle: (payload: { uid: string; email: string; name: string; photoURL?: string }) =>
    request<{ token: string; user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // AI & Speech Intelligence
  sendChatMessage: (payload: {
    model?: string;
    systemInstruction?: string;
    messages: any[];
    message: string;
  }) =>
    request<{ text: string; model: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  transcribeAudio: (payload: { audio: string; mimeType: string }) =>
    request<{ transcript: string; model: string }>('/ai/transcribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Currency Formatting helper
export function formatCurrency(amount: number | string | undefined, currency = 'INR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  if (isNaN(num)) return '₹0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
