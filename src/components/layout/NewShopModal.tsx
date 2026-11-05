import React, { useState } from 'react';
import { useApp } from './ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { BusinessType, ThemeName } from '../../types/index.ts';
import {
  Store,
  X,
  Sparkles,
  Building,
  DollarSign,
  Percent,
  CheckCircle2,
} from 'lucide-react';

interface NewShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewShopModal: React.FC<NewShopModalProps> = ({ isOpen, onClose }) => {
  const { reloadAll } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    businessType: 'electronics' as BusinessType,
    currency: '$',
    taxRate: '8.00',
    address: '',
    phone: '',
    email: '',
    theme: 'midnight-teal' as ThemeName,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Store name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await api.createTenant(formData);
      await reloadAll();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register shop workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const businessTypes: { key: BusinessType; label: string; desc: string }[] = [
    { key: 'grocery', label: 'Grocery Store / Supermarket', desc: 'Perishables, FMCG, weight units' },
    { key: 'clothing', label: 'Clothing & Apparel', desc: 'Fashion, sizes, boutique layout' },
    { key: 'mobile', label: 'Mobile & Accessories', desc: 'IMEI, gadgets, fast accessories' },
    { key: 'electronics', label: 'Electronics & Computers', desc: 'High-value warranties, serials' },
    { key: 'cosmetics', label: 'Cosmetics & Beauty', desc: 'Fragrances, skincare, royal theme' },
    { key: 'pharmacy', label: 'Pharmacy & Drugstore', desc: 'Batch numbers, clean daylight theme' },
    { key: 'general', label: 'General Retail Store', desc: 'Convenience, all-purpose inventory' },
    { key: 'retail', label: 'Other Commercial Retail', desc: 'Specialty merchant operations' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950">
              <Store className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Create New Shop Workspace</h3>
              <p className="text-xs text-slate-400">Multi-tenant isolated retail store</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Store / Business Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Metro Supermarket & Grocers"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Business Category Type</label>
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
            >
              {businessTypes.map((bt) => (
                <option key={bt.key} value={bt.key}>
                  {bt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="$, PKR, EUR, GBP, AED"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Default Tax (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Theme Palette</label>
            <select
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="midnight-teal">Midnight Teal (Default)</option>
              <option value="royal-purple">Royal Purple (Luxury / Cosmetics)</option>
              <option value="emerald-green">Emerald Green (Fresh Grocers)</option>
              <option value="midnight-black">Midnight Black (Electronics / Tech)</option>
              <option value="pure-white">Pure White (Pharmacy / Health)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Store Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Store Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="store@domain.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-teal-400" />
            <span>Includes 14-day full Starter trial with isolated database records.</span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition cursor-pointer"
            >
              {isSubmitting ? 'Creating Workspace...' : 'Launch Store Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
