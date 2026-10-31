import test from 'node:test';
import assert from 'node:assert/strict';
import { getDb } from '../server/db/database.ts';
import {
  buildAuthorizedDatabaseContext,
  generateLiveDatabaseAnswer,
} from '../server/services/ai-assistant.ts';
import { evaluatePasswordStrength } from '../src/utils/password-strength.ts';

test('AI Assistant: ADMIN role accesses full executive financial and subscription intelligence', () => {
  const db = getDb();
  const adminUser = {
    id: 'USR-ADMIN-01',
    name: 'Elena Rostova',
    email: 'admin@nexora.io',
    role: 'ADMIN' as const,
  };

  const context: any = buildAuthorizedDatabaseContext(adminUser, db);

  assert.equal(context.userRole, 'ADMIN');
  assert.ok(context.financialMetrics, 'Must include financialMetrics for Admin');
  assert.ok(context.financialMetrics.mrr > 0, 'MRR must be greater than 0');
  assert.ok(context.financialMetrics.arr > 0, 'ARR must be greater than 0');
  assert.ok(context.subscriptions.activeCount > 0, 'Active subscriptions count must be positive');
  assert.ok(context.customers.topCustomersByValue.length > 0, 'Top customers by value must be populated');

  // Answer generation for MRR
  const mrrAnswer = generateLiveDatabaseAnswer('What is our current monthly recurring revenue?', context, 'ADMIN', adminUser);
  assert.match(mrrAnswer, /Monthly Recurring Revenue/i);
  assert.match(mrrAnswer, /MRR/i);

  // Answer generation for active subscriptions
  const subAnswer = generateLiveDatabaseAnswer('How many active subscriptions do we have?', context, 'ADMIN', adminUser);
  assert.match(subAnswer, /active subscriptions/i);

  // Answer generation for invoices
  const invAnswer = generateLiveDatabaseAnswer('How many invoices are unpaid?', context, 'ADMIN', adminUser);
  assert.match(invAnswer, /Unpaid Invoices/i);
});

test('AI Assistant: STAFF role accesses operational data and is restricted from executive margins', () => {
  const db = getDb();
  const staffUser = {
    id: 'USR-STAFF-01',
    name: 'Sarah Jenkins',
    email: 'staff.sarah@nexora.io',
    role: 'STAFF' as const,
  };

  const context: any = buildAuthorizedDatabaseContext(staffUser, db);

  assert.equal(context.userRole, 'STAFF');
  assert.equal(context.financialMetrics, undefined, 'Staff must not receive executive financial metrics directly');
  assert.ok(context.subscriptions.activeCount > 0, 'Staff accesses operational subscription counts');
  assert.ok(context.invoices.totalCount > 0, 'Staff accesses operational invoices');

  // Question on MRR returns boundary restriction
  const mrrAnswer = generateLiveDatabaseAnswer('What is our current monthly recurring revenue?', context, 'STAFF', staffUser);
  assert.match(mrrAnswer, /restricted to Administrator/i);

  // Question on operational subscriptions succeeds
  const subAnswer = generateLiveDatabaseAnswer('How many active subscriptions do we have?', context, 'STAFF', staffUser);
  assert.match(subAnswer, /active subscriptions/i);
});

test('AI Assistant: CUSTOMER role is strictly isolated to own account records and blocked from company data', () => {
  const db = getDb();
  // Find a known customer
  const cust = db.customers[0];
  const customerUser = {
    id: 'USR-CUST-TEST',
    name: cust.name,
    email: cust.email,
    role: 'CUSTOMER' as const,
    customerId: cust.id,
  };

  const context: any = buildAuthorizedDatabaseContext(customerUser, db);

  assert.equal(context.userRole, 'CUSTOMER');
  assert.equal(context.isCustomerIsolated, true);
  assert.equal(context.customerProfile.id, cust.id);
  assert.equal(context.financialMetrics, undefined);

  // Verify that returned subscriptions belong ONLY to this customer
  for (const s of context.subscriptions) {
    const originalSub = db.subscriptions.find((sub: any) => sub.id === s.id);
    assert.equal(originalSub.customerId, cust.id, 'Customer cannot see other customers subscriptions');
  }

  // If customer attempts to ask for company MRR
  const mrrAttempt = generateLiveDatabaseAnswer('What is our company monthly recurring revenue?', context, 'CUSTOMER', customerUser);
  assert.match(mrrAttempt, /Role Permission Notice/i);
  assert.match(mrrAttempt, /restricted to authorized administrative personnel/i);

  // If customer asks about other customers
  const otherCustAttempt = generateLiveDatabaseAnswer('Show me all customers and their revenue', context, 'CUSTOMER', customerUser);
  assert.match(otherCustAttempt, /Role Permission Notice/i);

  // If customer asks about own subscriptions
  const ownSubQuery = generateLiveDatabaseAnswer('What are my active subscriptions?', context, 'CUSTOMER', customerUser);
  assert.match(ownSubQuery, /Active Subscriptions/i);
});

test('Password Strength Evaluator: Validates mix of characters, symbols, numbers, and minimum length', () => {
  // Too short
  const resShort = evaluatePasswordStrength('Ab1!');
  assert.equal(resShort.isCompliant, false);
  assert.equal(resShort.score <= 1, true);

  // Missing number
  const resNoNum = evaluatePasswordStrength('AdminPassword!');
  assert.equal(resNoNum.isCompliant, false);
  assert.equal(resNoNum.criteria.find(c => c.id === 'number')?.satisfied, false);

  // Missing symbol
  const resNoSym = evaluatePasswordStrength('AdminPassword123');
  assert.equal(resNoSym.isCompliant, false);
  assert.equal(resNoSym.criteria.find(c => c.id === 'symbol')?.satisfied, false);

  // Missing uppercase
  const resNoUpper = evaluatePasswordStrength('adminpassword123!');
  assert.equal(resNoUpper.isCompliant, false);
  assert.equal(resNoUpper.criteria.find(c => c.id === 'uppercase')?.satisfied, false);

  // Missing lowercase
  const resNoLower = evaluatePasswordStrength('ADMINPASSWORD123!');
  assert.equal(resNoLower.isCompliant, false);
  assert.equal(resNoLower.criteria.find(c => c.id === 'lowercase')?.satisfied, false);

  // Fully compliant strong password
  const resStrong = evaluatePasswordStrength('Nexora@Enterprise2026!');
  assert.equal(resStrong.isCompliant, true);
  assert.equal(resStrong.score, 4);
  assert.equal(resStrong.level, 'strong');
  assert.equal(resStrong.criteria.every(c => c.satisfied), true);
});
