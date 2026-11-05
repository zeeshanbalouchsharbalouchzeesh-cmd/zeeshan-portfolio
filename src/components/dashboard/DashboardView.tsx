import React, { useState, useEffect } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { DashboardStats, Sale } from '../../types/index.ts';
import { formatCurrency } from '../../utils/calculations.ts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Clock,
  Sparkles,
  RefreshCw,
  Percent,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToPos: () => void;
  onNavigateToInventory: () => void;
  onViewSale: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToPos,
  onNavigateToInventory,
  onViewSale,
}) => {
  const { tenant } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [analyticsData, salesData] = await Promise.all([
        api.getDashboardStats(),
        api.getSales(),
      ]);
      setStats(analyticsData);
      setRecentSales(salesData.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant?.id]);

  if (isLoading || !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-400" />
          <p className="text-sm font-medium text-slate-400">Loading shop intelligence...</p>
        </div>
      </div>
    );
  }

  const currency = tenant?.currency || '$';

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick POS Launch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/20 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Live Operations
            </span>
            <span className="text-xs text-slate-400">
              Store: <span className="text-slate-200 font-semibold">{tenant?.name}</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Business Intelligence & Financial Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time gross and net margins calculated directly from inventory cost snapshots and verified expenses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer"
            title="Refresh dashboard numbers"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={onNavigateToPos}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4 stroke-[2.5]" />
            New POS Sale
          </button>
        </div>
      </div>

      {/* Row 1: Core Financials (Revenue, Gross Profit, Net Profit, Expenses) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-100 mt-2">
            {formatCurrency(stats.totalRevenue, currency)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Today's Sales:</span>
            <span className="font-bold text-teal-400">{formatCurrency(stats.todayRevenue, currency)} ({stats.todaySales} orders)</span>
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Gross Profit (COGS Deducted)</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            {formatCurrency(stats.grossProfit, currency)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Gross Margin:</span>
            <span className="font-bold text-emerald-400">{stats.grossMargin}%</span>
          </div>
        </div>

        {/* Net Profit & Margin */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Net Profit (Operating Net)</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold mt-2 ${stats.netProfit >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
            {formatCurrency(stats.netProfit, currency)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Net Margin:</span>
            <span className="font-bold text-cyan-300">{stats.netMargin}%</span>
          </div>
        </div>

        {/* Operating Expenses & Losses */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Operating Expenses</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-300 mt-2">
            {formatCurrency(stats.totalExpenses, currency)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Store Losses:</span>
            <span className="font-bold text-rose-400">{formatCurrency(stats.totalLosses, currency)}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Indicators (Units Sold, Customers, Pending Receivables, Low Stock Alert) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products Sold */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Total Products Sold</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{stats.productsSold} units</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400">
            <Package className="h-5 w-5" />
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Customer Accounts</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{stats.totalCustomers} profiles</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Pending Receivables (Credit Balance) */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Pending Credit Receivables</div>
            <div className="text-xl font-bold text-amber-300 mt-1">
              {formatCurrency(stats.pendingPayments, currency)}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={onNavigateToInventory}
          className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
            stats.lowStockCount > 0
              ? 'border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20'
              : 'border-slate-800 bg-slate-900/60'
          }`}
        >
          <div>
            <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className={`h-3.5 w-3.5 ${stats.lowStockCount > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
              Low Stock Alerts
            </div>
            <div className={`text-xl font-bold mt-1 ${stats.lowStockCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
              {stats.lowStockCount} items need reorder
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      {/* Row 3: Monthly Performance Chart & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trends Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Monthly Revenue & Profit Growth</h2>
              <p className="text-xs text-slate-400">Historical performance trends vs operating costs</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-teal-400 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Revenue
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Profit
              </span>
              <span className="flex items-center gap-1 text-slate-400 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" /> Expenses
              </span>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
            {stats.monthlyPerformance.map((item, idx) => {
              const maxVal = Math.max(...stats.monthlyPerformance.map((p) => p.sales), 10000);
              const salesHeight = Math.min(100, Math.round((item.sales / maxVal) * 100));
              const profitHeight = Math.min(100, Math.round((item.profit / maxVal) * 100));
              const expHeight = Math.min(100, Math.round((item.expenses / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-48">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${salesHeight}%` }}
                      className="w-3 rounded-t bg-gradient-to-t from-teal-600 to-teal-400 group-hover:brightness-125 transition-all"
                      title={`${item.month} Revenue: ${formatCurrency(item.sales, currency)}`}
                    />
                    {/* Profit Bar */}
                    <div
                      style={{ height: `${profitHeight}%` }}
                      className="w-3 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:brightness-125 transition-all"
                      title={`${item.month} Profit: ${formatCurrency(item.profit, currency)}`}
                    />
                    {/* Expenses Bar */}
                    <div
                      style={{ height: `${expHeight}%` }}
                      className="w-3 rounded-t bg-slate-700 group-hover:bg-slate-600 transition-all"
                      title={`${item.month} Expenses: ${formatCurrency(item.expenses, currency)}`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Top-Selling Products</h2>
            <p className="text-xs text-slate-400 mb-4">Ranked by volume and revenue contribution</p>

            <div className="space-y-3">
              {stats.topSellingProducts.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">No sales recorded yet.</div>
              ) : (
                stats.topSellingProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-teal-400">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-100">{formatCurrency(p.revenue, currency)}</div>
                      <div className="text-[10px] text-slate-400">{p.quantitySold} units</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={onNavigateToInventory}
            className="w-full mt-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800/80 text-xs font-semibold text-teal-400 transition text-center cursor-pointer"
          >
            Manage Complete Inventory →
          </button>
        </div>
      </div>

      {/* Row 4: Recent Transactions Table */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Recent POS Invoices</h2>
            <p className="text-xs text-slate-400">Latest completed sales transactions</p>
          </div>
          <button
            onClick={onNavigateToPos}
            className="text-xs font-semibold text-teal-400 hover:underline cursor-pointer"
          >
            Launch POS Cashier →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-semibold text-teal-300">{sale.invoiceNumber}</td>
                  <td className="py-3 px-3 text-slate-300">{sale.customerName || 'Walk-in Customer'}</td>
                  <td className="py-3 px-3 text-slate-400 uppercase text-[10px] font-semibold">{sale.paymentMethod}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        sale.paymentStatus === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : sale.paymentStatus === 'partial'
                          ? 'bg-amber-500/20 text-amber-300'
                          : sale.paymentStatus === 'credit'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-100">
                    {formatCurrency(sale.grandTotal, currency)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onViewSale(sale)}
                      className="px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-700/60 text-[11px] font-semibold text-slate-300 transition cursor-pointer"
                    >
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
