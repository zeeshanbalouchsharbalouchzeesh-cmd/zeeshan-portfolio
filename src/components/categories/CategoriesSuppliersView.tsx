import React, { useState, useEffect } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { Category, Supplier } from '../../types/index.ts';
import { formatCurrency } from '../../utils/calculations.ts';
import {
  Layers,
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  X,
  Building,
  CheckCircle2,
} from 'lucide-react';

export const CategoriesSuppliersView: React.FC = () => {
  const { tenant } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState<'categories' | 'suppliers'>('categories');

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Supplier Modal
  const [isSupModalOpen, setIsSupModalOpen] = useState(false);
  const [supForm, setSupForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    balanceDue: '0.00',
  });

  const currency = tenant?.currency || '$';

  const loadData = async () => {
    try {
      const [cats, sups] = await Promise.all([api.getCategories(), api.getSuppliers()]);
      setCategories(cats);
      setSuppliers(sups);
    } catch (err) {
      console.error('Failed to load categories/suppliers:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant?.id]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    try {
      await api.createCategory({ name: catName, description: catDesc });
      setIsCatModalOpen(false);
      setCatName('');
      setCatDesc('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supForm.name) return;
    try {
      await api.createSupplier(supForm);
      setIsSupModalOpen(false);
      setSupForm({ name: '', contactPerson: '', phone: '', email: '', address: '', balanceDue: '0.00' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create supplier');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div>
          <h1 className="text-xl font-extrabold text-white">Categories & Supplier Vendors</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize catalog classifications and manage wholesale supplier accounts and dues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'categories' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'suppliers' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              Suppliers ({suppliers.length})
            </button>
          </div>

          <button
            onClick={() => (activeTab === 'categories' ? setIsCatModalOpen(true) : setIsSupModalOpen(true))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add {activeTab === 'categories' ? 'Category' : 'Supplier'}
          </button>
        </div>
      </div>

      {/* Categories Tab Content */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">{c.name}</h3>
              </div>
              <p className="text-xs text-slate-400">{c.description || 'No description provided.'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Suppliers Tab Content */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="p-5 rounded-xl border border-slate-800 bg-slate-900/90 shadow space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{s.name}</h3>
                  {s.contactPerson && <div className="text-xs text-teal-400 mt-0.5">Contact: {s.contactPerson}</div>}
                </div>
                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                  <Truck className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-400">
                {s.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-slate-500" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-slate-500" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-slate-500" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Balance Due:</span>
                <span className="font-extrabold text-amber-300">{formatCurrency(s.balanceDue, currency)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Add Inventory Category</h3>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Beverages & Juices"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Optional details"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Add Supplier Vendor</h3>
              <button onClick={() => setIsSupModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Supplier / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={supForm.name}
                  onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                  placeholder="e.g. Global Tech Distribution LLC"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Contact Person</label>
                <input
                  type="text"
                  value={supForm.contactPerson}
                  onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })}
                  placeholder="e.g. David Chen"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={supForm.phone}
                  onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  value={supForm.email}
                  onChange={(e) => setSupForm({ ...supForm, email: e.target.value })}
                  placeholder="orders@supplier.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Initial Balance Due ({currency})</label>
                <input
                  type="number"
                  value={supForm.balanceDue}
                  onChange={(e) => setSupForm({ ...supForm, balanceDue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
