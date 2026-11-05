/**
 * Pure calculation functions for ShopMaster SaaS
 * Enforces accurate financial math, margins, POS tax/discount rules, and barcode checks.
 */

export interface CartCalculationItem {
  price: number;
  quantity: number;
  discountRate: number; // in percent or fixed
  discountType: 'percentage' | 'fixed';
}

export interface CartCalculationResult {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
}

/**
 * Calculates line total for an item given price, quantity, discount and tax
 */
export function calculateLineItem(
  price: number,
  quantity: number,
  discountRate: number = 0,
  discountType: 'percentage' | 'fixed' = 'percentage'
): { unitDiscount: number; lineSubtotal: number; lineDiscount: number; lineTotal: number } {
  const safeQty = Math.max(0, quantity);
  const safePrice = Math.max(0, price);
  const lineSubtotal = safePrice * safeQty;

  let unitDiscount = 0;
  if (discountType === 'percentage') {
    const rate = Math.min(100, Math.max(0, discountRate));
    unitDiscount = (safePrice * rate) / 100;
  } else {
    unitDiscount = Math.min(safePrice, Math.max(0, discountRate));
  }

  const lineDiscount = unitDiscount * safeQty;
  const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

  return {
    unitDiscount: Number(unitDiscount.toFixed(2)),
    lineSubtotal: Number(lineSubtotal.toFixed(2)),
    lineDiscount: Number(lineDiscount.toFixed(2)),
    lineTotal: Number(lineTotal.toFixed(2)),
  };
}

/**
 * Calculates cart totals including tax
 */
export function calculateCartTotals(
  items: CartCalculationItem[],
  taxRatePercent: number = 0
): CartCalculationResult {
  let subtotal = 0;
  let discountTotal = 0;

  for (const item of items) {
    const calc = calculateLineItem(
      item.price,
      item.quantity,
      item.discountRate,
      item.discountType
    );
    subtotal += calc.lineSubtotal;
    discountTotal += calc.lineDiscount;
  }

  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const safeTaxRate = Math.max(0, taxRatePercent);
  const taxTotal = Number(((taxableAmount * safeTaxRate) / 100).toFixed(2));
  const grandTotal = Number((taxableAmount + taxTotal).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    taxTotal,
    grandTotal,
  };
}

/**
 * Accurately calculates Gross Profit: Revenue (net of discounts) minus Cost of Goods Sold (COGS)
 */
export function calculateGrossProfit(revenue: number, cogs: number): number {
  return Number((Math.max(0, revenue) - Math.max(0, cogs)).toFixed(2));
}

/**
 * Accurately calculates Net Profit: Gross Profit minus Operating Expenses minus Losses
 */
export function calculateNetProfit(
  grossProfit: number,
  totalExpenses: number,
  totalLosses: number = 0
): number {
  return Number((grossProfit - Math.max(0, totalExpenses) - Math.max(0, totalLosses)).toFixed(2));
}

/**
 * Calculates Gross and Net Margin Percentages
 */
export function calculateMargins(
  revenue: number,
  grossProfit: number,
  netProfit: number
): { grossMarginPercent: number; netMarginPercent: number } {
  if (revenue <= 0) {
    return { grossMarginPercent: 0, netMarginPercent: 0 };
  }
  const grossMarginPercent = Number(((grossProfit / revenue) * 100).toFixed(2));
  const netMarginPercent = Number(((netProfit / revenue) * 100).toFixed(2));
  return { grossMarginPercent, netMarginPercent };
}

/**
 * Formats monetary amounts with currency symbol and decimal formatting
 */
export function formatCurrency(amount: number | string | null | undefined, symbol: string = '$'): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
  if (isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Computes or validates EAN-13 checksum digit
 */
export function calculateEan13CheckDigit(first12Digits: string): number {
  if (first12Digits.length < 12) return 0;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(first12Digits[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}
