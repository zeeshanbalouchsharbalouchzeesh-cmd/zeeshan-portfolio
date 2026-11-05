import {
  Tenant,
  User,
  Product,
  Category,
  Supplier,
  Customer,
  Sale,
  Expense,
  DashboardStats,
  Subscription,
  AuditLog,
  UserRole,
} from '../types/index.ts';

let currentTenantId: number = 1;

export function setActiveTenantId(id: number) {
  currentTenantId = id;
}

export function getActiveTenantId(): number {
  return currentTenantId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('x-tenant-id', String(currentTenantId));

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Bootstrap & Context
  bootstrap: () => request<{
    success: boolean;
    activeTenant: Tenant;
    activeUser: User;
    allTenants: Tenant[];
    currentUserRole: UserRole;
  }>('/bootstrap'),

  switchTenant: (tenantId: number) =>
    request<{ success: boolean; tenant: Tenant }>('/tenants/switch', {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
    }),

  switchRole: (role: UserRole) =>
    request<{ success: boolean; user: User }>('/users/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  // Tenants
  getCurrentTenant: () => request<Tenant>('/tenants/current'),
  getAllTenants: () => request<(Tenant & { userCount: number; salesCount: number; totalRevenue: number })[]>('/tenants/all'),
  createTenant: (data: Partial<Tenant>) =>
    request<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(data) }),
  updateTenant: (id: number, data: Partial<Tenant>) =>
    request<Tenant>(`/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Products
  getProducts: (params?: { search?: string; categoryId?: number; lowStock?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.categoryId) searchParams.set('categoryId', String(params.categoryId));
    if (params?.lowStock) searchParams.set('lowStock', 'true');
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<Product[]>(`/products${query}`);
  },
  createProduct: (product: Partial<Product>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id: number, updates: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  deleteProduct: (id: number) =>
    request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),
  adjustStock: (id: number, delta: number, type: string, reason?: string) =>
    request<Product>(`/products/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ delta, type, reason }),
    }),

  // Categories & Suppliers
  getCategories: () => request<Category[]>('/categories'),
  createCategory: (cat: { name: string; description?: string }) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(cat) }),
  getSuppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (sup: Partial<Supplier>) =>
    request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(sup) }),

  // Customers
  getCustomers: () => request<Customer[]>('/customers'),
  createCustomer: (cust: Partial<Customer>) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(cust) }),
  recordCustomerPayment: (id: number, payment: { amount: number | string; paymentMethod: string; note?: string }) =>
    request<{ success: boolean; newBalance: string }>(`/customers/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(payment),
    }),

  // Sales & POS
  getSales: () => request<Sale[]>('/sales'),
  createSale: (saleData: {
    customerId?: number | null;
    items: {
      productId: number;
      quantity: number;
      price: number;
      discount: number;
      total: number;
    }[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
    paidAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    notes?: string;
  }) => request<Sale>('/sales', { method: 'POST', body: JSON.stringify(saleData) }),
  refundSale: (id: number) =>
    request<{ success: boolean; sale: Sale }>(`/sales/${id}/refund`, { method: 'POST' }),

  // Expenses & Financials
  getExpenses: () => request<Expense[]>('/expenses'),
  createExpense: (exp: Partial<Expense>) =>
    request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(exp) }),

  // Analytics & Logs
  getDashboardStats: () => request<DashboardStats>('/analytics/dashboard'),
  getSubscriptions: () => request<Subscription[]>('/subscriptions'),
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),
};
