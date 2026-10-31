export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  customerId?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  title?: string | null;
  department?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  bio?: string | null;
  createdAt?: string;
  updatedAt?: string;
  customer?: any | null;
}

export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  billingAddress?: string | null;
  taxId?: string | null;
  country: string;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  assignedStaffId?: string | null;
  activeSubscriptionsCount?: number;
  totalInvoiced?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  additionalPrice: number;
  isDefault: boolean;
  status: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'software' | 'service' | 'addon';
  salesPrice: number;
  costPrice: number;
  description?: string | null;
  internalNotes?: string | null;
  status: string;
  variants?: ProductVariant[];
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  billingPrice: number;
  billingFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  minimumQuantity: number;
  allowAutoClosure: boolean;
  allowEarlyClosure: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  allowUpgrade: boolean;
  allowDowngrade: boolean;
  status: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName?: string;
  planId: string;
  planName?: string;
  quantity: number;
  subtotal: number;
  discountAmount: number;
  discountId?: string | null;
  taxAmount: number;
  totalAmount: number;
  paymentTerms: string;
  notes?: string | null;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
  convertedSubscriptionId?: string | null;
  quotationDate: string;
  expiryDate: string;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  planId: string;
  planName?: string;
  planCode?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'RENEWAL_PENDING' | 'CANCELLATION_REQUESTED' | 'CLOSED';
  startDate: string;
  endDate?: string | null;
  nextBillingDate: string;
  lastBillingDate?: string | null;
  billingFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  paymentTerms: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  totalRecurringAmount: number;
  pauseDate?: string | null;
  resumeDate?: string | null;
  cancellationReason?: string | null;
  healthScore?: number;
  healthCategory?: string;
  createdAt: string;
}

export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  eventType: string;
  actorId: string;
  actorName: string;
  previousValue?: string | null;
  newValue?: string | null;
  description: string;
  timestamp: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subscriptionId?: string | null;
  subscriptionNumber?: string | null;
  invoiceDate: string;
  dueDate: string;
  billingPeriod: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  outstandingAmount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  isOverdue: boolean;
  notes?: string | null;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  customerName?: string;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  paymentDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'OTHER';
  amount: number;
  allocatedAmount: number;
  transactionReference: string;
  notes?: string | null;
  status: 'COMPLETED' | 'REVERSED' | 'PENDING';
  reversedAt?: string | null;
  reversalReason?: string | null;
}

export interface RevenueGuardAlert {
  id: string;
  category: string;
  customerId: string;
  customerName: string;
  subscriptionId?: string;
  subscriptionNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  estimatedFinancialImpact: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectionTime: string;
  description: string;
  recommendedAction: string;
  status: 'new' | 'investigating' | 'resolved' | 'dismissed';
  assignedStaffId?: string;
  assignedStaffName?: string;
  staffNotes?: string;
  resolvedAt?: string;
}

export interface SubscriptionHealthItem {
  subscriptionId: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  planName: string;
  totalRecurringAmount: number;
  status: string;
  score: number;
  category: 'Healthy' | 'At Risk' | 'Critical';
  factors: Array<{
    name: string;
    impactScore: number;
    description: string;
    type: 'positive' | 'neutral' | 'negative';
  }>;
  recommendedActions: string[];
  calculatedAt: string;
}

export interface BillingRun {
  id: string;
  runNumber: string;
  runDate: string;
  scheduledBy: string;
  totalSubscriptionsScanned: number;
  successfulInvoicesCount: number;
  failedInvoicesCount: number;
  skippedCount: number;
  status: string;
  logDetails?: string;
}

export interface BankTransaction {
  id: string;
  importId: string;
  transactionReference: string;
  transactionDate: string;
  description: string;
  amount: number;
  customerNameMatch?: string | null;
  invoiceMatch?: string | null;
  matchStatus: 'exact' | 'possible' | 'unmatched' | 'duplicate';
  matchedPaymentId?: string | null;
}

export interface RevenueScenario {
  id: string;
  name: string;
  description?: string | null;
  baselineMrr: number;
  simulatedMrr: number;
  baselineArr: number;
  simulatedArr: number;
  projectedGrowthPct: number;
  notes?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  eventType: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  templateType: string;
  relatedEntity?: string | null;
  relatedId?: string | null;
  sentAt: string;
  status: string;
  emailBody: string;
}

export type NotificationCategory = 'payment' | 'renewal' | 'system' | 'security' | 'general';
export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRole?: UserRole[] | 'ALL';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    subscriptionId?: string;
    paymentId?: string;
    invoiceId?: string;
    customerId?: string;
    amount?: number;
    currency?: string;
    renewalDate?: string;
  };
}

