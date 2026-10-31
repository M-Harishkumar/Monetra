import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLeapYear,
  getDaysInMonth,
  calculateNextBillingDate,
  calculateInvoiceTotals,
  calculateProration
} from '../src/utils/billing-math.ts';

test('isLeapYear correctly handles standard and leap years', () => {
  assert.equal(isLeapYear(2024), true, '2024 is a leap year');
  assert.equal(isLeapYear(2025), false, '2025 is not a leap year');
  assert.equal(isLeapYear(2000), true, '2000 is a century leap year');
  assert.equal(isLeapYear(1900), false, '1900 is not a leap year');
});

test('getDaysInMonth returns accurate days count', () => {
  assert.equal(getDaysInMonth(2024, 1), 29, 'Feb 2024 has 29 days');
  assert.equal(getDaysInMonth(2025, 1), 28, 'Feb 2025 has 28 days');
  assert.equal(getDaysInMonth(2025, 0), 31, 'Jan has 31 days');
  assert.equal(getDaysInMonth(2025, 3), 30, 'April has 30 days');
});

test('calculateNextBillingDate handles daily, weekly, monthly and leap year edge cases', () => {
  // Daily
  const day1 = calculateNextBillingDate('2025-01-10T00:00:00Z', 'daily');
  assert.equal(day1.getUTCDate(), 11);

  // Weekly
  const week1 = calculateNextBillingDate('2025-01-10T00:00:00Z', 'weekly');
  assert.equal(week1.getUTCDate(), 17);

  // Monthly: Jan 31 -> Feb 28 in non-leap year (2025)
  const monthEndFeb = calculateNextBillingDate('2025-01-31T00:00:00Z', 'monthly', 31);
  assert.equal(monthEndFeb.getUTCMonth(), 1); // Feb
  assert.equal(monthEndFeb.getUTCDate(), 28); // Feb 28

  // Monthly: Jan 31 -> Feb 29 in leap year (2024)
  const monthEndLeap = calculateNextBillingDate('2024-01-31T00:00:00Z', 'monthly', 31);
  assert.equal(monthEndLeap.getUTCMonth(), 1); // Feb
  assert.equal(monthEndLeap.getUTCDate(), 29); // Feb 29

  // Yearly: 2024-02-29 -> 2025-02-28
  const yearFromLeap = calculateNextBillingDate('2024-02-29T00:00:00Z', 'yearly', 29);
  assert.equal(yearFromLeap.getUTCFullYear(), 2025);
  assert.equal(yearFromLeap.getUTCMonth(), 1);
  assert.equal(yearFromLeap.getUTCDate(), 28);
});

test('calculateInvoiceTotals calculates exact decimal subtotals, discounts and taxes', () => {
  const items = [
    { quantity: 2, unitPrice: 1000, variantPrice: 560 }, // 2 * 1560 = 3120
    { quantity: 1, unitPrice: 200 },                     // 1 * 200 = 200
  ];
  // Subtotal = 3320

  // 10% discount -> 332, taxable = 2988
  const discount = { type: 'percentage' as const, value: 10 };
  // GST 18% -> 2988 * 0.18 = 537.84, total = 3525.84
  const taxes = [{ name: 'GST', percentage: 18 }];

  const res = calculateInvoiceTotals(items, discount, taxes);
  assert.equal(res.subtotal, 3320);
  assert.equal(res.discountAmount, 332);
  assert.equal(res.taxableAmount, 2988);
  assert.equal(res.taxAmount, 537.84);
  assert.equal(res.total, 3525.84);
});

test('calculateProration produces exact credits and charges for mid-cycle change', () => {
  const proration = calculateProration({
    currentRecurringAmount: 3000,
    newRecurringAmount: 6000,
    cycleStartDate: '2025-06-01T00:00:00Z',
    cycleEndDate: '2025-06-30T00:00:00Z',
    effectiveDate: '2025-06-16T00:00:00Z', // 15 days used, 14 days remaining out of 29 days total
  });

  assert(proration.daysTotal > 0);
  assert(proration.chargeForRemainingNew >= proration.creditForUnusedCurrent);
  assert.equal(
    proration.netProratedAmount,
    Number((proration.chargeForRemainingNew - proration.creditForUnusedCurrent).toFixed(2))
  );
});
