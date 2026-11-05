import React, { useState, useEffect } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { DashboardStats, Sale, Expense } from '../../types/index.ts';
import { formatCurrency } from '../../utils/calculations.ts';
import {
  FileBarChart2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { tenant } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState<'today' | 'monthly' | 'yearly'>('monthly');

  const currency = tenant?.currency || '$';

  useEffect(() => {
    const load = async () => {
      try {
        const [st, sl, ex] = await Promise.all([
          api.getDashboardStats(),
          api.getSales(),
          api.getExpenses(),
        ]);
        setStats(st);
        setSales(sl);
        setExpenses(ex);
      } catch (err) {
        console.error('Failed to load reports:', err);
      }
    };
    load();
  }, [tenant?.id]);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div>
          <h1 className="text-xl font-extrabold text-white">Financial Statements & Audit Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified Profit & Loss (P&L), Cost of Goods Sold (COGS), operating cash flow and unpaid debt ledger.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {(['today', 'monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${
                  period === p ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Official P&L Statement Card */}
      <div id="printable-receipt-area" className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight">
              {tenant?.name} — Statement of Profit or Loss
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Generated: {new Date().toLocaleDateString()} • Reporting Period: {period.toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Audited Ledger
            </span>
          </div>
        </div>

        {/* Financial Line Items */}
        <div className="space-y-4 font-mono text-xs">
          {/* Revenue */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-bold text-sm text-slate-100 font-sans border-b border-slate-800 pb-1">
              <span>1. Total Gross Revenue (Retail Sales)</span>
              <span className="text-teal-400 font-mono">{formatCurrency(stats.totalRevenue, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-400 pl-4">
              <span>Less: Product Cost of Goods Sold (COGS)</span>
              <span className="text-rose-400">-{formatCurrency(stats.totalRevenue - stats.grossProfit, currency)}</span>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between font-bold text-sm">
            <span className="text-slate-200">GROSS PROFIT (Margin: {stats.grossMargin}%)</span>
            <span className="text-emerald-400">{formatCurrency(stats.grossProfit, currency)}</span>
          </div>

          {/* Operating Expenses */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between font-bold text-sm text-slate-100 font-sans border-b border-slate-800 pb-1">
              <span>2. Operating Overhead & Administrative Expenses</span>
              <span className="text-amber-400 font-mono">-{formatCurrency(stats.totalExpenses, currency)}</span>
            </div>
            {expenses
              .filter((e) => e.category !== 'losses')
              .slice(0, 5)
              .map((e) => (
                <div key={e.id} className="flex justify-between text-slate-400 pl-4">
                  <span>• {e.title} ({e.category})</span>
                  <span>{formatCurrency(e.amount, currency)}</span>
                </div>
              ))}
          </div>

          {/* Losses */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between font-bold text-sm text-slate-100 font-sans border-b border-slate-800 pb-1">
              <span>3. Damaged Stock & Store Losses</span>
              <span className="text-rose-400 font-mono">-{formatCurrency(stats.totalLosses, currency)}</span>
            </div>
          </div>

          {/* Net Operating Profit */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/60 via-slate-950 to-teal-950/60 border border-teal-500/40 flex justify-between items-center text-base font-extrabold font-sans">
            <div>
              <div className="text-slate-100">NET OPERATING PROFIT</div>
              <div className="text-xs text-teal-400 font-mono font-normal">Net Profit Margin: {stats.netMargin}%</div>
            </div>
            <div className={`text-2xl font-mono ${stats.netProfit >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
              {formatCurrency(stats.netProfit, currency)}
            </div>
          </div>
        </div>

        {/* Balance Sheet Highlights */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Customer Pending Receivables</span>
            <div className="text-lg font-bold text-amber-300 mt-1">
              {formatCurrency(stats.pendingPayments, currency)}
            </div>
            <span className="text-[10px] text-slate-500">Unsettled credit sales</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Total Units Dispensed</span>
            <div className="text-lg font-bold text-teal-300 mt-1">
              {stats.productsSold} Units
            </div>
            <span className="text-[10px] text-slate-500">Inventory movement</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Total Active Customers</span>
            <div className="text-lg font-bold text-slate-200 mt-1">
              {stats.totalCustomers} Accounts
            </div>
            <span className="text-[10px] text-slate-500">Registered client base</span>
          </div>
        </div>

        <div className="text-[10px] text-center text-slate-500 pt-3 border-t border-slate-800">
          ShopMaster Business Intelligence System • Developed & Designed by Zeeshan Hyder
        </div>
      </div>
    </div>
  );
};
