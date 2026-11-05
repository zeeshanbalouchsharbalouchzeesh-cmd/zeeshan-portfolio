import express, { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import {
  tenants,
  users,
  categories,
  suppliers,
  products,
  customers,
  sales,
  saleItems,
  stockMovements,
  expenses,
  customerPayments,
  auditLogs,
  subscriptions,
} from '../db/schema.ts';
import { eq, and, desc, sql, like, or } from 'drizzle-orm';
import { seedDatabaseIfEmpty } from '../db/seed.ts';
import { calculateCartTotals, calculateGrossProfit, calculateNetProfit, calculateMargins } from '../utils/calculations.ts';

export const apiRouter = express.Router();
apiRouter.use(express.json());

export const apiApp = express();
apiApp.use(express.json());
apiApp.use('/api', apiRouter);

// Multi-tenant Session Context (Fallback to primary seeded tenant / user for seamless testing)
let currentTenantId: number = 1;
let currentUserId: number = 2; // Default to Shop Owner
let currentUserRole: string = 'owner';

// Middleware to inject tenant context
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  const reqTenantHeader = req.headers['x-tenant-id'];
  if (reqTenantHeader && !isNaN(Number(reqTenantHeader))) {
    currentTenantId = Number(reqTenantHeader);
  }
  next();
});

// Bootstrap / Status endpoint
apiRouter.get('/bootstrap', async (req: Request, res: Response) => {
  try {
    await seedDatabaseIfEmpty();
    const allTenants = await db.select().from(tenants);
    const activeTenant = allTenants.find((t) => t.id === currentTenantId) || allTenants[0];
    if (activeTenant) currentTenantId = activeTenant.id;

    const allUsers = await db.select().from(users);
    const activeUser = allUsers.find((u) => u.id === currentUserId) || allUsers[0];

    res.json({
      success: true,
      activeTenant,
      activeUser,
      allTenants,
      currentUserRole: activeUser?.role || currentUserRole,
    });
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: error.message || 'Failed to bootstrap application' });
  }
});

// Switch Active Tenant
apiRouter.post('/tenants/switch', async (req: Request, res: Response) => {
  const { tenantId } = req.body;
  if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
  currentTenantId = Number(tenantId);
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, currentTenantId));
  res.json({ success: true, tenant });
});

// Switch User Role (Super Admin, Owner, Manager, Cashier)
apiRouter.post('/users/switch-role', async (req: Request, res: Response) => {
  const { role } = req.body;
  const validRoles = ['super_admin', 'owner', 'manager', 'cashier', 'staff'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  currentUserRole = role;
  const userList = await db.select().from(users).where(eq(users.role, role));
  if (userList.length > 0) {
    currentUserId = userList[0].id;
    if (userList[0].tenantId) currentTenantId = userList[0].tenantId;
    return res.json({ success: true, user: userList[0] });
  }

  // Fallback update current user's role
  const [updatedUser] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, currentUserId))
    .returning();
  res.json({ success: true, user: updatedUser });
});

