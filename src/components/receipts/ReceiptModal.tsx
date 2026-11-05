import React, { useState } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { Sale, ReceiptFormat } from '../../types/index.ts';
import { formatCurrency } from '../../utils/calculations.ts';
import { generateBarcodeSvg } from '../../utils/barcode.ts';
import { buildWhatsAppShareUrl } from '../../utils/receiptGenerator.ts';
import {
  Printer,
  Share2,
  X,
  FileText,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { tenant } = useApp();
  const [format, setFormat] = useState<ReceiptFormat>(tenant?.receiptFormat || 'thermal-80mm');

  const currency = tenant?.currency || '$';
  const subtotal = parseFloat(sale.subtotal);
  const discount = parseFloat(sale.discountAmount);
  const tax = parseFloat(sale.taxAmount);
  const grandTotal = parseFloat(sale.grandTotal);
  const paid = parseFloat(sale.paidAmount);
  const balanceDue = Math.max(0, grandTotal - paid);
  const change = Math.max(0, paid - grandTotal);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!tenant) return;
    const url = buildWhatsAppShareUrl({
      sale,
      tenant,
      customer: sale.customerName ? { name: sale.customerName } as any : null,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4 my-8">
        {/* Top Controls: Format Switcher & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 no-print">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFormat('thermal-58mm')}
              className={`px-2.5 py-1 rounded-lg transition ${
                format === 'thermal-58mm' ? 'bg-teal-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              58mm Thermal
            </button>
            <button
              onClick={() => setFormat('thermal-80mm')}
              className={`px-2.5 py-1 rounded-lg transition ${
                format === 'thermal-80mm' ? 'bg-teal-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              80mm Thermal
            </button>
            <button
              onClick={() => setFormat('a4')}
              className={`px-2.5 py-1 rounded-lg transition ${
                format === 'a4' ? 'bg-teal-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              A4 Invoice
            </button>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div
          id="printable-receipt-area"
          className={`mx-auto bg-white text-slate-950 font-mono shadow-xl p-5 border border-slate-300 rounded-lg transition-all ${
            format === 'thermal-58mm'
              ? 'max-w-[280px] text-[10px]'
              : format === 'thermal-80mm'
              ? 'max-w-[360px] text-xs'
              : 'max-w-[500px] text-xs font-sans'
          }`}
        >
          {/* Header & Logo */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-0.5">
            <div className="text-sm font-extrabold tracking-tight uppercase text-slate-950">
              {tenant?.name}
            </div>
            {tenant?.address && <div className="text-[10px] text-slate-600">{tenant.address}</div>}
            {tenant?.phone && <div className="text-[10px] text-slate-600">Tel: {tenant.phone}</div>}
            {tenant?.receiptHeader && (
              <div className="text-[10px] italic text-slate-500 pt-1">{tenant.receiptHeader}</div>
            )}
          </div>

          {/* Invoice Meta */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Invoice:</span>
              <span className="font-bold text-slate-950">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Date:</span>
              <span>{new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Customer:</span>
              <span className="font-semibold">{sale.customerName || 'Walk-in Guest'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Cashier:</span>
              <span>{sale.cashierName || 'Staff'}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(sale.items || []).map((item, idx) => (
                  <tr key={idx} className="py-1.5">
                    <td className="py-1 pr-1">
                      <div className="font-bold text-slate-900 truncate max-w-[150px]">{item.productName}</div>
                      {parseFloat(item.discountAmount) > 0 && (
                        <div className="text-[9px] text-emerald-700">Disc: -{formatCurrency(item.discountAmount, currency)}</div>
                      )}
                    </td>
                    <td className="py-1 text-center font-medium">{item.quantity}</td>
                    <td className="py-1 text-right text-slate-600">{formatCurrency(item.sellingPriceSnapshot, currency)}</td>
                    <td className="py-1 text-right font-bold text-slate-950">{formatCurrency(item.total, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Math */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-right">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>Discount:</span>
                <span>-{formatCurrency(discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax ({tenant?.taxRate || 0}%):</span>
              <span>{formatCurrency(tax, currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-950 pt-1 border-t border-slate-200">
              <span>Grand Total:</span>
              <span>{formatCurrency(grandTotal, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-700 pt-1">
              <span>Paid ({sale.paymentMethod.toUpperCase()}):</span>
              <span className="font-bold">{formatCurrency(paid, currency)}</span>
            </div>
            {change > 0 && (
              <div className="flex justify-between text-slate-600 font-bold">
                <span>Change Returned:</span>
                <span>{formatCurrency(change, currency)}</span>
              </div>
            )}
            {balanceDue > 0 && (
              <div className="flex justify-between text-red-700 font-bold">
                <span>Remaining Balance Due:</span>
                <span>{formatCurrency(balanceDue, currency)}</span>
              </div>
            )}
          </div>

          {/* Footer, Barcode & Return Policy */}
          <div className="pt-3 text-center space-y-2">
            <div className="flex justify-center">
              <img
                src={generateBarcodeSvg(sale.invoiceNumber, 200, 48, false)}
                alt={sale.invoiceNumber}
                className="h-9 max-w-full"
              />
            </div>
            <div className="text-[10px] font-mono tracking-wider text-slate-600">{sale.invoiceNumber}</div>
            <div className="text-[9px] text-slate-500 max-w-[260px] mx-auto italic">
              {tenant?.receiptFooter || 'Items can be exchanged within 7 days with original receipt.'}
            </div>
            <div className="text-[8px] text-slate-400 font-sans pt-1">
              ShopMaster POS • Developed & Designed by Zeeshan Hyder
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between no-print">
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            Share WhatsApp
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
