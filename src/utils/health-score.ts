/**
 * NEXORA Subscription Health Scoring Engine
 * 
 * Score: 0 - 100
 * Categories:
 * - 80 - 100: Healthy (Green)
 * - 50 - 79: At Risk (Amber)
 * - 0 - 49: Critical (Red)
 * 
 * Explainable, rule-based algorithm with weighted factors and transparent audit breakdown.
 */

export interface HealthScoreWeights {
  paymentReliabilityWeight: number; // default: 35
  overduePenaltyWeight: number;     // default: 25
  cancellationRiskWeight: number;   // default: 20
  statusFactorWeight: number;       // default: 10
  disputePenaltyWeight: number;     // default: 10
}

export const DEFAULT_HEALTH_WEIGHTS: HealthScoreWeights = {
  paymentReliabilityWeight: 35,
  overduePenaltyWeight: 25,
  cancellationRiskWeight: 20,
  statusFactorWeight: 10,
  disputePenaltyWeight: 10,
};

export interface SubscriptionHealthInput {
  totalInvoicesCount: number;
  paidInvoicesCount: number;
  overdueInvoicesCount: number;
  failedPaymentsCount: number;
  reversedPaymentsCount: number;
  hasCancellationRequest: boolean;
  subscriptionStatus: 'active' | 'paused' | 'renewal_pending' | 'closed' | 'draft' | 'cancellation_requested';
  averagePaymentDelayDays: number;
}

export interface ContributingFactor {
  name: string;
  impactScore: number; // positive or negative points
  description: string;
  type: 'positive' | 'neutral' | 'negative';
}

export interface HealthScoreResult {
  score: number;
  category: 'Healthy' | 'At Risk' | 'Critical';
  factors: ContributingFactor[];
  recommendedActions: string[];
  calculatedAt: string;
}

export function calculateSubscriptionHealthScore(
  input: SubscriptionHealthInput,
  weights: HealthScoreWeights = DEFAULT_HEALTH_WEIGHTS
): HealthScoreResult {
  const factors: ContributingFactor[] = [];
  const recommendedActions: string[] = [];

  let rawScore = 100;

  // 1. Payment Reliability Factor (Max weight: paymentReliabilityWeight)
  if (input.totalInvoicesCount > 0) {
    const paymentRatio = input.paidInvoicesCount / input.totalInvoicesCount;
    if (paymentRatio >= 0.95) {
      factors.push({
        name: 'Excellent Payment Track Record',
        impactScore: 0,
        description: `${Math.round(paymentRatio * 100)}% of invoices paid on time.`,
        type: 'positive',
      });
    } else if (paymentRatio >= 0.7) {
      const deduction = Math.round(weights.paymentReliabilityWeight * (1 - paymentRatio));
      rawScore -= deduction;
      factors.push({
        name: 'Moderate Payment Consistency',
        impactScore: -deduction,
        description: `${Math.round(paymentRatio * 100)}% payment completion rate.`,
        type: 'neutral',
      });
      recommendedActions.push('Review payment method and offer automated recurring card/UPI mandates.');
    } else {
      const deduction = Math.round(weights.paymentReliabilityWeight * (1 - paymentRatio));
      rawScore -= deduction;
      factors.push({
        name: 'Low Payment Reliability',
        impactScore: -deduction,
        description: `Only ${Math.round(paymentRatio * 100)}% of invoices have been successfully paid.`,
        type: 'negative',
      });
      recommendedActions.push('Contact customer account manager for financial reconciliation.');
    }
  }

  // 2. Overdue Invoices Penalty (overduePenaltyWeight)
  if (input.overdueInvoicesCount > 0) {
    const penaltyPerOverdue = Math.min(
      weights.overduePenaltyWeight,
      input.overdueInvoicesCount * 12
    );
    rawScore -= penaltyPerOverdue;
    factors.push({
      name: 'Unpaid Overdue Invoices',
      impactScore: -penaltyPerOverdue,
      description: `${input.overdueInvoicesCount} invoice(s) currently past due.`,
      type: 'negative',
    });
    recommendedActions.push('Trigger automated dunning reminder or escalate to collections.');
  } else {
    factors.push({
      name: 'Zero Overdue Invoices',
      impactScore: 0,
      description: 'Account is up-to-date with all billing commitments.',
      type: 'positive',
    });
  }

  // 3. Failed or Reversed Payments
  const paymentIssues = input.failedPaymentsCount + input.reversedPaymentsCount * 2;
  if (paymentIssues > 0) {
    const deduction = Math.min(weights.disputePenaltyWeight, paymentIssues * 6);
    rawScore -= deduction;
    factors.push({
      name: 'Failed / Reversed Transactions',
      impactScore: -deduction,
      description: `${input.failedPaymentsCount} failed and ${input.reversedPaymentsCount} reversed transaction(s).`,
      type: 'negative',
    });
    recommendedActions.push('Investigate gateway decline codes or card expiration.');
  }

  // 4. Cancellation Request
  if (input.hasCancellationRequest || input.subscriptionStatus === 'cancellation_requested') {
    const deduction = weights.cancellationRiskWeight;
    rawScore -= deduction;
    factors.push({
      name: 'Active Cancellation Request',
      impactScore: -deduction,
      description: 'Customer has submitted a cancellation or churn request.',
      type: 'negative',
    });
    recommendedActions.push('Schedule retention consultation or offer temporary pause/discount concession.');
  }

  // 5. Subscription Status Adjustment
  if (input.subscriptionStatus === 'paused') {
    const deduction = weights.statusFactorWeight;
    rawScore -= deduction;
    factors.push({
      name: 'Subscription Paused',
      impactScore: -deduction,
      description: 'Billing is currently halted under customer pause policy.',
      type: 'neutral',
    });
    recommendedActions.push('Monitor pause grace period expiry date to ensure timely resumption.');
  } else if (input.subscriptionStatus === 'active') {
    factors.push({
      name: 'Active Subscription State',
      impactScore: 0,
      description: 'Operational status is healthy and generating recurring billing.',
      type: 'positive',
    });
  }

  // 6. Payment Delay Days
  if (input.averagePaymentDelayDays > 14) {
    const delayPenalty = Math.min(10, Math.round((input.averagePaymentDelayDays - 14) * 0.7));
    rawScore -= delayPenalty;
    factors.push({
      name: 'Chronic Payment Delays',
      impactScore: -delayPenalty,
      description: `Payments typically take ${input.averagePaymentDelayDays} days beyond due date to settle.`,
      type: 'negative',
    });
    recommendedActions.push('Shorten payment terms from Net-30 to Due Upon Receipt.');
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  let category: 'Healthy' | 'At Risk' | 'Critical';
  if (finalScore >= 80) {
    category = 'Healthy';
    if (recommendedActions.length === 0) {
      recommendedActions.push('Account in excellent standing. Target for annual contract upgrade or add-on expansion.');
    }
  } else if (finalScore >= 50) {
    category = 'At Risk';
  } else {
    category = 'Critical';
  }

  return {
    score: finalScore,
    category,
    factors,
    recommendedActions,
    calculatedAt: new Date().toISOString(),
  };
}
