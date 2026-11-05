export type BusinessType =
  | 'grocery'
  | 'clothing'
  | 'mobile'
  | 'electronics'
  | 'cosmetics'
  | 'pharmacy'
  | 'general'
  | 'retail';

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'cashier' | 'staff';

export type ReceiptFormat = 'thermal-58mm' | 'thermal-80mm' | 'a4';

export type ThemeName =
  | 'midnight-teal'
  | 'royal-purple'
  | 'emerald-green'
  | 'pure-white'
  | 'midnight-black';

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'past_due';

export interface Tenant {
  id: number;
  slug: string;
  name: string;
  businessType: BusinessType;
  currency: string;
  taxRate: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  receiptFormat: ReceiptFormat;
  theme: ThemeName;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: string | null;
  createdAt: string;
}

export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string;
  tenantId?: number | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  productCount?: number;
}

export interface Supplier {
  id: number;
  tenantId: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  balanceDue: string;
}

export interface Product {
  id: number;
  tenantId: number;
  categoryId?: number | null;
  categoryName?: string;
  supplierId?: number | null;
  supplierName?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sku: string;
  barcode: string;
  barcodeFormat: 'Code 128' | 'EAN-13' | 'UPC-A';
  purchasePrice: string;
  sellingPrice: string;
  discountRate: string;
  discountType: 'percentage' | 'fixed';
  quantity: number;
  minStockAlert: number;
  unit: string;
  expiryDate?: string;
  createdAt: string;
}

export interface Customer {
  id: number;
  tenantId: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit: string;
  totalPurchases: string;
  balanceOwed: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // Discount amount in currency per item or total
  price: number; // Unit selling price
  total: number; // (price - discount) * quantity
}

export interface Sale {
  id: number;
  tenantId: number;
  invoiceNumber: string;
  customerId?: number | null;
  customerName?: string;
  userId?: number | null;
  cashierName?: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  grandTotal: string;
  costTotal: string;
  paidAmount: string;
  paymentMethod: 'cash' | 'bank' | 'digital' | 'credit' | 'split';
  paymentStatus: 'paid' | 'partial' | 'credit' | 'refunded';
  notes?: string;
  createdAt: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: number;
  tenantId: number;
  saleId: number;
  productId?: number | null;
  productName: string;
  sku?: string;
  quantity: number;
  purchasePriceSnapshot: string;
  sellingPriceSnapshot: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
}

export interface StockMovement {
  id: number;
  tenantId: number;
  productId: number;
  productName?: string;
  userId?: number | null;
  userName?: string;
  type: 'purchase_in' | 'sale_out' | 'adjustment' | 'return_in' | 'damaged_loss';
  quantityDelta: number;
  costPerUnit?: string;
  reason?: string;
  referenceId?: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  tenantId: number;
  userId?: number | null;
  userName?: string;
  category: 'rent' | 'electricity' | 'salaries' | 'transport' | 'maintenance' | 'marketing' | 'losses' | 'other';
  title: string;
  amount: string;
  paymentMethod: 'cash' | 'bank' | 'digital';
  date: string;
  description?: string;
  createdAt: string;
}

export interface CustomerPayment {
  id: number;
  tenantId: number;
  customerId: number;
  customerName?: string;
  amount: string;
  paymentMethod: string;
  note?: string;
  recordedByName?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  tenantId: number;
  userId?: number | null;
  userName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  createdAt: string;
}

export interface Subscription {
  id: number;
  tenantId: number;
  tenantName?: string;
  plan: SubscriptionTier;
  billingCycle: 'monthly' | 'yearly';
  price: string;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
}

export interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  totalExpenses: number;
  totalLosses: number;
  productsSold: number;
  totalCustomers: number;
  pendingPayments: number;
  lowStockCount: number;
  grossMargin: number;
  netMargin: number;
  recentSales: Sale[];
  topSellingProducts: { id: number; name: string; quantitySold: number; revenue: number }[];
  monthlyPerformance: { month: string; sales: number; profit: number; expenses: number }[];
}
