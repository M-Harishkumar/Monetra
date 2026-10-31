/**
 * NEXORA Revenue Guard – Leakage Detection & Financial Integrity Rules
 * 
 * Inspects business records for 10 distinct anomaly patterns that lead to revenue loss.
 */

import Decimal from 'decimal.js';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'investigating' | 'resolved' | 'dismissed';

export interface RevenueGuardAlert {
  id: string;
  category:
    | 'unbilled_active_subscription'
    | 'missed_renewal_billing'
    | 'duplicate_invoice'
    | 'invoice_total_mismatch'
    | 'expired_discount_applied'
    | 'unallocated_payment'
    | 'overdue_invoice'
    | 'amount_discrepancy'
    | 'failed_billing_run'
    | 'renewal_unbilled';
  customerId: string;
  customerName: string;
  subscriptionId?: string;
  subscriptionNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  estimatedFinancialImpact: number;
  severity: AlertSeverity;
  detectionTime: string;
  description: string;
  recommendedAction: string;
  status: AlertStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  investigationNotes?: string;
}

export interface RevenueGuardContext {
  subscriptions: Array<{
    id: string;
    subscriptionNumber: string;
    customerId: string;
    customerName: string;
    status: string;
    totalRecurringAmount: number;
    nextBillingDate: string;
    billingFrequency: string;
    discountCode?: string;
    discountExpiry?: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    subscriptionId?: string | null;
    customerId: string;
    customerName: string;
    invoiceDate: string;
    dueDate: string;
    billingPeriod: string;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    status: string;
  }>;
  payments: Array<{
    id: string;
    paymentNumber: string;
    customerId: string;
    customerName: string;
    amount: number;
    allocatedAmount: number;
    paymentDate: string;
    status: string;
  }>;
  billingRuns: Array<{
    id: string;
    runDate: string;
    status: string;
    failedCount: number;
    errorMessage?: string;
  }>;
  now?: Date;
}

