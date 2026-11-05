import React from 'react';
import { useApp } from './ThemeContext.tsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  Receipt,
  TrendingDown,
  FileBarChart2,
  Palette,
  Settings,
  ShieldAlert,
  Layers,
  Crown,
  Sparkles,
} from 'lucide-react';

export type TabKey =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'categories_suppliers'
  | 'customers'
  | 'sales'
  | 'expenses'
  | 'reports'
  | 'theme_studio'
  | 'settings'
  | 'super_admin';

interface SidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { tenant, role } = useApp();

  const navItems: { key: TabKey; label: string; icon: React.ReactNode; badge?: string; roles?: string[] }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'pos', label: 'Point of Sale (POS)', icon: <ShoppingCart className="h-4 w-4" />, badge: 'Quick Scan' },
    { key: 'inventory', label: 'Products & Stock', icon: <Boxes className="h-4 w-4" /> },
    { key: 'categories_suppliers', label: 'Categories & Suppliers', icon: <Layers className="h-4 w-4" /> },
    { key: 'customers', label: 'Customers & Credit', icon: <Users className="h-4 w-4" /> },
    { key: 'sales', label: 'Invoices & Returns', icon: <Receipt className="h-4 w-4" /> },
    { key: 'expenses', label: 'Expenses & Losses', icon: <TrendingDown className="h-4 w-4" /> },
    { key: 'reports', label: 'Financial Reports', icon: <FileBarChart2 className="h-4 w-4" /> },
    { key: 'theme_studio', label: 'Theme Studio', icon: <Palette className="h-4 w-4" /> },
    { key: 'settings', label: 'Shop Settings', icon: <Settings className="h-4 w-4" /> },
    {
      key: 'super_admin',
      label: 'Super Admin',
      icon: <ShieldAlert className="h-4 w-4" />,
      badge: 'Platform',
      roles: ['super_admin', 'owner'],
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/95 flex flex-col justify-between p-3 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Store Operations
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-teal-300 font-semibold border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-teal-400' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-teal-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Subscription Card & Watermark */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="rounded-xl border border-teal-500/20 bg-gradient-to-b from-teal-950/40 to-slate-950 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-teal-300 capitalize">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              {tenant?.subscriptionTier || 'Starter'} Plan
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
              {tenant?.subscriptionStatus || 'Active'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2">
            Multi-tenant isolation & real-time inventory active.
          </p>
        </div>

        <div className="px-2 text-center text-[10px] text-slate-500 space-y-0.5">
          <div className="font-semibold text-slate-400">ShopMaster Enterprise v2.4</div>
          <div>Developed & Designed by <span className="text-teal-400 font-medium">Zeeshan Hyder</span></div>
        </div>
      </div>
    </aside>
  );
};
