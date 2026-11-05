import React, { useState, useEffect } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { BusinessType, ReceiptFormat } from '../../types/index.ts';
import {
  Settings,
  Store,
  DollarSign,
  Percent,
  FileText,
  Save,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { tenant, refreshTenant } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    businessType: 'general' as BusinessType,
    currency: '$',
    taxRate: '0.00',
    address: '',
    phone: '',
    email: '',
    receiptHeader: '',
    receiptFooter: '',
    receiptFormat: 'thermal-80mm' as ReceiptFormat,
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        businessType: tenant.businessType || 'general',
        currency: tenant.currency || '$',
        taxRate: tenant.taxRate || '0.00',
        address: tenant.address || '',
        phone: tenant.phone || '',
        email: tenant.email || '',
        receiptHeader: tenant.receiptHeader || '',
        receiptFooter: tenant.receiptFooter || '',
        receiptFormat: tenant.receiptFormat || 'thermal-80mm',
      });
    }
  }, [tenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    try {
      await api.updateTenant(tenant.id, formData);
      await refreshTenant();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update shop settings');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div className="flex items-center gap-2 text-teal-400 mb-1">
          <Settings className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Workspace Configuration</span>
        </div>
        <h1 className="text-xl font-extrabold text-white">Shop Profile & POS Receipt Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure legal store name, commercial tax percentage, currency symbol, and printable receipt banners.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Details */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Store className="h-4 w-4 text-teal-400" />
            Shop Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Store Legal Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Industry / Business Type</label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="electronics">Electronics & Gadgets</option>
                <option value="mobile">Mobile & Telecommunications</option>
                <option value="grocery">Grocery & Supermarket</option>
                <option value="clothing">Clothing & Apparel</option>
                <option value="cosmetics">Cosmetics & Fragrances</option>
                <option value="pharmacy">Pharmacy & Health</option>
                <option value="general">General Retail Store</option>
                <option value="retail">Other Retail Business</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Currency Symbol or Code</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="$, PKR, EUR, GBP, AED, SAR"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Default Sales Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Store Phone Contact</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Store Support Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Physical Store Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Receipt Header & Footer */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-400" />
            Printable Receipt Banners
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Receipt Top Greeting</label>
              <input
                type="text"
                value={formData.receiptHeader}
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                placeholder="e.g. Thank you for shopping with us!"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Receipt Bottom Footer & Return Policy</label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                placeholder="e.g. Items can be returned within 7 days with original invoice."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between">
          {isSaved ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Shop settings successfully updated!
            </span>
          ) : (
            <span className="text-xs text-slate-500">Updates sync to all checkout terminals.</span>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition cursor-pointer"
          >
            <Save className="h-4 w-4" />
            Save Shop Settings
          </button>
        </div>
      </form>
    </div>
  );
};
