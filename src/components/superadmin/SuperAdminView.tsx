import React, { useState, useEffect } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { Tenant } from '../../types/index.ts';
import { formatCurrency } from '../../utils/calculations.ts';
import {
  ShieldAlert,
  Building,
  Users,
  CreditCard,
  Plus,
  Crown,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  DollarSign,
} from 'lucide-react';

interface SuperAdminViewProps {
  onOpenNewShopModal: () => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ onOpenNewShopModal }) => {
  const { allTenants, switchTenant } = useApp();
  const [enrichedTenants, setEnrichedTenants] = useState<
    (Tenant & { userCount: number; salesCount: number; totalRevenue: number })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await api.getAllTenants();
        setEnrichedTenants(data);
      } catch (err) {
        console.error('Failed to load super admin data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [allTenants.length]);

  const activeCount = enrichedTenants.filter((t) => t.subscriptionStatus === 'active').length;
  const trialCount = enrichedTenants.filter((t) => t.subscriptionStatus === 'trial').length;
  const expiredCount = enrichedTenants.filter((t) => t.subscriptionStatus === 'expired').length;
  const totalPlatformSaaSRevenue = enrichedTenants.length * 49; // Estimated MRR

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Platform Super Admin Console
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-white">SaaS Multi-Tenant Overseer</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-tenant workspace monitoring, active commercial subscriptions, and merchant fleet control.
          </p>
        </div>

        <button
          onClick={onOpenNewShopModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Provision New Shop Workspace
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 shadow-md">
          <div className="text-xs font-semibold text-slate-400">Total Registered Shops</div>
          <div className="text-2xl font-extrabold text-slate-100 mt-1">{enrichedTenants.length} Workspaces</div>
          <div className="text-[10px] text-slate-500 mt-1">Multi-tenant database isolated</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 shadow-md">
          <div className="text-xs font-semibold text-slate-400">Active Paid Subscriptions</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{activeCount} Subscriptions</div>
          <div className="text-[10px] text-slate-500 mt-1">Paying commercial accounts</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 shadow-md">
          <div className="text-xs font-semibold text-slate-400">14-Day Free Trials</div>
          <div className="text-2xl font-extrabold text-amber-300 mt-1">{trialCount} Trial Accounts</div>
          <div className="text-[10px] text-slate-500 mt-1">Onboarding conversion funnel</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 shadow-md">
          <div className="text-xs font-semibold text-slate-400">Estimated SaaS MRR</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">${totalPlatformSaaSRevenue}.00 /mo</div>
          <div className="text-[10px] text-slate-500 mt-1">Recurring subscription volume</div>
        </div>
      </div>

      {/* Registered Shops Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Registered Commercial Shops</h2>
            <p className="text-xs text-slate-400">Isolated database partitions per tenant</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Shop Name & Type</th>
                <th className="py-3 px-4">Workspace Slug</th>
                <th className="py-3 px-4">Users</th>
                <th className="py-3 px-4">Sales Volume</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {enrichedTenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100">{t.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{t.businessType} store • {t.currency}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-teal-400">
                    /{t.slug}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    {t.userCount} staff members
                  </td>

                  <td className="py-3.5 px-4 text-slate-200 font-semibold">
                    {formatCurrency(t.totalRevenue, t.currency)} ({t.salesCount} orders)
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="capitalize font-semibold text-slate-200">
                      {t.subscriptionTier}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        t.subscriptionStatus === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : t.subscriptionStatus === 'trial'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {t.subscriptionStatus}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => switchTenant(t.id)}
                      className="px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-teal-400 transition cursor-pointer"
                    >
                      Enter Shop →
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
