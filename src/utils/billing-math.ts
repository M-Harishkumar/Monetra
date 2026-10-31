/**
 * NEXORA Billing Math & Calendar-Aware Calculation Engine
 * 
 * Rules:
 * - Precise decimal calculations for financial values.
 * - Handles month-ends (e.g. Jan 31 -> Feb 28/29 -> Mar 31).
 * - Leap year aware (Feb 29 on leap years).
 * - Proration calculation based on exact days in billing cycle.
 */

import Decimal from 'decimal.js';

export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Checks if a given year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns number of days in a specific month of a year.
 */
export function getDaysInMonth(year: number, monthIndex: number): number {
  // monthIndex: 0 = Jan, 1 = Feb, ..., 11 = Dec
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Calculates the next billing date given a current date and frequency.
 * Enforces calendar-aware policy:
 * - If billing on the 31st and next month has 30 days, billing falls on the 30th (or 28/29 for Feb).
 * - Daily: +1 day
 * - Weekly: +7 days
 * - Monthly: +1 month with day-of-month capping
 * - Yearly: +1 year, handling Feb 29 -> Feb 28 on non-leap years.
 */
export function calculateNextBillingDate(
  currentDateInput: string | Date,
  frequency: BillingFrequency,
  originalDayAnchor?: number
): Date {
  const date = new Date(currentDateInput);
  const anchorDay = originalDayAnchor ?? date.getUTCDate();

  switch (frequency) {
    case 'daily': {
      const next = new Date(date);
      next.setUTCDate(next.getUTCDate() + 1);
      return next;
    }
    case 'weekly': {
      const next = new Date(date);
      next.setUTCDate(next.getUTCDate() + 7);
      return next;
    }
    case 'monthly': {
      let targetYear = date.getUTCFullYear();
      let targetMonth = date.getUTCMonth() + 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
      const maxDaysInTargetMonth = getDaysInMonth(targetYear, targetMonth);
      const targetDay = Math.min(anchorDay, maxDaysInTargetMonth);
      return new Date(Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0));
    }
    case 'yearly': {
      const targetYear = date.getUTCFullYear() + 1;
      const targetMonth = date.getUTCMonth();
      const maxDaysInTargetMonth = getDaysInMonth(targetYear, targetMonth);
      const targetDay = Math.min(anchorDay, maxDaysInTargetMonth);
      return new Date(Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0));
    }
    default:
      throw new Error(`Unsupported billing frequency: ${frequency}`);
  }
}

/**
 * Calculates financial line items, taxes, discounts and totals with strict Decimal rounding.
 */
export interface InvoiceLineCalculationItem {
  quantity: number;
  unitPrice: number | string;
  variantPrice?: number | string;
}

export interface TaxCalculationRule {
  name: string;
  percentage: number;
}

export interface DiscountCalculationRule {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface InvoiceCalculationResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
}

export function calculateInvoiceTotals(
  items: InvoiceLineCalculationItem[],
  discount?: DiscountCalculationRule | null,
  taxRules: TaxCalculationRule[] = []
): InvoiceCalculationResult {
  let subtotalDec = new Decimal(0);

  for (const item of items) {
    const qty = new Decimal(item.quantity || 1);
    const base = new Decimal(item.unitPrice || 0);
    const variant = new Decimal(item.variantPrice || 0);
    const lineTotal = qty.times(base.plus(variant));
    subtotalDec = subtotalDec.plus(lineTotal);
  }

  // Calculate discount
  let discountDec = new Decimal(0);
  if (discount) {
    if (discount.type === 'percentage') {
      const pct = new Decimal(discount.value).dividedBy(100);
      discountDec = subtotalDec.times(pct);
    } else {
      discountDec = new Decimal(discount.value);
    }
  }

  // Cap discount at subtotal
  if (discountDec.greaterThan(subtotalDec)) {
    discountDec = subtotalDec;
  }

  const taxableDec = subtotalDec.minus(discountDec);

  // Calculate cumulative or additive taxes
  let taxDec = new Decimal(0);
  for (const tax of taxRules) {
    const taxRate = new Decimal(tax.percentage).dividedBy(100);
    taxDec = taxDec.plus(taxableDec.times(taxRate));
  }

  const totalDec = taxableDec.plus(taxDec);

  return {
    subtotal: subtotalDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    discountAmount: discountDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    taxableAmount: taxableDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    taxAmount: taxDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    total: totalDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
  };
}

/**
 * Calculates Proration for subscription upgrades/downgrades.
 * Evaluates days remaining in current billing cycle vs days used.
 */
export function calculateProration(params: {
  currentRecurringAmount: number;
  newRecurringAmount: number;
  cycleStartDate: string | Date;
  cycleEndDate: string | Date;
  effectiveDate: string | Date;
}): {
  daysTotal: number;
  daysRemaining: number;
  daysUsed: number;
  creditForUnusedCurrent: number;
  chargeForRemainingNew: number;
  netProratedAmount: number;
} {
  const start = new Date(params.cycleStartDate).getTime();
  const end = new Date(params.cycleEndDate).getTime();
  const effective = new Date(params.effectiveDate).getTime();

  const oneDayMs = 86400000;
  const daysTotal = Math.max(1, Math.round((end - start) / oneDayMs));
  const daysUsed = Math.max(0, Math.min(daysTotal, Math.round((effective - start) / oneDayMs)));
  const daysRemaining = Math.max(0, daysTotal - daysUsed);

  const currentAmt = new Decimal(params.currentRecurringAmount);
  const newAmt = new Decimal(params.newRecurringAmount);
  const remainingFraction = new Decimal(daysRemaining).dividedBy(daysTotal);

  const unusedCurrentCredit = currentAmt.times(remainingFraction).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const remainingNewCharge = newAmt.times(remainingFraction).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const netDiff = remainingNewCharge.minus(unusedCurrentCredit).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    daysTotal,
    daysRemaining,
    daysUsed,
    creditForUnusedCurrent: unusedCurrentCredit.toNumber(),
    chargeForRemainingNew: remainingNewCharge.toNumber(),
    netProratedAmount: netDiff.toNumber(),
  };
}
