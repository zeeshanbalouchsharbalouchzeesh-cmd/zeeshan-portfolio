import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { Product, Customer, CartItem, Sale } from '../../types/index.ts';
import { calculateCartTotals, formatCurrency } from '../../utils/calculations.ts';
import { HardwareScannerListener } from '../../utils/barcode.ts';
import {
  Search,
  Barcode,
  Camera,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Sparkles,
} from 'lucide-react';

interface PosViewProps {
  onSaleComplete: (sale: Sale) => void;
}

export const PosView: React.FC<PosViewProps> = ({ onSaleComplete }) => {
  const { tenant } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Quick Scan Mode & Barcode states
  const [quickScanMode, setQuickScanMode] = useState<boolean>(true);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<string>('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'digital' | 'credit' | 'split'>('cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currency = tenant?.currency || '$';
  const taxRate = parseFloat(tenant?.taxRate || '0.00');

  // Load products, categories, customers
  const loadData = async () => {
    try {
      const [prods, cats, custs] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getCustomers(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCustomers(custs);
    } catch (err) {
      console.error('Error loading POS catalog:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant?.id]);

  // Hardware USB/Bluetooth Barcode Scanner Listener
  useEffect(() => {
    const listener = new HardwareScannerListener((scannedBarcode) => {
      handleBarcodeScanned(scannedBarcode);
    });
    listener.start();
    return () => listener.stop();
  }, [products]);

  const handleBarcodeScanned = (barcode: string) => {
    setLastScannedBarcode(barcode);
    const matched = products.find(
      (p) => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase()
    );

    if (matched) {
      if (matched.quantity <= 0) {
        setScanMessage(`Out of Stock: ${matched.name}`);
        return;
      }
      addToCart(matched);
      setScanMessage(`Scanned & Added: ${matched.name}`);
    } else {
      setScanMessage(`Unrecognized Barcode: ${barcode}`);
    }

    setTimeout(() => setScanMessage(''), 3000);
  };

  // Add to cart
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert(`Cannot add more than available stock (${product.quantity})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.price - item.discount) * (item.quantity + 1),
              }
            : item
        );
      }

      const unitPrice = parseFloat(product.sellingPrice);
      const discount =
        product.discountType === 'percentage'
          ? (unitPrice * parseFloat(product.discountRate || '0')) / 100
          : parseFloat(product.discountRate || '0');

      return [
        ...prev,
        {
          product,
          quantity: 1,
          price: unitPrice,
          discount: Number(discount.toFixed(2)),
          total: Number((unitPrice - discount).toFixed(2)),
        },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.quantity) {
              alert(`Maximum available stock is ${item.product.quantity}`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              total: (item.price - item.discount) * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomerId(null);
  };

  // Cart Calculations
  const calculationItems = cart.map((i) => ({
    price: i.price,
    quantity: i.quantity,
    discountRate: i.discount,
    discountType: 'fixed' as const,
  }));
  const cartTotals = calculateCartTotals(calculationItems, taxRate);

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === null || p.categoryId === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q);
    return matchesCat && matchesSearch;
  });

  // Camera Barcode Scanning Handler
  const openCameraScanner = async () => {
    setIsCameraScannerOpen(true);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setCameraError('Camera access not granted or unavailable. You can enter barcodes manually or use a USB scanner.');
    }
  };

  const closeCameraScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraScannerOpen(false);
  };

  // Handle Checkout submission
  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    setAmountPaidInput(String(cartTotals.grandTotal));
    setIsCheckoutOpen(true);
    setErrorMessage('');
  };

  const handleCompleteSale = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const paidAmountNum = parseFloat(amountPaidInput || '0');
      let status: 'paid' | 'partial' | 'credit' = 'paid';

      if (paidAmountNum >= cartTotals.grandTotal) {
        status = 'paid';
      } else if (paidAmountNum > 0) {
        status = 'partial';
      } else {
        status = 'credit';
      }

      if (status !== 'paid' && !selectedCustomerId) {
        setErrorMessage('A customer profile must be selected for partial or credit sales.');
        setIsSubmitting(false);
        return;
      }

      const salePayload = {
        customerId: selectedCustomerId,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.price,
          discount: i.discount,
          total: i.total,
        })),
        subtotal: cartTotals.subtotal,
        discountAmount: cartTotals.discountTotal,
        taxAmount: cartTotals.taxTotal,
        grandTotal: cartTotals.grandTotal,
        paidAmount: paidAmountNum,
        paymentMethod,
        paymentStatus: status,
        notes: saleNotes,
      };

      const completedSale = await api.createSale(salePayload);

      // Clean cart and close modal
      clearCart();
      setIsCheckoutOpen(false);
      await loadData(); // Refresh product quantities
      onSaleComplete(completedSale);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-6.5rem)]">
      {/* Left: Product Catalog & Search (60%) */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Search & Barcode Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/90 shadow">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU or barcode (or scan directly)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Quick Scanner & Camera Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickScanMode(!quickScanMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                quickScanMode
                  ? 'border-teal-500/40 bg-teal-500/20 text-teal-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}
              title="Continuous Hardware Scanner Mode"
            >
              <Barcode className="h-4 w-4" />
              <span>Quick Scan</span>
              {quickScanMode && <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />}
            </button>

            <button
              onClick={openCameraScanner}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer"
              title="Scan with Mobile/Webcam"
            >
              <Camera className="h-4 w-4 text-teal-400" />
              <span>Camera</span>
            </button>
          </div>
        </div>

        {/* Scan Status Toast if active */}
        {scanMessage && (
          <div className="px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-semibold flex items-center gap-2 shadow">
            <Sparkles className="h-4 w-4 text-teal-400" />
            {scanMessage}
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === null
                ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
              <Barcode className="h-10 w-10 text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-300">No matching products found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Try searching for a different term or scan a valid product barcode.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.quantity <= 0;
                const isLowStock = p.quantity > 0 && p.quantity <= p.minStockAlert;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`group relative flex flex-col justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'border-slate-800 bg-slate-900/40 opacity-60 cursor-not-allowed'
                        : 'border-slate-800 bg-slate-900/80 hover:border-teal-500/50 hover:bg-slate-850 hover:shadow-lg'
                    }`}
                  >
                    <div>
                      {/* Product Image & Stock Badge */}
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-950 mb-2.5">
                        <img
                          src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80'}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span
                          className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-500/90 text-white'
                              : isLowStock
                              ? 'bg-amber-500/90 text-slate-950'
                              : 'bg-slate-900/80 text-teal-300 border border-teal-500/30'
                          }`}
                        >
                          {isOutOfStock ? 'Sold Out' : `${p.quantity} in stock`}
                        </span>
                      </div>

                      {/* Product Details */}
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-2 group-hover:text-teal-300 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.sku}</p>
                    </div>

                    {/* Price & Add Indicator */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-sm font-extrabold text-teal-400">
                          {formatCurrency(p.sellingPrice, currency)}
                        </span>
                        {parseFloat(p.discountRate || '0') > 0 && (
                          <span className="text-[10px] text-emerald-400 ml-1 font-semibold">
                            -{p.discountRate}{p.discountType === 'percentage' ? '%' : ''}
                          </span>
                        )}
                      </div>

                      <div className="h-7 w-7 rounded-lg bg-teal-500/10 group-hover:bg-teal-500 text-teal-400 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Checkout Cart & Bill Panel (40%) */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl p-4 overflow-hidden">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Active Order Cart</h2>
            <p className="text-[11px] text-slate-400">{cart.length} unique items</p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-rose-400 hover:underline cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Customer Assignment */}
        <div className="py-2.5 border-b border-slate-800">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
            <User className="h-3 w-3 text-teal-400" />
            Customer (Required for Credit)
          </label>
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="">Walk-in Guest Checkout</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {parseFloat(c.balanceOwed) > 0 ? `(Owes: ${formatCurrency(c.balanceOwed, currency)})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1">
          {cart.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 p-4">
              <Barcode className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs font-semibold text-slate-400">Cart is empty</p>
              <p className="text-[11px] text-slate-500">Scan product barcode or click items to add.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-2"
              >
                <div className="truncate flex-1">
                  <div className="text-xs font-bold text-slate-200 truncate">{item.product.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {formatCurrency(item.price, currency)} each
                    {item.discount > 0 && <span className="text-emerald-400 ml-1 font-medium">(-{formatCurrency(item.discount, currency)})</span>}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-slate-200">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className="text-right shrink-0 min-w-[60px]">
                  <div className="text-xs font-bold text-teal-400">{formatCurrency(item.total, currency)}</div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-[10px] text-rose-400/80 hover:text-rose-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary Breakdown */}
        <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="text-slate-200 font-semibold">{formatCurrency(cartTotals.subtotal, currency)}</span>
          </div>

          {cartTotals.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discounts Applied:</span>
              <span className="font-semibold">-{formatCurrency(cartTotals.discountTotal, currency)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Tax ({taxRate}%):</span>
            <span className="text-slate-200 font-semibold">{formatCurrency(cartTotals.taxTotal, currency)}</span>
          </div>

          <div className="flex justify-between text-base font-extrabold text-slate-100 pt-2 border-t border-slate-800">
            <span>Total Payable:</span>
            <span className="text-teal-400">{formatCurrency(cartTotals.grandTotal, currency)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleProceedToCheckout}
          disabled={cart.length === 0}
          className={`w-full mt-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
            cart.length === 0
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 shadow-teal-500/25 active:scale-98'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Checkout ({formatCurrency(cartTotals.grandTotal, currency)})
        </button>
      </div>

      {/* Checkout & Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">Complete POS Payment</h3>
                <p className="text-xs text-slate-400">Select payment channel and enter tender amount</p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            {/* Total Display */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Grand Total Due</span>
              <div className="text-3xl font-extrabold text-teal-400 mt-1">
                {formatCurrency(cartTotals.grandTotal, currency)}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'cash', label: 'Cash', icon: <Banknote className="h-4 w-4" /> },
                  { key: 'bank', label: 'Card / Bank', icon: <CreditCard className="h-4 w-4" /> },
                  { key: 'digital', label: 'Digital', icon: <Smartphone className="h-4 w-4" /> },
                  { key: 'credit', label: 'Store Credit', icon: <User className="h-4 w-4" /> },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => {
                      setPaymentMethod(m.key as any);
                      if (m.key === 'credit') {
                        setAmountPaidInput('0');
                      } else if (parseFloat(amountPaidInput || '0') === 0) {
                        setAmountPaidInput(String(cartTotals.grandTotal));
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      paymentMethod === m.key
                        ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.icon}
                    <span className="mt-1 text-[11px]">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tender Amount & Quick Cash buttons */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Amount Received / Paid ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={amountPaidInput}
                onChange={(e) => setAmountPaidInput(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-slate-100 focus:outline-none focus:border-teal-500"
              />

              {/* Fast Cash Denominations for Cashiers */}
              {paymentMethod === 'cash' && (
                <div className="flex gap-2 mt-2">
                  {[
                    { label: 'Exact', val: cartTotals.grandTotal },
                    { label: '+10', val: Math.ceil(cartTotals.grandTotal / 10) * 10 },
                    { label: '+50', val: Math.ceil(cartTotals.grandTotal / 50) * 50 },
                    { label: '+100', val: Math.ceil(cartTotals.grandTotal / 100) * 100 },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      onClick={() => setAmountPaidInput(String(btn.val))}
                      className="flex-1 py-1 rounded-lg border border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-[11px] font-semibold text-slate-300"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Change calculation or Outstanding Credit */}
              <div className="mt-2 text-xs">
                {parseFloat(amountPaidInput || '0') > cartTotals.grandTotal ? (
                  <div className="text-emerald-400 font-bold flex justify-between">
                    <span>Change Due to Customer:</span>
                    <span>{formatCurrency(parseFloat(amountPaidInput) - cartTotals.grandTotal, currency)}</span>
                  </div>
                ) : parseFloat(amountPaidInput || '0') < cartTotals.grandTotal ? (
                  <div className="text-amber-400 font-bold flex justify-between">
                    <span>Remaining Billed to Credit:</span>
                    <span>{formatCurrency(cartTotals.grandTotal - parseFloat(amountPaidInput || '0'), currency)}</span>
                  </div>
                ) : (
                  <div className="text-slate-400 font-medium">Exact amount received.</div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Invoice Remarks (Optional)</label>
              <input
                type="text"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="Customer request, warranty notes, etc."
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Complete & Print Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      {isCameraScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100">Live Camera Barcode Scanner</h3>
              </div>
              <button onClick={closeCameraScanner} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {cameraError}
              </div>
            ) : (
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                <video ref={videoRef} className="h-full w-full object-cover" />
                {/* Aiming Reticle */}
                <div className="absolute inset-8 border-2 border-dashed border-teal-400/80 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-red-500/80 animate-pulse" />
                </div>
              </div>
            )}

            {/* Manual Barcode fallback entry */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400">Manual Barcode Input Fallback</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter barcode digits..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      if (val) {
                        handleBarcodeScanned(val);
                        closeCameraScanner();
                      }
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>
            </div>

            <button
              onClick={closeCameraScanner}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              Close Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
