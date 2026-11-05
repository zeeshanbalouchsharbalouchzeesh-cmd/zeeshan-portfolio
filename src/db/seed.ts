import { db } from './index.ts';
import {
  tenants,
  users,
  categories,
  suppliers,
  products,
  customers,
  sales,
  saleItems,
  expenses,
  subscriptions,
  auditLogs,
} from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedDatabaseIfEmpty() {
  try {
    const existingTenants = await db.select().from(tenants);
    if (existingTenants.length > 0) {
      return;
    }

    console.log('Seeding initial ShopMaster multi-tenant SaaS data...');

    // 1. Create Primary Tenant (Apex Electronics & Mobiles)
    const [shop1] = await db
      .insert(tenants)
      .values({
        slug: 'apex-electronics',
        name: 'Apex Electronics & Mobiles',
        businessType: 'electronics',
        currency: '$',
        taxRate: '8.50',
        address: 'Suite 401, Tech Avenue, Silicon Plaza',
        phone: '+1 (555) 234-5678',
        email: 'contact@apexelectronics.io',
        logoUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=120&q=80',
        receiptHeader: 'Apex Electronics — Next-Gen Retail & Tech',
        receiptFooter: 'Warranty valid for 12 months with invoice. Thank you for your business!',
        receiptFormat: 'thermal-80mm',
        theme: 'midnight-teal',
        subscriptionTier: 'professional',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months ahead
      })
      .returning();

    // 2. Create Second Tenant (FreshMart Supermarket)
    const [shop2] = await db
      .insert(tenants)
      .values({
        slug: 'freshmart-grocers',
        name: 'FreshMart Supermarket',
        businessType: 'grocery',
        currency: '$',
        taxRate: '5.00',
        address: '74 Market Square, Green District',
        phone: '+1 (555) 876-5432',
        email: 'info@freshmart.store',
        logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80',
        receiptHeader: 'FreshMart — Farm Fresh Everyday',
        receiptFooter: 'Fresh groceries are non-refundable after 48 hours.',
        receiptFormat: 'thermal-58mm',
        theme: 'emerald-green',
        subscriptionTier: 'starter',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      })
      .returning();

    // 3. Create Super Admin (Zeeshan Hyder) and Shop Staff
    const [superAdminUser] = await db
      .insert(users)
      .values({
        uid: 'demo-superadmin-uid',
        email: 'zeeshanbalouchsharbalouchzeesh@gmail.com',
        name: 'Zeeshan Hyder',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        role: 'super_admin',
        tenantId: shop1.id,
        isActive: true,
      })
      .returning();

    const [ownerUser] = await db
      .insert(users)
      .values({
        uid: 'demo-owner-uid',
        email: 'owner@apexelectronics.io',
        name: 'Marcus Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        role: 'owner',
        tenantId: shop1.id,
        isActive: true,
      })
      .returning();

    const [cashierUser] = await db
      .insert(users)
      .values({
        uid: 'demo-cashier-uid',
        email: 'sarah.cashier@apexelectronics.io',
        name: 'Sarah Jenkins',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        role: 'cashier',
        tenantId: shop1.id,
        isActive: true,
      })
      .returning();

    // 4. Create Categories
    const [catPhones] = await db
      .insert(categories)
      .values({ tenantId: shop1.id, name: 'Smartphones & Tablets', description: 'Flagship mobile devices' })
      .returning();
    const [catAudio] = await db
      .insert(categories)
      .values({ tenantId: shop1.id, name: 'Audio & Headphones', description: 'Wireless & noise-cancelling headphones' })
      .returning();
    const [catLaptops] = await db
      .insert(categories)
      .values({ tenantId: shop1.id, name: 'Laptops & Computing', description: 'Ultrabooks and productivity machines' })
      .returning();
    const [catAccessories] = await db
      .insert(categories)
      .values({ tenantId: shop1.id, name: 'Cables & Power', description: 'GaN chargers, docks and MagSafe accessories' })
      .returning();

    // 5. Create Suppliers
    const [supplierApple] = await db
      .insert(suppliers)
      .values({
        tenantId: shop1.id,
        name: 'Global Tech Distribution LLC',
        contactPerson: 'David Chen',
        phone: '+1 (555) 345-6789',
        email: 'sales@globaltechdist.com',
        address: '100 Distribution Blvd, Cargo Bay 4',
        balanceDue: '1450.00',
      })
      .returning();

    const [supplierAudio] = await db
      .insert(suppliers)
      .values({
        tenantId: shop1.id,
        name: 'Acoustic Sound Labs',
        contactPerson: 'Elena Rostova',
        phone: '+1 (555) 987-6543',
        email: 'orders@acousticsound.net',
        address: '88 High-Fi Way, Austin TX',
        balanceDue: '0.00',
      })
      .returning();

    // 6. Create Products with Barcodes & Accurate Purchase/Selling Prices
    const sampleProducts = [
      {
        tenantId: shop1.id,
        categoryId: catPhones.id,
        supplierId: supplierApple.id,
        name: 'iPhone 15 Pro Max (256GB - Titanium)',
        description: 'A17 Pro chip, aerospace titanium frame, 48MP main camera.',
        imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=400&q=80',
        sku: 'APL-IP15PM-256',
        barcode: '8901234567890',
        barcodeFormat: 'EAN-13' as const,
        purchasePrice: '920.00',
        sellingPrice: '1199.00',
        discountRate: '5.00',
        discountType: 'percentage' as const,
        quantity: 18,
        minStockAlert: 5,
        unit: 'pcs',
      },
      {
        tenantId: shop1.id,
        categoryId: catPhones.id,
        supplierId: supplierApple.id,
        name: 'Samsung Galaxy S24 Ultra (512GB)',
        description: 'Snapdragon 8 Gen 3, Galaxy AI, Titanium Grey.',
        imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80',
        sku: 'SAM-S24U-512',
        barcode: '8902345678901',
        barcodeFormat: 'EAN-13' as const,
        purchasePrice: '980.00',
        sellingPrice: '1299.00',
        discountRate: '50.00',
        discountType: 'fixed' as const,
        quantity: 12,
        minStockAlert: 4,
        unit: 'pcs',
      },
      {
        tenantId: shop1.id,
        categoryId: catAudio.id,
        supplierId: supplierAudio.id,
        name: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Industry-leading noise cancellation, 30-hour battery life.',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
        sku: 'SNY-WH1000XM5',
        barcode: '8903456789012',
        barcodeFormat: 'Code 128' as const,
        purchasePrice: '260.00',
        sellingPrice: '399.00',
        discountRate: '0.00',
        discountType: 'percentage' as const,
        quantity: 24,
        minStockAlert: 6,
        unit: 'pcs',
      },
      {
        tenantId: shop1.id,
        categoryId: catLaptops.id,
        supplierId: supplierApple.id,
        name: 'MacBook Air 15" M3 (16GB / 512GB)',
        description: 'Liquid Retina display, MagSafe 3, Midnight finish.',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
        sku: 'APL-MBA15-M3',
        barcode: '8904567890123',
        barcodeFormat: 'Code 128' as const,
        purchasePrice: '1250.00',
        sellingPrice: '1499.00',
        discountRate: '0.00',
        discountType: 'percentage' as const,
        quantity: 8,
        minStockAlert: 3,
        unit: 'pcs',
      },
      {
        tenantId: shop1.id,
        categoryId: catAccessories.id,
        supplierId: supplierAudio.id,
        name: 'Anker Prime 67W GaN Fast Wall Charger',
        description: '3-Port ultra-compact high-speed USB-C charging brick.',
        imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80',
        sku: 'ANK-67W-GAN',
        barcode: '8905678901234',
        barcodeFormat: 'Code 128' as const,
        purchasePrice: '28.00',
        sellingPrice: '59.99',
        discountRate: '10.00',
        discountType: 'percentage' as const,
        quantity: 45,
        minStockAlert: 10,
        unit: 'pcs',
      },
      {
        tenantId: shop1.id,
        categoryId: catAccessories.id,
        supplierId: supplierAudio.id,
        name: 'Logitech MX Master 3S Wireless Mouse',
        description: 'Quiet clicks, 8K DPI sensor, ergonomic hand rest.',
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80',
        sku: 'LOG-MXM3S-BLK',
        barcode: '8906789012345',
        barcodeFormat: 'Code 128' as const,
        purchasePrice: '62.00',
        sellingPrice: '99.99',
        discountRate: '0.00',
        discountType: 'percentage' as const,
        quantity: 3, // LOW STOCK TRIGGER FOR DASHBOARD ALERT!
        minStockAlert: 5,
        unit: 'pcs',
      },
      {
        tenantId: shop1.id,
        categoryId: catAudio.id,
        supplierId: supplierAudio.id,
        name: 'JBL Flip 6 Portable Bluetooth Speaker',
        description: 'IP67 waterproof and dustproof, 2-way speaker system.',
        imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=400&q=80',
        sku: 'JBL-FLIP6-RED',
        barcode: '8907890123456',
        barcodeFormat: 'Code 128' as const,
        purchasePrice: '75.00',
        sellingPrice: '129.95',
        discountRate: '15.00',
        discountType: 'percentage' as const,
        quantity: 2, // CRITICAL LOW STOCK
        minStockAlert: 4,
        unit: 'pcs',
      },
    ];

    const insertedProducts = await db.insert(products).values(sampleProducts).returning();

    // 7. Create Customers
    const [cust1] = await db
      .insert(customers)
      .values({
        tenantId: shop1.id,
        name: 'Alexander Wright',
        phone: '+1 (555) 432-1098',
        email: 'alex.wright@corporate.org',
        address: '42 Wallaby Way, Metro City',
        creditLimit: '2500.00',
        totalPurchases: '3896.95',
        balanceOwed: '450.00', // Unpaid credit record
      })
      .returning();

    const [cust2] = await db
      .insert(customers)
      .values({
        tenantId: shop1.id,
        name: 'Sophia Patel',
        phone: '+1 (555) 654-3210',
        email: 'spatel@designstudio.co',
        address: '19 Kensington High St',
        creditLimit: '1500.00',
        totalPurchases: '1299.00',
        balanceOwed: '0.00',
      })
      .returning();

    // 8. Create Realistic Sales History
    const [sale1] = await db
      .insert(sales)
      .values({
        tenantId: shop1.id,
        invoiceNumber: 'INV-2026-001',
        customerId: cust1.id,
        userId: cashierUser.id,
        subtotal: '1199.00',
        discountAmount: '59.95',
        taxAmount: '96.82',
        grandTotal: '1235.87',
        costTotal: '920.00',
        paidAmount: '785.87',
        paymentMethod: 'split',
        paymentStatus: 'partial',
        notes: 'Partial payment made in cash, remaining $450 billed to credit account.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      })
      .returning();

    await db.insert(saleItems).values({
      tenantId: shop1.id,
      saleId: sale1.id,
      productId: insertedProducts[0].id,
      productName: insertedProducts[0].name,
      sku: insertedProducts[0].sku,
      quantity: 1,
      purchasePriceSnapshot: insertedProducts[0].purchasePrice,
      sellingPriceSnapshot: insertedProducts[0].sellingPrice,
      discountAmount: '59.95',
      taxAmount: '96.82',
      total: '1235.87',
    });

    const [sale2] = await db
      .insert(sales)
      .values({
        tenantId: shop1.id,
        invoiceNumber: 'INV-2026-002',
        customerId: cust2.id,
        userId: cashierUser.id,
        subtotal: '458.99',
        discountAmount: '6.00',
        taxAmount: '38.50',
        grandTotal: '491.49',
        costTotal: '288.00',
        paidAmount: '491.49',
        paymentMethod: 'digital',
        paymentStatus: 'paid',
        notes: 'NFC Card Tap. Customer requested digital receipt via WhatsApp.',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // Today
      })
      .returning();

    await db.insert(saleItems).values([
      {
        tenantId: shop1.id,
        saleId: sale2.id,
        productId: insertedProducts[2].id, // Sony XM5
        productName: insertedProducts[2].name,
        sku: insertedProducts[2].sku,
        quantity: 1,
        purchasePriceSnapshot: insertedProducts[2].purchasePrice,
        sellingPriceSnapshot: insertedProducts[2].sellingPrice,
        discountAmount: '0.00',
        taxAmount: '33.91',
        total: '432.91',
      },
      {
        tenantId: shop1.id,
        saleId: sale2.id,
        productId: insertedProducts[4].id, // Anker Charger
        productName: insertedProducts[4].name,
        sku: insertedProducts[4].sku,
        quantity: 1,
        purchasePriceSnapshot: insertedProducts[4].purchasePrice,
        sellingPriceSnapshot: insertedProducts[4].sellingPrice,
        discountAmount: '6.00',
        taxAmount: '4.59',
        total: '58.58',
      },
    ]);

    // 9. Create Categorized Operating Expenses & Losses
    await db.insert(expenses).values([
      {
        tenantId: shop1.id,
        userId: ownerUser.id,
        category: 'rent',
        title: 'Silicon Plaza Retail Showroom Rent (Nov 2026)',
        amount: '1800.00',
        paymentMethod: 'bank',
        date: '2026-11-01',
        description: 'Monthly commercial lease fee',
      },
      {
        tenantId: shop1.id,
        userId: ownerUser.id,
        category: 'electricity',
        title: 'Commercial Power & HVAC Utilities',
        amount: '240.50',
        paymentMethod: 'bank',
        date: '2026-11-03',
        description: 'Peak store air conditioning & lighting',
      },
      {
        tenantId: shop1.id,
        userId: ownerUser.id,
        category: 'salaries',
        title: 'Cashier Staff Bi-Weekly Payroll',
        amount: '1200.00',
        paymentMethod: 'bank',
        date: '2026-11-04',
        description: 'Payroll for retail floor staff',
      },
      {
        tenantId: shop1.id,
        userId: ownerUser.id,
        category: 'losses',
        title: 'Display Case Drop Damage (Screen Shatter)',
        amount: '145.00',
        paymentMethod: 'cash',
        date: '2026-11-02',
        description: 'Damaged during showcase restocking',
      },
    ]);

    // 10. Create SaaS Subscriptions
    await db.insert(subscriptions).values([
      {
        tenantId: shop1.id,
        plan: 'professional',
        billingCycle: 'monthly',
        price: '49.00',
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        tenantId: shop2.id,
        plan: 'starter',
        billingCycle: 'monthly',
        price: '29.00',
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);

    // 11. Initial Audit Logs
    await db.insert(auditLogs).values({
      tenantId: shop1.id,
      userId: superAdminUser.id,
      action: 'system_initialized',
      resourceType: 'workspace',
      resourceId: String(shop1.id),
      details: 'ShopMaster workspace provisioned with Midnight Teal theme and professional tier.',
    });

    console.log('ShopMaster multi-tenant seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