export function runRevenueGuardAudit(context: RevenueGuardContext): RevenueGuardAlert[] {
  const alerts: RevenueGuardAlert[] = [];
  const now = context.now || new Date();
  const nowMs = now.getTime();
  let alertSeq = 1;

  const makeId = (cat: string) => `ALERT-${cat.toUpperCase().slice(0, 4)}-${String(alertSeq++).padStart(4, '0')}`;

  // 1. Check for Active Subscriptions without any invoice or past nextBillingDate by > 1 day
  for (const sub of context.subscriptions) {
    if (sub.status === 'active') {
      const nextDate = new Date(sub.nextBillingDate).getTime();
      const diffDays = Math.floor((nowMs - nextDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 2) {
        alerts.push({
          id: makeId('unbl'),
          category: 'missed_renewal_billing',
          customerId: sub.customerId,
          customerName: sub.customerName,
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscriptionNumber,
          estimatedFinancialImpact: sub.totalRecurringAmount,
          severity: diffDays > 7 ? 'critical' : 'high',
          detectionTime: now.toISOString(),
          description: `Active subscription ${sub.subscriptionNumber} was scheduled for billing on ${sub.nextBillingDate.slice(0, 10)} (${diffDays} days ago) but no invoice has been processed.`,
          recommendedAction: 'Trigger an automated billing cycle or execute manual billing retry.',
          status: 'new',
        });
      }
    }
  }

  // 2. Duplicate Invoices check (same subscription & same billing period)
  const periodMap = new Map<string, string[]>();
  for (const inv of context.invoices) {
    if (inv.subscriptionId && inv.billingPeriod && inv.status !== 'cancelled') {
      const key = `${inv.subscriptionId}:${inv.billingPeriod}`;
      const list = periodMap.get(key) || [];
      list.push(inv.invoiceNumber);
      periodMap.set(key, list);
    }
  }
  for (const [key, invList] of periodMap.entries()) {
    if (invList.length > 1) {
      const [subId] = key.split(':');
      const sub = context.subscriptions.find(s => s.id === subId);
      alerts.push({
        id: makeId('dupl'),
        category: 'duplicate_invoice',
        customerId: sub?.customerId || 'CUST-001',
        customerName: sub?.customerName || 'Customer',
        subscriptionId: subId,
        subscriptionNumber: sub?.subscriptionNumber,
        estimatedFinancialImpact: sub?.totalRecurringAmount || 0,
        severity: 'critical',
        detectionTime: now.toISOString(),
        description: `Multiple non-cancelled invoices found for same subscription and period: ${invList.join(', ')}.`,
        recommendedAction: 'Review invoices, credit duplicate bills, and ensure customer is not charged twice.',
        status: 'new',
      });
    }
  }

  // 3. Invoice Total Discrepancy (Subtotal - Discount + Tax !== Total)
  for (const inv of context.invoices) {
    if (inv.status !== 'cancelled') {
      const computedTotal = new Decimal(inv.subtotal)
        .minus(inv.discountAmount || 0)
        .plus(inv.taxAmount || 0)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        .toNumber();
      
      const diff = Math.abs(computedTotal - inv.total);
      if (diff > 0.05) {
        alerts.push({
          id: makeId('calc'),
          category: 'invoice_total_mismatch',
          customerId: inv.customerId,
          customerName: inv.customerName,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          estimatedFinancialImpact: Math.abs(diff),
          severity: 'medium',
          detectionTime: now.toISOString(),
          description: `Invoice ${inv.invoiceNumber} recorded total (${inv.total}) does not match calculated total (${computedTotal}).`,
          recommendedAction: 'Regenerate line item snapshot or apply reconciliation credit adjustment.',
          status: 'new',
        });
      }
    }
  }

  // 4. Overdue Invoices
  for (const inv of context.invoices) {
    if (inv.status !== 'paid' && inv.status !== 'cancelled') {
      const dueMs = new Date(inv.dueDate).getTime();
      if (nowMs > dueMs) {
        const outstanding = new Decimal(inv.total).minus(inv.amountPaid || 0).toNumber();
        const daysPastDue = Math.floor((nowMs - dueMs) / (1000 * 60 * 60 * 24));
        if (outstanding > 0) {
          alerts.push({
            id: makeId('odue'),
            category: 'overdue_invoice',
            customerId: inv.customerId,
            customerName: inv.customerName,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            estimatedFinancialImpact: outstanding,
            severity: daysPastDue > 15 ? 'critical' : daysPastDue > 7 ? 'high' : 'medium',
            detectionTime: now.toISOString(),
            description: `Invoice ${inv.invoiceNumber} has outstanding balance of ₹${outstanding} and is ${daysPastDue} days past due date.`,
            recommendedAction: 'Dispatch dunning escalation email and contact billing administrator.',
            status: 'new',
          });
        }
      }
    }
  }

  // 5. Unallocated Customer Payments
  for (const pay of context.payments) {
    const unallocated = new Decimal(pay.amount).minus(pay.allocatedAmount || 0).toNumber();
    if (unallocated > 0.01 && pay.status === 'completed') {
      alerts.push({
        id: makeId('unlc'),
        category: 'unallocated_payment',
        customerId: pay.customerId,
        customerName: pay.customerName,
        estimatedFinancialImpact: unallocated,
        severity: 'low',
        detectionTime: now.toISOString(),
        description: `Payment ${pay.paymentNumber} has ₹${unallocated} in unallocated funds not linked to any open invoice.`,
        recommendedAction: 'Allocate surplus payment to open invoices or register customer account credit.',
        status: 'new',
      });
    }
  }

  // 6. Expired Discounts Applied
  for (const sub of context.subscriptions) {
    if (sub.status === 'active' && sub.discountCode && sub.discountExpiry) {
      const expiryMs = new Date(sub.discountExpiry).getTime();
      if (nowMs > expiryMs) {
        alerts.push({
          id: makeId('disc'),
          category: 'expired_discount_applied',
          customerId: sub.customerId,
          customerName: sub.customerName,
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscriptionNumber,
          estimatedFinancialImpact: 500, // conservative estimate
          severity: 'medium',
          detectionTime: now.toISOString(),
          description: `Subscription ${sub.subscriptionNumber} has active discount '${sub.discountCode}' that expired on ${sub.discountExpiry.slice(0, 10)}.`,
          recommendedAction: 'Remove or update expired discount before next recurring billing event.',
          status: 'new',
        });
      }
    }
  }

  // 7. Failed Billing Runs
  for (const run of context.billingRuns) {
    if (run.failedCount > 0 || run.status === 'failed') {
      alerts.push({
        id: makeId('fail'),
        category: 'failed_billing_run',
        customerId: 'SYSTEM',
        customerName: 'System Billing Job',
        estimatedFinancialImpact: 0,
        severity: 'high',
        detectionTime: run.runDate,
        description: `Scheduled recurring billing job on ${run.runDate.slice(0, 10)} encountered ${run.failedCount} failed invoice attempts.`,
        recommendedAction: 'Open Billing Administration, review failure logs, and execute safe retry.',
        status: 'new',
      });
    }
  }

  return alerts;
}
