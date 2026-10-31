import test from 'node:test';
import assert from 'node:assert/strict';
import { runRevenueGuardAudit } from '../src/utils/revenue-guard.ts';

test('Revenue Guard detects missed renewal billing for active subscriptions past due date', () => {
  const alerts = runRevenueGuardAudit({
    subscriptions: [
      {
        id: 'sub-1',
        subscriptionNumber: 'SUB-2025-001',
        customerId: 'cust-1',
        customerName: 'Acme Corp',
        status: 'active',
        totalRecurringAmount: 4500,
        nextBillingDate: '2025-01-01T00:00:00Z',
        billingFrequency: 'monthly',
      },
    ],
    invoices: [],
    payments: [],
    billingRuns: [],
    now: new Date('2025-01-10T00:00:00Z'),
  });

  assert(alerts.some(a => a.category === 'missed_renewal_billing'));
  const missedAlert = alerts.find(a => a.category === 'missed_renewal_billing');
  assert.equal(missedAlert?.estimatedFinancialImpact, 4500);
});

test('Revenue Guard detects duplicate invoices for the same period', () => {
  const alerts = runRevenueGuardAudit({
    subscriptions: [
      {
        id: 'sub-2',
        subscriptionNumber: 'SUB-2025-002',
        customerId: 'cust-2',
        customerName: 'Globex Ltd',
        status: 'active',
        totalRecurringAmount: 1200,
        nextBillingDate: '2025-02-01T00:00:00Z',
        billingFrequency: 'monthly',
      },
    ],
    invoices: [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        subscriptionId: 'sub-2',
        customerId: 'cust-2',
        customerName: 'Globex Ltd',
        invoiceDate: '2025-01-01',
        dueDate: '2025-01-15',
        billingPeriod: '2025-01',
        subtotal: 1200,
        discountAmount: 0,
        taxAmount: 0,
        total: 1200,
        amountPaid: 1200,
        status: 'paid',
      },
      {
        id: 'inv-2',
        invoiceNumber: 'INV-002',
        subscriptionId: 'sub-2',
        customerId: 'cust-2',
        customerName: 'Globex Ltd',
        invoiceDate: '2025-01-01',
        dueDate: '2025-01-15',
        billingPeriod: '2025-01',
        subtotal: 1200,
        discountAmount: 0,
        taxAmount: 0,
        total: 1200,
        amountPaid: 0,
        status: 'confirmed',
      },
    ],
    payments: [],
    billingRuns: [],
    now: new Date('2025-01-05T00:00:00Z'),
  });

  assert(alerts.some(a => a.category === 'duplicate_invoice'));
});

test('Revenue Guard detects unallocated completed payments', () => {
  const alerts = runRevenueGuardAudit({
    subscriptions: [],
    invoices: [],
    payments: [
      {
        id: 'pay-1',
        paymentNumber: 'PAY-001',
        customerId: 'cust-3',
        customerName: 'Wayne Enterprises',
        amount: 5000,
        allocatedAmount: 3000, // 2000 unallocated
        paymentDate: '2025-01-02',
        status: 'completed',
      },
    ],
    billingRuns: [],
    now: new Date('2025-01-05T00:00:00Z'),
  });

  const unallocAlert = alerts.find(a => a.category === 'unallocated_payment');
  assert(unallocAlert);
  assert.equal(unallocAlert.estimatedFinancialImpact, 2000);
});
