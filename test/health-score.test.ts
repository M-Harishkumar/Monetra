import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSubscriptionHealthScore, DEFAULT_HEALTH_WEIGHTS } from '../src/utils/health-score.ts';

test('healthy subscription with pristine payment record scores in 80-100 range', () => {
  const result = calculateSubscriptionHealthScore({
    totalInvoicesCount: 12,
    paidInvoicesCount: 12,
    overdueInvoicesCount: 0,
    failedPaymentsCount: 0,
    reversedPaymentsCount: 0,
    hasCancellationRequest: false,
    subscriptionStatus: 'active',
    averagePaymentDelayDays: 2,
  });

  assert.equal(result.category, 'Healthy');
  assert(result.score >= 80, `Expected score >= 80, got ${result.score}`);
  assert(result.factors.some(f => f.name.includes('Excellent Payment Track Record')));
});

test('subscription with overdue invoices and cancellation request drops to Critical', () => {
  const result = calculateSubscriptionHealthScore({
    totalInvoicesCount: 10,
    paidInvoicesCount: 5,
    overdueInvoicesCount: 3,
    failedPaymentsCount: 2,
    reversedPaymentsCount: 1,
    hasCancellationRequest: true,
    subscriptionStatus: 'cancellation_requested',
    averagePaymentDelayDays: 25,
  });

  assert.equal(result.category, 'Critical');
  assert(result.score < 50, `Expected score < 50, got ${result.score}`);
  assert(result.recommendedActions.length > 0);
});

test('paused subscription receives status adjustment', () => {
  const result = calculateSubscriptionHealthScore({
    totalInvoicesCount: 5,
    paidInvoicesCount: 5,
    overdueInvoicesCount: 0,
    failedPaymentsCount: 0,
    reversedPaymentsCount: 0,
    hasCancellationRequest: false,
    subscriptionStatus: 'paused',
    averagePaymentDelayDays: 0,
  });

  assert.equal(result.score, 100 - DEFAULT_HEALTH_WEIGHTS.statusFactorWeight);
  assert(result.factors.some(f => f.name === 'Subscription Paused'));
});
