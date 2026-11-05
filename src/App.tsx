import React, { useState } from 'react';
import { AppProvider, useApp } from './components/layout/ThemeContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar, TabKey } from './components/layout/Sidebar.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { PosView } from './components/pos/PosView.tsx';
import { InventoryView } from './components/inventory/InventoryView.tsx';
import { CategoriesSuppliersView } from './components/categories/CategoriesSuppliersView.tsx';
import { CustomersView } from './components/customers/CustomersView.tsx';
import { SalesView } from './components/sales/SalesView.tsx';
import { ExpensesView } from './components/expenses/ExpensesView.tsx';
import { ReportsView } from './components/reports/ReportsView.tsx';
import { ThemeStudioView } from './components/theme/ThemeStudioView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { SuperAdminView } from './components/superadmin/SuperAdminView.tsx';
import { ReceiptModal } from './components/receipts/ReceiptModal.tsx';
import { NewShopModal } from './components/layout/NewShopModal.tsx';
import { Sale } from './types/index.ts';
import { RefreshCw } from 'lucide-react';

function ShopMasterContent() {
  const { isLoading, tenant } = useApp();
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [isNewShopModalOpen, setIsNewShopModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-teal-400 to-emerald-400 flex items-center justify-center shadow-xl shadow-teal-500/30 animate-pulse">
            <RefreshCw className="h-6 w-6 text-slate-950 animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-teal-300 to-white bg-clip-text text-transparent">
              ShopMaster SaaS
            </h2>
            <p className="text-xs text-slate-400 mt-1">Connecting multi-tenant database & workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        onOpenNewShopModal={() => setIsNewShopModalOpen(true)}
        onNavigateToPos={() => setCurrentTab('pos')}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/60">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigateToPos={() => setCurrentTab('pos')}
                onNavigateToInventory={() => setCurrentTab('inventory')}
                onViewSale={(sale) => setActiveReceiptSale(sale)}
              />
            )}

            {currentTab === 'pos' && (
              <PosView onSaleComplete={(sale) => setActiveReceiptSale(sale)} />
            )}

            {currentTab === 'inventory' && <InventoryView />}

            {currentTab === 'categories_suppliers' && <CategoriesSuppliersView />}

            {currentTab === 'customers' && <CustomersView />}

            {currentTab === 'sales' && (
              <SalesView onViewSale={(sale) => setActiveReceiptSale(sale)} />
            )}

            {currentTab === 'expenses' && <ExpensesView />}

            {currentTab === 'reports' && <ReportsView />}

            {currentTab === 'theme_studio' && <ThemeStudioView />}

            {currentTab === 'settings' && <SettingsView />}

            {currentTab === 'super_admin' && (
              <SuperAdminView onOpenNewShopModal={() => setIsNewShopModalOpen(true)} />
            )}
          </div>
        </main>
      </div>

      {/* Printable Receipt & Invoice Modal */}
      {activeReceiptSale && (
        <ReceiptModal
          sale={activeReceiptSale}
          onClose={() => setActiveReceiptSale(null)}
        />
      )}

      {/* New Shop Workspace Modal */}
      <NewShopModal
        isOpen={isNewShopModalOpen}
        onClose={() => setIsNewShopModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ShopMasterContent />
    </AppProvider>
  );
}
