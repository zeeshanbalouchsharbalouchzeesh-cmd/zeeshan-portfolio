import React, { useState, useEffect } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { Product, Category, Supplier } from '../../types/index.ts';
import { formatCurrency } from '../../utils/calculations.ts';
import { generateUniqueBarcode, generateBarcodeSvg } from '../../utils/barcode.ts';
import {
  Plus,
  Search,
  Barcode,
  Printer,
  Edit2,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  X,
  Check,
  TrendingUp,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { tenant } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add/Edit Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    supplierId: '',
    description: '',
    imageUrl: '',
    sku: '',
    barcode: '',
    barcodeFormat: 'Code 128' as 'Code 128' | 'EAN-13' | 'UPC-A',
    purchasePrice: '',
    sellingPrice: '',
    discountRate: '0.00',
    discountType: 'percentage' as 'percentage' | 'fixed',
    quantity: '0',
    minStockAlert: '5',
    unit: 'pcs',
  });
  const [modalError, setModalError] = useState('');

  // Stock Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('10');
  const [adjustType, setAdjustType] = useState<'purchase_in' | 'adjustment' | 'damaged_loss'>('purchase_in');
  const [adjustReason, setAdjustReason] = useState('');

  // Barcode Label Print Modal State
  const [isPrintLabelOpen, setIsPrintLabelOpen] = useState(false);
  const [labelProduct, setLabelProduct] = useState<Product | null>(null);
  const [labelCopies, setLabelCopies] = useState(12);

  const currency = tenant?.currency || '$';

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prods, cats, sups] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getSuppliers(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSuppliers(sups);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant?.id]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const generatedBarcode = generateUniqueBarcode('890');
    const generatedSku = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;

    setFormData({
      name: '',
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
      supplierId: suppliers[0]?.id ? String(suppliers[0].id) : '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
      sku: generatedSku,
      barcode: generatedBarcode,
      barcodeFormat: 'Code 128',
      purchasePrice: '',
      sellingPrice: '',
      discountRate: '0.00',
      discountType: 'percentage',
      quantity: '10',
      minStockAlert: '5',
      unit: 'pcs',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      categoryId: p.categoryId ? String(p.categoryId) : '',
      supplierId: p.supplierId ? String(p.supplierId) : '',
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      sku: p.sku,
      barcode: p.barcode,
      barcodeFormat: p.barcodeFormat,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      discountRate: p.discountRate,
      discountType: p.discountType,
      quantity: String(p.quantity),
      minStockAlert: String(p.minStockAlert),
      unit: p.unit,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!formData.name || !formData.sku || !formData.barcode) {
      setModalError('Product Name, SKU and Barcode are required.');
      return;
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: formData.name,
          categoryId: formData.categoryId ? Number(formData.categoryId) : null,
          supplierId: formData.supplierId ? Number(formData.supplierId) : null,
          description: formData.description,
          imageUrl: formData.imageUrl,
          sku: formData.sku,
          barcode: formData.barcode,
          barcodeFormat: formData.barcodeFormat,
          purchasePrice: formData.purchasePrice,
          sellingPrice: formData.sellingPrice,
          discountRate: formData.discountRate,
          discountType: formData.discountType,
          quantity: Number(formData.quantity),
          minStockAlert: Number(formData.minStockAlert),
          unit: formData.unit,
        });
      } else {
        await api.createProduct({
          name: formData.name,
          categoryId: formData.categoryId ? Number(formData.categoryId) : null,
          supplierId: formData.supplierId ? Number(formData.supplierId) : null,
          description: formData.description,
          imageUrl: formData.imageUrl,
          sku: formData.sku,
          barcode: formData.barcode,
          barcodeFormat: formData.barcodeFormat,
          purchasePrice: formData.purchasePrice || '0.00',
          sellingPrice: formData.sellingPrice || '0.00',
          discountRate: formData.discountRate || '0.00',
          discountType: formData.discountType,
          quantity: Number(formData.quantity || 0),
          minStockAlert: Number(formData.minStockAlert || 5),
          unit: formData.unit || 'pcs',
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustingProduct) return;
    const delta = parseInt(adjustDelta, 10);
    if (isNaN(delta) || delta === 0) return;

    try {
      await api.adjustStock(
        adjustingProduct.id,
        adjustType === 'damaged_loss' ? -Math.abs(delta) : delta,
        adjustType,
        adjustReason
      );
      setIsAdjustModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  // Filtered product items
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === null || p.categoryId === selectedCategory;
    const matchesLowStock = !showLowStockOnly || p.quantity <= p.minStockAlert;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q);
    return matchesCat && matchesLowStock && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div>
          <h1 className="text-xl font-extrabold text-white">Product & Stock Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage SKUs, barcodes, cost and retail pricing, supplier links, and stock movements.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/90 shadow">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU or barcode..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory === null ? '' : selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showLowStockOnly
                ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low Stock</span>
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">SKU & Barcode</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Profit / Margin</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No products match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const cost = parseFloat(p.purchasePrice);
                  const sell = parseFloat(p.sellingPrice);
                  const profit = sell - cost;
                  const margin = sell > 0 ? ((profit / sell) * 100).toFixed(1) : '0';
                  const isLow = p.quantity <= p.minStockAlert;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80'}
                            alt={p.name}
                            className="h-10 w-10 rounded-lg object-cover bg-slate-950 shrink-0"
                          />
                          <div className="truncate max-w-[200px]">
                            <div className="font-bold text-slate-200 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{p.unit}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-300 font-semibold">{p.sku}</div>
                        <div className="text-[10px] text-teal-400">{p.barcode} ({p.barcodeFormat})</div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {p.categoryName || 'Unassigned'}
                      </td>

                      <td className="py-3 px-4 text-right text-slate-400">
                        {formatCurrency(p.purchasePrice, currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-100">
                        {formatCurrency(p.sellingPrice, currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                        +{formatCurrency(profit, currency)}
                        <span className="text-[10px] text-slate-400 block font-normal">{margin}% margin</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.quantity <= 0
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          }`}
                        >
                          {p.quantity} {p.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustDelta('10');
                              setAdjustType('purchase_in');
                              setIsAdjustModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-teal-400"
                            title="Adjust Stock Quantity"
                          >
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setLabelProduct(p);
                              setIsPrintLabelOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-teal-400"
                            title="Generate & Print Barcode Labels"
                          >
                            <Barcode className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-rose-400"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                {editingProduct ? 'Edit Product Details' : 'Add New Inventory Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">Unassigned Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">Unassigned Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SKU and Barcode with 1-click generation */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. SNY-WH1000XM5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Barcode *</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, barcode: generateUniqueBarcode('890') })}
                      className="text-[10px] text-teal-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="e.g. 8901234567890"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-teal-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Purchase Cost & Selling Price */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Purchase Price / Unit Cost ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Retail Selling Price ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-teal-300 font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Live Profit & Margin Indicator */}
                <div className="sm:col-span-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Live Margin Preview:</span>
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-400 font-bold">
                      Unit Profit: {formatCurrency(
                        Math.max(0, parseFloat(formData.sellingPrice || '0') - parseFloat(formData.purchasePrice || '0')),
                        currency
                      )}
                    </span>
                    <span className="text-teal-400 font-bold">
                      Margin: {parseFloat(formData.sellingPrice || '0') > 0
                        ? (
                            ((parseFloat(formData.sellingPrice || '0') - parseFloat(formData.purchasePrice || '0')) /
                              parseFloat(formData.sellingPrice || '0')) *
                            100
                          ).toFixed(1)
                        : '0'}%
                    </span>
                  </div>
                </div>

                {/* Stock Quantity, Alert Threshold, Unit */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Current Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs, kg, box, pack"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Image URL</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Adjust Stock Quantity</h3>
                <p className="text-xs text-slate-400">{adjustingProduct.name}</p>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs">
              <span className="text-slate-400">Current On Hand:</span>
              <span className="font-bold text-teal-400">{adjustingProduct.quantity} {adjustingProduct.unit}</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Adjustment Type</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
              >
                <option value="purchase_in">Restock / Purchase In (+)</option>
                <option value="adjustment">Manual Adjustment (+ / -)</option>
                <option value="damaged_loss">Damaged / Store Loss Write-Off (-)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Quantity Delta</label>
              <input
                type="number"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Reason / Reference</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Supplier batch, stock count, display breakage..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Labels Print Preview Modal */}
      {isPrintLabelOpen && labelProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Print Barcode Labels</h3>
                <p className="text-xs text-slate-400">Ready for thermal barcode sticker roll or sheet printer</p>
              </div>
              <button onClick={() => setIsPrintLabelOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-300">Number of Labels to Print:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={labelCopies}
                onChange={(e) => setLabelCopies(parseInt(e.target.value, 10) || 1)}
                className="w-20 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-slate-100"
              />
            </div>

            {/* Printable Preview Area */}
            <div
              id="printable-receipt-area"
              className="p-4 rounded-xl bg-white text-slate-900 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto border border-slate-200"
            >
              {Array.from({ length: labelCopies }).map((_, i) => (
                <div
                  key={i}
                  className="p-2 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-center bg-white"
                >
                  <div className="text-[10px] font-bold text-slate-900 truncate max-w-full">
                    {tenant?.name}
                  </div>
                  <div className="text-[9px] font-medium text-slate-700 truncate max-w-full">
                    {labelProduct.name}
                  </div>
                  <img
                    src={generateBarcodeSvg(labelProduct.barcode, 150, 48, false)}
                    alt={labelProduct.barcode}
                    className="my-1 h-8 max-w-full"
                  />
                  <div className="text-[9px] font-mono font-bold text-slate-800">{labelProduct.barcode}</div>
                  <div className="text-[11px] font-extrabold text-slate-950">
                    {formatCurrency(labelProduct.sellingPrice, currency)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3 no-print">
              <button
                onClick={() => setIsPrintLabelOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print Labels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
