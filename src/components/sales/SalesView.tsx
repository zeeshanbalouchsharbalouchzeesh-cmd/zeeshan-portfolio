import React, { useState, useEffect } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { Sale } from '../../types/index.ts';
import { formatCurrency } from '../../utils/calculations.ts';
import {
  Search,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Clock,
  Printer,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface SalesViewProps {
  onViewSale: (sale: Sale) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onViewSale }) => {
  const { tenant } = useApp();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const currency = tenant?.currency || '$';

  const loadSales = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSales();
      setSales(data);
    } catch (err) {
      console.error('Failed to load sales history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [tenant?.id]);

  const handleRefund = async (sale: Sale) => {
    if (sale.paymentStatus === 'refunded') return;
    if (confirm(`Process full refund for invoice #${sale.invoiceNumber}? This will restore stock automatically.`)) {
      try {
        await api.refundSale(sale.id);
        await loadSales();
      } catch (err: any) {
        alert(err.message || 'Refund failed');
      }
    }
  };

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      s.invoiceNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || s.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div>
          <h1 className="text-xl font-extrabold text-white">Invoices & Sales Transactions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of completed orders, digital thermal receipts, customer credits, and returns.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/90 shadow">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or customer name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'paid', 'partial', 'credit', 'refunded'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                statusFilter === status
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Sales List Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No sales invoices found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-300">
                      {s.invoiceNumber}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4 text-slate-200 font-medium">
                      {s.customerName || 'Walk-in Guest'}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {(s.items || []).length} items
                    </td>

                    <td className="py-3 px-4 uppercase text-[10px] font-semibold text-slate-400">
                      {s.paymentMethod}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          s.paymentStatus === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : s.paymentStatus === 'partial'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : s.paymentStatus === 'credit'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {s.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-extrabold text-slate-100">
                      {formatCurrency(s.grandTotal, currency)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewSale(s)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-[11px] font-semibold text-teal-300 transition cursor-pointer"
                        >
                          <Printer className="h-3 w-3" />
                          Receipt
                        </button>

                        {s.paymentStatus !== 'refunded' && (
                          <button
                            onClick={() => handleRefund(s)}
                            className="p-1 rounded-lg border border-slate-700 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                            title="Process Return & Stock Refund"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
