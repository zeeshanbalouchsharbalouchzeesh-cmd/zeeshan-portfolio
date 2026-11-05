import React, { useState } from 'react';
import { useApp } from './ThemeContext.tsx';
import { UserRole } from '../../types/index.ts';
import {
  Store,
  ChevronDown,
  ShieldCheck,
  User as UserIcon,
  Moon,
  Sun,
  PlusCircle,
  Barcode,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenNewShopModal: () => void;
  onNavigateToPos: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewShopModal, onNavigateToPos }) => {
  const { tenant, user, role, allTenants, switchTenant, switchRole, isDarkMode, toggleDarkMode } = useApp();
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roles: { key: UserRole; label: string; badge: string; color: string }[] = [
    { key: 'super_admin', label: 'Super Admin', badge: 'Platform Owner', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    { key: 'owner', label: 'Shop Owner', badge: 'Full Access', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    { key: 'manager', label: 'Manager', badge: 'Inventory & Reports', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { key: 'cashier', label: 'Cashier', badge: 'POS & Sales', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  ];

  const currentRoleObj = roles.find((r) => r.key === role) || roles[1];

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors bg-slate-900/90 border-slate-800 text-slate-100">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Developer identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/25 ring-1 ring-teal-400/30">
              <Store className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-300 via-emerald-200 to-white bg-clip-text text-transparent">
                  ShopMaster
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Developed & Designed by <span className="text-teal-400 font-semibold">Zeeshan Hyder</span>
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-2 hidden md:block" />

          {/* Tenant / Shop Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowShopDropdown(!showShopDropdown);
                setShowRoleDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 transition-all text-xs font-medium text-slate-200"
              title="Switch Workspace Shop"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="max-w-[140px] sm:max-w-[180px] truncate font-semibold text-slate-100">
                {tenant ? tenant.name : 'Loading Shop...'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                {tenant?.businessType || 'retail'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showShopDropdown && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-2 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Switch Active Shop
                </div>
                <div className="space-y-1 my-1">
                  {allTenants.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        switchTenant(t.id);
                        setShowShopDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition text-left ${
                        tenant?.id === t.id
                          ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate">{t.name}</div>
                        <span className="text-[10px] text-slate-400 capitalize">{t.businessType} store</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {t.currency}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowShopDropdown(false);
                      onOpenNewShopModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-teal-400 hover:bg-teal-500/10 transition"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Register New Shop Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls: Quick POS, Role Switcher, Dark Mode, Profile */}
        <div className="flex items-center gap-2.5">
          {/* Quick POS Barcode button */}
          <button
            onClick={onNavigateToPos}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Barcode className="h-4 w-4" />
            <span className="hidden sm:inline">Launch POS</span>
          </button>

          {/* Role Switcher (Owner, Manager, Cashier, Super Admin) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleDropdown(!showRoleDropdown);
                setShowShopDropdown(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${currentRoleObj.color}`}
              title="Test permissions across different user roles"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="font-semibold">{currentRoleObj.label}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-2 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-teal-400" />
                  Role-Based Access
                </div>
                <div className="space-y-1 my-1">
                  {roles.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => {
                        switchRole(r.key);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                        role === r.key
                          ? 'bg-slate-800 text-teal-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div>
                        <div>{r.label}</div>
                        <div className="text-[10px] text-slate-500">{r.badge}</div>
                      </div>
                      {role === r.key && <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Light / Dark Mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-slate-400" />}
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center border border-slate-700 text-slate-200 font-bold text-xs shadow">
              {user?.name ? user.name[0].toUpperCase() : 'Z'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
