import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Tenants / Workspaces (Isolated retail shops)
export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  businessType: text('business_type').notNull().default('general'), // grocery, clothing, mobile, electronics, cosmetics, pharmacy, general, other
  currency: text('currency').notNull().default('$'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
  address: text('address').default(''),
  phone: text('phone').default(''),
  email: text('email').default(''),
  logoUrl: text('logo_url').default(''),
  receiptHeader: text('receipt_header').default('Thank you for shopping with us!'),
  receiptFooter: text('receipt_footer').default('Items can be exchanged within 7 days with original receipt.'),
  receiptFormat: text('receipt_format').notNull().default('thermal-80mm'), // thermal-58mm, thermal-80mm, a4
  theme: text('theme').notNull().default('midnight-teal'), // midnight-teal, royal-purple, emerald-green, pure-white, midnight-black
  subscriptionTier: text('subscription_tier').notNull().default('starter'), // starter, professional, enterprise
  subscriptionStatus: text('subscription_status').notNull().default('active'), // active, trial, expired, past_due
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users with Role-Based Access Control
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').default(''),
  avatarUrl: text('avatar_url').default(''),
  tenantId: integer('tenant_id').references(() => tenants.id),
  role: text('role').notNull().default('cashier'), // super_admin, owner, manager, cashier, staff
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Product Categories per Tenant
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Suppliers per Tenant
export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  contactPerson: text('contact_person').default(''),
  phone: text('phone').default(''),
  email: text('email').default(''),
  address: text('address').default(''),
  balanceDue: numeric('balance_due', { precision: 12, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products & Inventory per Tenant
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  categoryId: integer('category_id').references(() => categories.id),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  name: text('name').notNull(),
  description: text('description').default(''),
  imageUrl: text('image_url').default(''),
  sku: text('sku').notNull(),
  barcode: text('barcode').notNull(),
  barcodeFormat: text('barcode_format').notNull().default('Code 128'), // EAN-13, UPC-A, Code 128
  purchasePrice: numeric('purchase_price', { precision: 12, scale: 2 }).notNull().default('0.00'),
  sellingPrice: numeric('selling_price', { precision: 12, scale: 2 }).notNull().default('0.00'),
  discountRate: numeric('discount_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
  discountType: text('discount_type').notNull().default('percentage'), // percentage, fixed
  quantity: integer('quantity').notNull().default(0),
  minStockAlert: integer('min_stock_alert').notNull().default(5),
  unit: text('unit').notNull().default('pcs'), // pcs, kg, g, ltr, box, pack
  expiryDate: text('expiry_date').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Customers per Tenant
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  phone: text('phone').default(''),
  email: text('email').default(''),
  address: text('address').default(''),
  creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }).notNull().default('1000.00'),
  totalPurchases: numeric('total_purchases', { precision: 12, scale: 2 }).notNull().default('0.00'),
  balanceOwed: numeric('balance_owed', { precision: 12, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Sales & POS Transactions
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  invoiceNumber: text('invoice_number').notNull(),
  customerId: integer('customer_id').references(() => customers.id),
  userId: integer('user_id').references(() => users.id),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0.00'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull().default('0.00'),
  costTotal: numeric('cost_total', { precision: 12, scale: 2 }).notNull().default('0.00'), // For accurate real-time gross profit calculation
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  paymentMethod: text('payment_method').notNull().default('cash'), // cash, bank, digital, credit, split
  paymentStatus: text('payment_status').notNull().default('paid'), // paid, partial, credit, refunded
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Line Items for Each Sale
export const saleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  saleId: integer('sale_id').notNull().references(() => sales.id),
  productId: integer('product_id').references(() => products.id),
  productName: text('product_name').notNull(),
  sku: text('sku').default(''),
  quantity: integer('quantity').notNull(),
  purchasePriceSnapshot: numeric('purchase_price_snapshot', { precision: 12, scale: 2 }).notNull().default('0.00'),
  sellingPriceSnapshot: numeric('selling_price_snapshot', { precision: 12, scale: 2 }).notNull().default('0.00'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0.00'),
});

// Stock Movements (In, Out, Adjustments, Damaged)
export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  productId: integer('product_id').notNull().references(() => products.id),
  userId: integer('user_id').references(() => users.id),
  type: text('type').notNull(), // purchase_in, sale_out, adjustment, return_in, damaged_loss
  quantityDelta: integer('quantity_delta').notNull(),
  costPerUnit: numeric('cost_per_unit', { precision: 12, scale: 2 }).default('0.00'),
  reason: text('reason').default(''),
  referenceId: text('reference_id').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Categorized Operating Expenses & Losses
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  userId: integer('user_id').references(() => users.id),
  category: text('category').notNull(), // rent, electricity, salaries, transport, maintenance, marketing, losses, other
  title: text('title').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  paymentMethod: text('payment_method').notNull().default('cash'), // cash, bank, digital
  date: text('date').notNull(), // YYYY-MM-DD
  description: text('description').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Customer Debt Repayments
export const customerPayments = pgTable('customer_payments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull().default('cash'),
  note: text('note').default(''),
  recordedBy: integer('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(), // create, update, delete, stock_change, refund, settings_change
  resourceType: text('resource_type').notNull(), // product, sale, customer, expense, setting
  resourceId: text('resource_id').default(''),
  details: text('details').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// SaaS Subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  plan: text('plan').notNull().default('starter'), // starter, professional, enterprise
  billingCycle: text('billing_cycle').notNull().default('monthly'), // monthly, yearly
  price: numeric('price', { precision: 12, scale: 2 }).notNull().default('29.00'),
  status: text('status').notNull().default('active'), // active, trial, expired, past_due
  startDate: timestamp('start_date').defaultNow(),
  expiryDate: timestamp('expiry_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Drizzle Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  products: many(products),
  categories: many(categories),
  customers: many(customers),
  sales: many(sales),
  expenses: many(expenses),
  suppliers: many(suppliers),
  auditLogs: many(auditLogs),
  subscriptions: many(subscriptions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  sales: many(sales),
  expenses: many(expenses),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [categories.tenantId],
    references: [tenants.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  saleItems: many(saleItems),
  stockMovements: many(stockMovements),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sales.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  sales: many(sales),
  payments: many(customerPayments),
}));