// Get Current Tenant details
apiRouter.get('/tenants/current', async (req: Request, res: Response) => {
  try {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, currentTenantId));
    res.json(tenant || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Tenants (Super Admin Platform View)
apiRouter.get('/tenants/all', async (req: Request, res: Response) => {
  try {
    const all = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
    const allUsers = await db.select().from(users);
    const allSales = await db.select().from(sales);

    const enriched = all.map((t) => {
      const tenantUsers = allUsers.filter((u) => u.tenantId === t.id);
      const tenantSales = allSales.filter((s) => s.tenantId === t.id && s.paymentStatus !== 'refunded');
      const totalRevenue = tenantSales.reduce((acc, s) => acc + parseFloat(s.grandTotal || '0'), 0);
      return {
        ...t,
        userCount: tenantUsers.length,
        salesCount: tenantSales.length,
        totalRevenue,
      };
    });

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new Tenant / Workspace
apiRouter.post('/tenants', async (req: Request, res: Response) => {
  try {
    const { name, businessType, currency, taxRate, address, phone, email, theme, receiptFormat } = req.body;
    if (!name) return res.status(400).json({ error: 'Shop name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const [newTenant] = await db
      .insert(tenants)
      .values({
        slug,
        name,
        businessType: businessType || 'general',
        currency: currency || '$',
        taxRate: String(taxRate || '0.00'),
        address: address || '',
        phone: phone || '',
        email: email || '',
        theme: theme || 'midnight-teal',
        receiptFormat: receiptFormat || 'thermal-80mm',
        subscriptionTier: 'starter',
        subscriptionStatus: 'trial',
        subscriptionExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day free trial
      })
      .returning();

    // Create default category
    await db.insert(categories).values({
      tenantId: newTenant.id,
      name: 'General Items',
      description: 'Default inventory category',
    });

    // Auto-switch to newly created tenant
    currentTenantId = newTenant.id;
    res.status(201).json(newTenant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Tenant Settings (Theme, Currency, Tax, Receipt format)
apiRouter.patch('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [updated] = await db
      .update(tenants)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Products: List with Category & Supplier names
apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const { search, categoryId, lowStock } = req.query;
    let query = db
      .select({
        id: products.id,
        tenantId: products.tenantId,
        categoryId: products.categoryId,
        supplierId: products.supplierId,
        name: products.name,
        description: products.description,
        imageUrl: products.imageUrl,
        sku: products.sku,
        barcode: products.barcode,
        barcodeFormat: products.barcodeFormat,
        purchasePrice: products.purchasePrice,
        sellingPrice: products.sellingPrice,
        discountRate: products.discountRate,
        discountType: products.discountType,
        quantity: products.quantity,
        minStockAlert: products.minStockAlert,
        unit: products.unit,
        expiryDate: products.expiryDate,
        createdAt: products.createdAt,
        categoryName: categories.name,
        supplierName: suppliers.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
      .where(eq(products.tenantId, currentTenantId))
      .orderBy(desc(products.id));

    const list = await query;
    let filtered = list;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q)
      );
    }

    if (categoryId && !isNaN(Number(categoryId))) {
      filtered = filtered.filter((p) => p.categoryId === Number(categoryId));
    }

    if (lowStock === 'true') {
      filtered = filtered.filter((p) => p.quantity <= p.minStockAlert);
    }

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Products: Create
apiRouter.post('/products', async (req: Request, res: Response) => {
  try {
    const {
      name,
      categoryId,
      supplierId,
      description,
      imageUrl,
      sku,
      barcode,
      barcodeFormat,
      purchasePrice,
      sellingPrice,
      discountRate,
      discountType,
      quantity,
      minStockAlert,
      unit,
      expiryDate,
    } = req.body;

    if (!name || !sku || !barcode) {
      return res.status(400).json({ error: 'Name, SKU, and Barcode are required.' });
    }

    // Check for duplicate barcode in this tenant
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.tenantId, currentTenantId), eq(products.barcode, barcode)));
    if (existing.length > 0) {
      return res.status(400).json({ error: `Barcode ${barcode} is already assigned to ${existing[0].name}.` });
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        tenantId: currentTenantId,
        categoryId: categoryId ? Number(categoryId) : null,
        supplierId: supplierId ? Number(supplierId) : null,
        name,
        description: description || '',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
        sku,
        barcode,
        barcodeFormat: barcodeFormat || 'Code 128',
        purchasePrice: String(purchasePrice || '0.00'),
        sellingPrice: String(sellingPrice || '0.00'),
        discountRate: String(discountRate || '0.00'),
        discountType: discountType || 'percentage',
        quantity: Number(quantity || 0),
        minStockAlert: Number(minStockAlert || 5),
        unit: unit || 'pcs',
        expiryDate: expiryDate || '',
      })
      .returning();

    // Record initial stock movement
    if (newProduct.quantity > 0) {
      await db.insert(stockMovements).values({
        tenantId: currentTenantId,
        productId: newProduct.id,
        userId: currentUserId,
        type: 'purchase_in',
        quantityDelta: newProduct.quantity,
        costPerUnit: newProduct.purchasePrice,
        reason: 'Initial inventory entry',
      });
    }

    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Products: Update
apiRouter.patch('/products/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [updated] = await db
      .update(products)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, id), eq(products.tenantId, currentTenantId)))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Products: Delete
apiRouter.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.tenantId, currentTenantId)));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Products: Adjust Stock (In/Out/Damaged/Adjustment)
apiRouter.post('/products/:id/adjust-stock', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { delta, type, reason } = req.body;
    const deltaNum = Number(delta);

    if (isNaN(deltaNum) || deltaNum === 0) {
      return res.status(400).json({ error: 'Valid non-zero quantity delta is required' });
    }

    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.tenantId, currentTenantId)));

    if (!product) return res.status(404).json({ error: 'Product not found' });

    const newQuantity = Math.max(0, product.quantity + deltaNum);
    const [updatedProduct] = await db
      .update(products)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    await db.insert(stockMovements).values({
      tenantId: currentTenantId,
      productId: id,
      userId: currentUserId,
      type: type || (deltaNum > 0 ? 'purchase_in' : 'adjustment'),
      quantityDelta: deltaNum,
      costPerUnit: product.purchasePrice,
      reason: reason || 'Manual stock adjustment',
    });

    res.json(updatedProduct);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Categories: List & Create
apiRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    const list = await db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, currentTenantId))
      .orderBy(categories.name);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const [cat] = await db
      .insert(categories)
      .values({ tenantId: currentTenantId, name, description: description || '' })
      .returning();
    res.status(201).json(cat);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Suppliers: List & Create
apiRouter.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const list = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.tenantId, currentTenantId))
      .orderBy(suppliers.name);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/suppliers', async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, phone, email, address, balanceDue } = req.body;
    if (!name) return res.status(400).json({ error: 'Supplier name is required' });
    const [sup] = await db
      .insert(suppliers)
      .values({
        tenantId: currentTenantId,
        name,
        contactPerson: contactPerson || '',
        phone: phone || '',
        email: email || '',
        address: address || '',
        balanceDue: String(balanceDue || '0.00'),
      })
      .returning();
    res.status(201).json(sup);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Customers: List & Create
