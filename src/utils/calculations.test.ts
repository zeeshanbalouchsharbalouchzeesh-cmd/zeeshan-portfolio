import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLineItem,
  calculateCartTotals,
  calculateGrossProfit,
  calculateNetProfit,
  calculateMargins,
  formatCurrency,
  calculateEan13CheckDigit,
} from './calculations.ts';

test('calculateLineItem percentage discount', () => {
  const result = calculateLineItem(100, 2, 10, 'percentage');
  assert.equal(result.lineSubtotal, 200);
  assert.equal(result.unitDiscount, 10);
  assert.equal(result.lineDiscount, 20);
  assert.equal(result.lineTotal, 180);
});

test('calculateLineItem fixed discount', () => {
  const result = calculateLineItem(50, 3, 5, 'fixed');
  assert.equal(result.lineSubtotal, 150);
  assert.equal(result.unitDiscount, 5);
  assert.equal(result.lineDiscount, 15);
  assert.equal(result.lineTotal, 135);
});

test('calculateCartTotals with tax', () => {
  const items = [
    { price: 100, quantity: 2, discountRate: 10, discountType: 'percentage' as const }, // 180
    { price: 50, quantity: 1, discountRate: 0, discountType: 'fixed' as const }, // 50
  ];
  // taxable subtotal = 180 + 50 = 230
  // tax @ 10% = 23
  // grand total = 253
  const cart = calculateCartTotals(items, 10);
  assert.equal(cart.subtotal, 250);
  assert.equal(cart.discountTotal, 20);
  assert.equal(cart.taxTotal, 23);
  assert.equal(cart.grandTotal, 253);
});

test('calculateGrossProfit accurately computes revenue minus cogs', () => {
  const revenue = 10000;
  const cogs = 6500;
  const grossProfit = calculateGrossProfit(revenue, cogs);
  assert.equal(grossProfit, 3500);
});

test('calculateNetProfit deducts operating expenses and losses', () => {
  const grossProfit = 3500;
  const expenses = 1200; // Rent, salaries, electricity
  const losses = 300; // Damaged stock
  const netProfit = calculateNetProfit(grossProfit, expenses, losses);
  assert.equal(netProfit, 2000);
});

test('calculateMargins gives correct gross and net percentages', () => {
  const margins = calculateMargins(10000, 3500, 2000);
  assert.equal(margins.grossMarginPercent, 35);
  assert.equal(margins.netMarginPercent, 20);
});

test('formatCurrency formats accurately with custom symbols', () => {
  assert.equal(formatCurrency(1250.5, '$'), '$1,250.50');
  assert.equal(formatCurrency(500, 'PKR '), 'PKR 500.00');
  assert.equal(formatCurrency(0, '€'), '€0.00');
});

test('calculateEan13CheckDigit computes valid checksum', () => {
  // Test with standard EAN-13 example: 590123412345 -> check digit 7
  const checkDigit = calculateEan13CheckDigit('590123412345');
  assert.equal(checkDigit, 7);
});
