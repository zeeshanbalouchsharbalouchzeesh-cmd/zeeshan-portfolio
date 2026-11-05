import React, { useState, useEffect } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { Customer } from '../../types/index.ts';
import { formatCurrency } from '../../utils/calculations.ts';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  CreditCard,
  X,
  CheckCircle2,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { tenant } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: '1000.00',
  });

  // Debt Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNote, setPayNote] = useState('');

  const currency = tenant?.currency || '$';

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [tenant?.id]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      await api.createCustomer(formData);
      setIsAddModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '', creditLimit: '1000.00' });
      await loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !payAmount) return;
    try {
      await api.recordCustomerPayment(activeCustomer.id, {
        amount: payAmount,
        paymentMethod: payMethod,
        note: payNote,
      });
      setIsPayModalOpen(false);
      setPayAmount('');
      setPayNote('');
      await loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to record customer payment');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div>
          <h1 className="text-xl font-extrabold text-white">Customer Profiles & Credit Ledger</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track customer receivables, credit limits, outstanding debts, and settlement histories.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Customer Profile
        </button>
      </div>

      {/* Search */}
      <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/90 shadow">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            No customer accounts found.
          </div>
        ) : (
          filtered.map((c) => {
            const owes = parseFloat(c.balanceOwed || '0');
            const total = parseFloat(c.totalPurchases || '0');
            const limit = parseFloat(c.creditLimit || '1000.00');

            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-md flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{c.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Phone className="h-3 w-3 text-teal-400" />
                        <span>{c.phone || 'No phone'}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span className="truncate max-w-[200px]">{c.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-teal-400 text-xs">
                      {c.name[0]}
                    </div>
                  </div>

                  {c.address && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}

                  {/* Financial Balance Summary */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Purchases:</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(total, currency)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Credit Limit:</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(limit, currency)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800">
                      <span className="font-semibold text-slate-300">Balance Owed:</span>
                      <span className={`font-extrabold ${owes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatCurrency(owes, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  {owes > 0 ? (
                    <button
                      onClick={() => {
                        setActiveCustomer(c);
                        setPayAmount(String(owes));
                        setIsPayModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      Receive Debt Payment
                    </button>
                  ) : (
                    <div className="text-center py-2 text-[11px] font-semibold text-emerald-400/80">
                      ✓ Account in Good Standing (0 Balance)
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Add Customer Account</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alexander Wright"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@email.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, city"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Credit Limit ({currency})</label>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Debt Payment Modal */}
      {isPayModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Receive Customer Debt Payment</h3>
                <p className="text-xs text-slate-400">{activeCustomer.name}</p>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs">
              <span className="text-slate-400">Total Outstanding Balance:</span>
              <span className="font-extrabold text-amber-400">
                {formatCurrency(activeCustomer.balanceOwed, currency)}
              </span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Payment Amount Received ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer / Card</option>
                  <option value="digital">Digital Wallet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Note / Receipt Ref</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Bank wire ref #9921"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
                >
                  Record Payment & Clear Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
