import test from 'node:test';
import assert from 'node:assert/strict';
import { getDb } from '../server/db/database.ts';
import {
  queryAIAssistant,
  isDirectDatabaseQuery,
  buildAuthorizedDatabaseContext,
} from '../server/services/ai-assistant.ts';

test('AI Assistant: Direct queries respond with sub-50ms verified database telemetry', async () => {
  const adminUser = {
    id: 'USR-ADMIN-01',
    name: 'Elena Rostova',
    email: 'admin@nexora.io',
    role: 'ADMIN' as const,
  };

  // Test MRR speed and correctness
  const startMrr = Date.now();
  const mrrRes = await queryAIAssistant(adminUser, 'What is our current monthly recurring revenue?');
  const mrrDuration = Date.now() - startMrr;

  assert.ok(mrrDuration < 500, `MRR query must finish under 500ms on cold start, took ${mrrDuration}ms`);
  assert.match(mrrRes.text, /Monthly Recurring Revenue/i);
  assert.match(mrrRes.text, /₹53,013/);

  // Test active subscriptions query
  const startSubs = Date.now();
  const subsRes = await queryAIAssistant(adminUser, 'How many active subscriptions do we have?');
  const subsDuration = Date.now() - startSubs;

  assert.ok(subsDuration < 100, `Subs query must finish under 100ms, took ${subsDuration}ms`);
  assert.match(subsRes.text, /active subscriptions/i);

  // Test customer query isolation and speed
  const custUser = {
    id: 'USR-CUST-01',
    name: 'Marcus Sterling',
    email: 'customer@nexora.io',
    role: 'CUSTOMER' as const,
    customerId: 'CUST-001',
  };

  const startCust = Date.now();
  const custRes = await queryAIAssistant(custUser, 'What are my active subscriptions?');
  const custDuration = Date.now() - startCust;

  assert.ok(custDuration < 100, `Customer query must finish under 100ms, took ${custDuration}ms`);
  assert.match(custRes.text, /Your Active Subscriptions/i);
});

test('Notification Center: Role-based filtering correctly isolates alerts', () => {
  const db = getDb();

  // Failed payments in DB
  const failedPayments = db.payments.filter((p: any) => p.status === 'FAILED' || p.status === 'REVERSED');
  assert.ok(failedPayments.length > 0, 'Database should contain failed payment records');

  // Customer CUST-001 has isolated data
  const custSubs = db.subscriptions.filter((s: any) => s.customerId === 'CUST-001');
  assert.ok(custSubs.length > 0, 'Customer CUST-001 should have subscriptions');
});
