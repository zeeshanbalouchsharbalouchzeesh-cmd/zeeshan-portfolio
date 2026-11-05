import React, { useState, useEffect } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { Expense } from '../../types/index.ts';
import { formatCurrency } from '../../utils/calculations.ts';
import {
  TrendingDown,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  X,
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { tenant } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'rent' as const,
    title: '',
    amount: '',
    paymentMethod: 'cash' as const,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const currency = tenant?.currency || '$';

  const loadExpenses = async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [tenant?.id]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;
    try {
      await api.createExpense(formData);
      setIsModalOpen(false);
      setFormData({
        category: 'rent',
        title: '',
        amount: '',
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      await loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    }
  };

  const categoriesList = [
    { key: 'all', label: 'All Categories' },
    { key: 'rent', label: 'Rent' },
    { key: 'electricity', label: 'Electricity & Utilities' },
    { key: 'salaries', label: 'Staff Salaries' },
    { key: 'transport', label: 'Transport & Freight' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'losses', label: 'Losses & Damages' },
    { key: 'other', label: 'Other' },
  ];

  const filtered = expenses.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch = !search || e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q));
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenseAmount = filtered
    .filter((e) => e.category !== 'losses')
    .reduce((acc, e) => acc + parseFloat(e.amount), 0);
  const totalLossesAmount = filtered
    .filter((e) => e.category === 'losses')
    .reduce((acc, e) => acc + parseFloat(e.amount), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div>
          <h1 className="text-xl font-extrabold text-white">Operational Expenses & Loss Tracking</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log overhead expenditures, store maintenance, payroll, and stock damage write-offs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Record New Expense / Loss
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Total Operating Expenses</div>
            <div className="text-2xl font-extrabold text-amber-300 mt-1">
              {formatCurrency(totalExpenseAmount, currency)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Rent, salaries, power & logistics</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Damaged Goods & Store Losses</div>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">
              {formatCurrency(totalLossesAmount, currency)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Display breakages & write-offs</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/90 shadow">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses by title or description..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
        >
          {categoriesList.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono">{e.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">{e.title}</div>
                      {e.description && <div className="text-[10px] text-slate-500">{e.description}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          e.category === 'losses'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-semibold text-slate-400">
                      {e.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{e.userName || 'Staff'}</td>
                    <td className={`py-3 px-4 text-right font-bold ${e.category === 'losses' ? 'text-rose-400' : 'text-amber-300'}`}>
                      {formatCurrency(e.amount, currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Record Expense / Loss</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Monthly Showroom Rent"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="rent">Rent</option>
                  <option value="electricity">Electricity & Utilities</option>
                  <option value="salaries">Staff Salaries</option>
                  <option value="transport">Transport & Freight</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="marketing">Marketing</option>
                  <option value="losses">Damaged Goods / Store Loss</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Amount ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Wire / Card</option>
                  <option value="digital">Digital Wallet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Memo</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Receipt number, invoice details, etc."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