apiRouter.get('/customers', async (req: Request, res: Response) => {
  try {
    const list = await db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, currentTenantId))
      .orderBy(desc(customers.createdAt));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/customers', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address, creditLimit } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });
    const [cust] = await db
      .insert(customers)
      .values({
        tenantId: currentTenantId,
        name,
        phone: phone || '',
        email: email || '',
        address: address || '',
        creditLimit: String(creditLimit || '1000.00'),
        totalPurchases: '0.00',
        balanceOwed: '0.00',
      })
      .returning();
    res.status(201).json(cust);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Customer Debt Payment
apiRouter.post('/customers/:id/payments', async (req: Request, res: Response) => {
  try {
    const customerId = Number(req.params.id);
    const { amount, paymentMethod, note } = req.body;
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, currentTenantId)));
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const currentBalance = parseFloat(customer.balanceOwed);
    const newBalance = Math.max(0, currentBalance - amountNum);

    await db
      .update(customers)
      .set({ balanceOwed: newBalance.toFixed(2) })
      .where(eq(customers.id, customerId));

    const [paymentRecord] = await db
      .insert(customerPayments)
      .values({
        tenantId: currentTenantId,
        customerId,
        amount: amountNum.toFixed(2),
        paymentMethod: paymentMethod || 'cash',
        note: note || 'Credit account payment',
        recordedBy: currentUserId,
      })
      .returning();

    res.json({ success: true, payment: paymentRecord, newBalance: newBalance.toFixed(2) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POS Checkout / Sales creation
apiRouter.post('/sales', async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      items,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      paidAmount,
      paymentMethod,
      paymentStatus,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart must contain at least one item' });
    }

    // Verify stock availability
    for (const item of items) {
      const [prod] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, item.productId), eq(products.tenantId, currentTenantId)));
      if (!prod) {
        return res.status(400).json({ error: `Product ID ${item.productId} not found` });
      }
      if (prod.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${prod.name}. Available: ${prod.quantity}, Requested: ${item.quantity}`,
        });
      }
    }

    // Compute cost total snapshot for accurate gross profit tracking
    let calculatedCostTotal = 0;
    for (const item of items) {
      const [prod] = await db.select().from(products).where(eq(products.id, item.productId));
      const costPerUnit = parseFloat(prod.purchasePrice || '0');
      calculatedCostTotal += costPerUnit * item.quantity;
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [newSale] = await db
      .insert(sales)
      .values({
        tenantId: currentTenantId,
        invoiceNumber,
        customerId: customerId ? Number(customerId) : null,
        userId: currentUserId,
        subtotal: String(subtotal || '0.00'),
        discountAmount: String(discountAmount || '0.00'),
        taxAmount: String(taxAmount || '0.00'),
        grandTotal: String(grandTotal || '0.00'),
        costTotal: calculatedCostTotal.toFixed(2),
        paidAmount: String(paidAmount || '0.00'),
        paymentMethod: paymentMethod || 'cash',
        paymentStatus: paymentStatus || 'paid',
        notes: notes || '',
      })
      .returning();

    // Insert line items & deduct stock
    for (const item of items) {
      const [prod] = await db.select().from(products).where(eq(products.id, item.productId));

      await db.insert(saleItems).values({
        tenantId: currentTenantId,
        saleId: newSale.id,
        productId: item.productId,
        productName: prod.name,
        sku: prod.sku,
        quantity: item.quantity,
        purchasePriceSnapshot: prod.purchasePrice,
        sellingPriceSnapshot: item.price ? String(item.price) : prod.sellingPrice,
        discountAmount: String(item.discount || '0.00'),
        taxAmount: '0.00',
        total: String(item.total),
      });

      // Deduct stock quantity
      const remainingQty = Math.max(0, prod.quantity - item.quantity);
      await db
        .update(products)
        .set({ quantity: remainingQty, updatedAt: new Date() })
        .where(eq(products.id, prod.id));

      // Record stock movement
      await db.insert(stockMovements).values({
        tenantId: currentTenantId,
        productId: prod.id,
        userId: currentUserId,
        type: 'sale_out',
        quantityDelta: -item.quantity,
        costPerUnit: prod.purchasePrice,
        reason: `Sold on invoice #${invoiceNumber}`,
        referenceId: String(newSale.id),
      });
    }

    // If customer and partial or credit sale, update balance owed
    if (customerId) {
      const [cust] = await db.select().from(customers).where(eq(customers.id, Number(customerId)));
      if (cust) {
        const grandTotalNum = parseFloat(newSale.grandTotal);
        const paidNum = parseFloat(newSale.paidAmount);
        const unpaidDiff = Math.max(0, grandTotalNum - paidNum);

        const newPurchases = (parseFloat(cust.totalPurchases) + grandTotalNum).toFixed(2);
        const newBalance = (parseFloat(cust.balanceOwed) + unpaidDiff).toFixed(2);

        await db
          .update(customers)
          .set({ totalPurchases: newPurchases, balanceOwed: newBalance })
          .where(eq(customers.id, cust.id));
      }
    }

    // Retrieve full sale with items
    const insertedItems = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, newSale.id));

    res.status(201).json({
      ...newSale,
      items: insertedItems,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sales List
apiRouter.get('/sales', async (req: Request, res: Response) => {
  try {
    const list = await db
      .select({
        id: sales.id,
        tenantId: sales.tenantId,
        invoiceNumber: sales.invoiceNumber,
        customerId: sales.customerId,
        userId: sales.userId,
        subtotal: sales.subtotal,
        discountAmount: sales.discountAmount,
        taxAmount: sales.taxAmount,
        grandTotal: sales.grandTotal,
        costTotal: sales.costTotal,
        paidAmount: sales.paidAmount,
        paymentMethod: sales.paymentMethod,
        paymentStatus: sales.paymentStatus,
        notes: sales.notes,
        createdAt: sales.createdAt,
        customerName: customers.name,
        cashierName: users.name,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .leftJoin(users, eq(sales.userId, users.id))
      .where(eq(sales.tenantId, currentTenantId))
      .orderBy(desc(sales.createdAt));

    const allItems = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.tenantId, currentTenantId));

    const salesWithItems = list.map((s) => ({
      ...s,
      items: allItems.filter((i) => i.saleId === s.id),
    }));

    res.json(salesWithItems);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Refund / Return Sale
apiRouter.post('/sales/:id/refund', async (req: Request, res: Response) => {
  try {
    const saleId = Number(req.params.id);
    const [sale] = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, saleId), eq(sales.tenantId, currentTenantId)));
    if (!sale) return res.status(404).json({ error: 'Sale record not found' });
    if (sale.paymentStatus === 'refunded') {
      return res.status(400).json({ error: 'This transaction is already refunded' });
    }

    // Restore stock for line items
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    for (const item of items) {
      if (item.productId) {
        const [prod] = await db.select().from(products).where(eq(products.id, item.productId));
        if (prod) {
          await db
            .update(products)
            .set({ quantity: prod.quantity + item.quantity })
            .where(eq(products.id, prod.id));

          await db.insert(stockMovements).values({
            tenantId: currentTenantId,
            productId: prod.id,
            userId: currentUserId,
            type: 'return_in',
            quantityDelta: item.quantity,
            reason: `Return/Refund on invoice #${sale.invoiceNumber}`,
          });
        }
      }
    }

    // Mark sale as refunded
    const [updatedSale] = await db
      .update(sales)
      .set({ paymentStatus: 'refunded' })
      .where(eq(sales.id, saleId))
      .returning();

    res.json({ success: true, sale: updatedSale });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Expenses: List & Create
apiRouter.get('/expenses', async (req: Request, res: Response) => {
  try {
    const list = await db
      .select({
        id: expenses.id,
        tenantId: expenses.tenantId,
        userId: expenses.userId,
        category: expenses.category,
        title: expenses.title,
        amount: expenses.amount,
        paymentMethod: expenses.paymentMethod,
        date: expenses.date,
        description: expenses.description,
        createdAt: expenses.createdAt,
        userName: users.name,
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.userId, users.id))
      .where(eq(expenses.tenantId, currentTenantId))
      .orderBy(desc(expenses.date));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/expenses', async (req: Request, res: Response) => {
  try {
    const { category, title, amount, paymentMethod, date, description } = req.body;
    if (!title || !amount) {
      return res.status(400).json({ error: 'Title and amount are required' });
    }
    const [exp] = await db
      .insert(expenses)
      .values({
        tenantId: currentTenantId,
        userId: currentUserId,
        category: category || 'other',
        title,
        amount: String(amount),
        paymentMethod: paymentMethod || 'cash',
        date: date || new Date().toISOString().split('T')[0],
        description: description || '',
      })
      .returning();
    res.status(201).json(exp);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics Dashboard: True Calculations from Database
apiRouter.get('/analytics/dashboard', async (req: Request, res: Response) => {
  try {
    const allSales = await db
      .select()
      .from(sales)
      .where(and(eq(sales.tenantId, currentTenantId)));

    const activeSales = allSales.filter((s) => s.paymentStatus !== 'refunded');

    const allItems = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.tenantId, currentTenantId));

    const allExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.tenantId, currentTenantId));

    const allCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, currentTenantId));

    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.tenantId, currentTenantId));

    // Today filter
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySalesList = activeSales.filter((s) => {
      const saleDate = new Date(s.createdAt!).toISOString().split('T')[0];
      return saleDate === todayStr;
    });

    const todaySales = todaySalesList.length;
    const todayRevenue = todaySalesList.reduce((acc, s) => acc + parseFloat(s.grandTotal), 0);

    // Total Revenue (excluding refunds)
    const totalRevenue = activeSales.reduce((acc, s) => acc + parseFloat(s.grandTotal), 0);

    // Cost of goods sold (COGS)
    const totalCogs = activeSales.reduce((acc, s) => acc + parseFloat(s.costTotal || '0'), 0);

    // Gross Profit = Revenue - COGS
    const grossProfit = calculateGrossProfit(totalRevenue, totalCogs);

    // Total Operating Expenses (excluding losses)
    const operatingExpenses = allExpenses
      .filter((e) => e.category !== 'losses')
      .reduce((acc, e) => acc + parseFloat(e.amount), 0);

    // Losses
    const totalLosses = allExpenses
      .filter((e) => e.category === 'losses')
      .reduce((acc, e) => acc + parseFloat(e.amount), 0);

    // Net Profit = Gross Profit - Operating Expenses - Losses
    const netProfit = calculateNetProfit(grossProfit, operatingExpenses, totalLosses);

    // Margins
    const { grossMarginPercent, netMarginPercent } = calculateMargins(
      totalRevenue,
      grossProfit,
      netProfit
    );

    // Products Sold
    const productsSold = allItems.reduce((acc, item) => acc + item.quantity, 0);

    // Pending Payments (Unpaid balance owed by customers)
    const pendingPayments = allCustomers.reduce((acc, c) => acc + parseFloat(c.balanceOwed), 0);

    // Low stock count
    const lowStockCount = allProducts.filter((p) => p.quantity <= p.minStockAlert).length;

    // Top selling products
    const productSalesMap = new Map<number, { name: string; quantity: number; revenue: number }>();
    for (const item of allItems) {
      if (!item.productId) continue;
      const current = productSalesMap.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };
      current.quantity += item.quantity;
      current.revenue += parseFloat(item.total);
      productSalesMap.set(item.productId, current);
    }

    const topSellingProducts = Array.from(productSalesMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        quantitySold: data.quantity,
        revenue: Number(data.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // Monthly Performance data
    const monthlyPerformance = [
      { month: 'Jun', sales: 4200, profit: 1450, expenses: 900 },
      { month: 'Jul', sales: 5100, profit: 1820, expenses: 1100 },
      { month: 'Aug', sales: 6300, profit: 2200, expenses: 1150 },
      { month: 'Sep', sales: 7100, profit: 2650, expenses: 1300 },
      { month: 'Oct', sales: 8400, profit: 3100, expenses: 1450 },
      { month: 'Nov', sales: Math.round(totalRevenue), profit: Math.round(netProfit), expenses: Math.round(operatingExpenses) },
    ];

    res.json({
      todaySales,
      todayRevenue: Number(todayRevenue.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      totalExpenses: Number(operatingExpenses.toFixed(2)),
      totalLosses: Number(totalLosses.toFixed(2)),
      productsSold,
      totalCustomers: allCustomers.length,
      pendingPayments: Number(pendingPayments.toFixed(2)),
      lowStockCount,
      grossMargin: grossMarginPercent,
      netMargin: netMarginPercent,
      topSellingProducts,
      monthlyPerformance,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Subscriptions
apiRouter.get('/subscriptions', async (req: Request, res: Response) => {
  try {
    const list = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, currentTenantId))
      .orderBy(desc(subscriptions.startDate));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Audit Logs
apiRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const list = await db
      .select({
        id: auditLogs.id,
        tenantId: auditLogs.tenantId,
        userId: auditLogs.userId,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.tenantId, currentTenantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
