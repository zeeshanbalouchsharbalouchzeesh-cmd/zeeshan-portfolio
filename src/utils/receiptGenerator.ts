import { Sale, Tenant, Customer, User } from '../types/index.ts';
import { formatCurrency } from './calculations.ts';
import { generateBarcodeSvg } from './barcode.ts';

export interface ReceiptData {
  sale: Sale;
  tenant: Tenant;
  customer?: Customer | null;
  cashier?: User | null;
}

/**
 * Generates formatted text suitable for sharing via WhatsApp
 */
export function buildWhatsAppShareUrl(data: ReceiptData): string {
  const { sale, tenant, customer } = data;
  const itemsText = (sale.items || [])
    .map(
      (item) =>
        `• ${item.productName} x${item.quantity} = ${formatCurrency(item.total, tenant.currency)}`
    )
    .join('\n');

  const text = `🧾 *${tenant.name}*
Invoice #${sale.invoiceNumber}
Date: ${new Date(sale.createdAt).toLocaleDateString()} ${new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
${customer ? `Customer: ${customer.name}\n` : ''}--------------------------------
${itemsText}
--------------------------------
Subtotal: ${formatCurrency(sale.subtotal, tenant.currency)}
${parseFloat(sale.discountAmount) > 0 ? `Discount: -${formatCurrency(sale.discountAmount, tenant.currency)}\n` : ''}Tax: ${formatCurrency(sale.taxAmount, tenant.currency)}
*Grand Total: ${formatCurrency(sale.grandTotal, tenant.currency)}*
Paid: ${formatCurrency(sale.paidAmount, tenant.currency)}
${parseFloat(sale.grandTotal) - parseFloat(sale.paidAmount) > 0 ? `*Balance Due: ${formatCurrency(parseFloat(sale.grandTotal) - parseFloat(sale.paidAmount), tenant.currency)}*\n` : ''}
${tenant.receiptFooter || 'Thank you for shopping with us!'}
Developed & Designed by Zeeshan Hyder`;

  const phone = customer?.phone?.replace(/[^0-9]/g, '') || '';
  const baseUrl = phone ? `https://wa.me/${phone}` : `https://wa.me/`;
  return `${baseUrl}?text=${encodeURIComponent(text)}`;
}

/**
 * Triggers standard browser print command cleanly
 */
export function triggerPrint() {
  window.print();
}
