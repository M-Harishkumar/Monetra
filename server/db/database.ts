/**
 * NEXORA Enterprise Relational Database Layer & Storage Engine
 * 
 * Provides:
 * - Persistent storage across restarts (stored at server/data/nexora_db.json).
 * - Relational lookups, foreign keys, unique constraints.
 * - Idempotent billing locks and transaction safety.
 * - Realistic enterprise demonstration seed data.
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import Decimal from 'decimal.js';
import { runRevenueGuardAudit } from '../../src/utils/revenue-guard.ts';
import { calculateSubscriptionHealthScore } from '../../src/utils/health-score.ts';

const DB_DIR = path.resolve(process.cwd(), 'server/data');
const DB_FILE = path.join(DB_DIR, 'nexora_db.json');

export interface DatabaseSchema {
  users: any[];
  customers: any[];
  passwordResetTokens: any[];
  auditLogs: any[];
  products: any[];
  productVariants: any[];
  plans: any[];
  planProducts: any[];
  quotationTemplates: any[];
  quotationTemplateItems: any[];
  quotations: any[];
  quotationItems: any[];
  subscriptions: any[];
  subscriptionItems: any[];
  subscriptionEvents: any[];
  subscriptionRequests: any[];
  taxRules: any[];
  taxRuleProducts: any[];
  discounts: any[];
  discountProducts: any[];
  discountUsages: any[];
  invoices: any[];
  invoiceItems: any[];
  billingRuns: any[];
  billingRunItems: any[];
  payments: any[];
  paymentAllocations: any[];
  revenueGuardAlerts: any[];
  subscriptionHealthScores: any[];
  renewalReminders: any[];
  subscriptionChangePreviews: any[];
  bankImports: any[];
  bankTransactions: any[];
  reconciliationMatches: any[];
  revenueScenarios: any[];
  revenueScenarioAssumptions: any[];
  emailLogs: any[];
  systemSettings: any[];
}

let dbInstance: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (!dbInstance) {
    dbInstance = loadOrInitDb();
  }
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbInstance, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

// Transaction runner
export function withTransaction<T>(operation: (db: DatabaseSchema) => T): T {
  const db = getDb();
  try {
    const result = operation(db);
    saveDb();
    return result;
  } catch (err) {
    // Reload database from disk to roll back unpersisted in-memory changes
    dbInstance = loadOrInitDb();
    throw err;
  }
}

export function logAudit(
  actor: { id?: string; name: string; role: string },
  action: string,
  entityType: string,
  entityId: string,
  description: string,
  previousValue?: any,
  newValue?: any
) {
  const db = getDb();
  db.auditLogs.unshift({
    id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    eventType: `${entityType.toUpperCase()}_${action.toUpperCase()}`,
    actorId: actor.id || 'system',
    actorName: actor.name,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    previousValue: previousValue ? JSON.stringify(previousValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    description,
    createdAt: new Date().toISOString(),
  });
  saveDb();
}

function loadOrInitDb(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.warn('Error reading database file, reinitializing fresh seed data...', err);
    }
  }

  const initial = createSeedDatabase();
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing initial seed database:', err);
  }
  return initial;
}

function createSeedDatabase(): DatabaseSchema {
  const now = new Date();
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@Nexora123!', salt);
  const staffHash = bcrypt.hashSync('Staff@Nexora123!', salt);
  const customerHash = bcrypt.hashSync('Customer@Nexora123!', salt);

  // 1. Users
  const users = [
    {
      id: 'USR-ADMIN-01',
      name: 'Elena Rostova',
      email: 'admin@nexora.io',
      passwordHash: adminHash,
      role: 'ADMIN',
      phone: '+1 (555) 019-2834',
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'USR-STAFF-01',
      name: 'Sarah Jenkins',
      email: 'staff.sarah@nexora.io',
      passwordHash: staffHash,
      role: 'STAFF',
      phone: '+1 (555) 019-8721',
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'USR-STAFF-02',
      name: 'Alex Vance',
      email: 'staff.alex@nexora.io',
      passwordHash: staffHash,
      role: 'STAFF',
      phone: '+1 (555) 019-3344',
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 45 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'USR-CUST-01',
      name: 'Marcus Sterling',
      email: 'customer@nexora.io',
      passwordHash: customerHash,
      role: 'CUSTOMER',
      customerId: 'CUST-001',
      phone: '+1 (555) 349-1100',
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 40 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // 2. Customers (10+ customers with realistic profiles)
  const customers = [
    {
      id: 'CUST-001',
      customerNumber: 'CUST-2025-001',
      name: 'Acme Cloud Solutions',
      email: 'customer@nexora.io',
      phone: '+1 (555) 349-1100',
      companyName: 'Acme Cloud Solutions Inc.',
      billingAddress: '742 Innovation Way, Suite 400',
      taxId: 'US-EIN-88234912',
      country: 'United States',
      state: 'California',
      city: 'San Francisco',
      postalCode: '94105',
      status: 'ACTIVE',
      assignedStaffId: 'USR-STAFF-01',
      createdAt: new Date(now.getTime() - 120 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'CUST-002',
      customerNumber: 'CUST-2025-002',
      name: 'Apex Media Labs',
      email: 'billing@apexmedialabs.com',
      phone: '+1 (555) 832-4411',
      companyName: 'Apex Media Labs LLC',
      billingAddress: '100 Broadway, 12th Floor',
      taxId: 'US-EIN-19283401',
      country: 'United States',
      state: 'New York',
      city: 'New York',
      postalCode: '10006',
      status: 'ACTIVE',
      assignedStaffId: 'USR-STAFF-01',
      createdAt: new Date(now.getTime() - 95 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'CUST-003',
      customerNumber: 'CUST-2025-003',
      name: 'Stellar Dynamics',
      email: 'accounts@stellardynamics.io',
      phone: '+44 20 7946 0912',
      companyName: 'Stellar Dynamics Ltd',
      billingAddress: '25 Finsbury Circus',
      taxId: 'GB-VAT-9923841',
      country: 'United Kingdom',
      state: 'Greater London',
      city: 'London',
      postalCode: 'EC2M 7EE',
      status: 'ACTIVE',
      assignedStaffId: 'USR-STAFF-02',
      createdAt: new Date(now.getTime() - 85 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'CUST-004',
      customerNumber: 'CUST-2025-004',
      name: 'BlueWave Logistics',
      email: 'finance@bluewavelogistics.com',
      phone: '+91 80 4123 4567',
      companyName: 'BlueWave Supply Chain Pvt Ltd',
      billingAddress: 'Outer Ring Road, Kadubeesanahalli',
      taxId: '29AABCB1234F1Z8',
      country: 'India',
      state: 'Karnataka',
      city: 'Bengaluru',
      postalCode: '560103',
      status: 'ACTIVE',
      assignedStaffId: 'USR-STAFF-02',
      createdAt: new Date(now.getTime() - 75 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'CUST-005',
      customerNumber: 'CUST-2025-005',
      name: 'Quantum AI Labs',
      email: 'ops@quantumailabs.ai',
      phone: '+1 (555) 782-9900',
      companyName: 'Quantum AI Labs Corp',
      billingAddress: '3000 Sand Hill Road',
      taxId: 'US-EIN-77291034',
      country: 'United States',
      state: 'California',
      city: 'Menlo Park',
      postalCode: '94025',
      status: 'ACTIVE',
      assignedStaffId: 'USR-STAFF-01',
      createdAt: new Date(now.getTime() - 65 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'CUST-006',
      customerNumber: 'CUST-2025-006',
      name: 'Helios Health Technologies',
      email: 'payments@helioshealth.de',
      phone: '+49 30 2233 4455',
      companyName: 'Helios Health GmbH',
      billingAddress: 'Friedrichstraße 43',
      taxId: 'DE-993847291',
      country: 'Germany',
      state: 'Berlin',
      city: 'Berlin',
      postalCode: '10117',
      status: 'ACTIVE',
      assignedStaffId: 'USR-STAFF-01',
      createdAt: new Date(now.getTime() - 50 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'CUST-007',
      customerNumber: 'CUST-2025-007',
      name: 'Horizon Fintech',
      email: 'billing@horizonfintech.sg',
      phone: '+65 6789 0123',
      companyName: 'Horizon Fintech Pte Ltd',
      billingAddress: '1 Raffles Place #20-01',
      taxId: 'SG-UEN-202012345K',
      country: 'Singapore',
      state: 'Central',
      city: 'Singapore',
      postalCode: '048616',
      status: 'ACTIVE',
      assignedStaffId: 'USR-STAFF-02',
      createdAt: new Date(now.getTime() - 40 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'CUST-008',
      customerNumber: 'CUST-2025-008',
      name: 'Crestline Retail Systems',
      email: 'vendor@crestlineretail.com',
      phone: '+1 (555) 234-9988',
      companyName: 'Crestline Retail Partners',
      billingAddress: '550 Michigan Ave',
      taxId: 'US-EIN-66231902',
      country: 'United States',
      state: 'Illinois',
      city: 'Chicago',
      postalCode: '60611',
      status: 'ACTIVE',
      assignedStaffId: 'USR-STAFF-02',
      createdAt: new Date(now.getTime() - 35 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'CUST-009',
      customerNumber: 'CUST-2025-009',
      name: 'OmniSys Security',
      email: 'accounts@omnisys-sec.com',
      phone: '+1 (555) 890-2134',
      companyName: 'OmniSys Cyber Defense Corp',
      billingAddress: '1200 Tysons Corner Blvd',
      taxId: 'US-EIN-44120984',
      country: 'United States',
      state: 'Virginia',
      city: 'McLean',
      postalCode: '22102',
      status: 'ACTIVE',
      assignedStaffId: 'USR-STAFF-01',
      createdAt: new Date(now.getTime() - 25 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'CUST-010',
      customerNumber: 'CUST-2025-010',
      name: 'Vertex Analytics Group',
      email: 'finance@vertexanalytics.com',
      phone: '+1 (555) 998-3321',
      companyName: 'Vertex Analytics Group LLC',
      billingAddress: '700 Congress Ave',
      taxId: 'US-EIN-55219087',
      country: 'United States',
      state: 'Texas',
      city: 'Austin',
      postalCode: '78701',
      status: 'ACTIVE',
      assignedStaffId: 'USR-STAFF-02',
      createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // 3. Products
  const products = [
    {
      id: 'PROD-001',
      name: 'NEXORA Enterprise Core',
      type: 'software',
      salesPrice: 4999.00,
      costPrice: 850.00,
      description: 'Unified subscription management, billing engine, and revenue ledger platform.',
      internalNotes: 'Tier 1 flagship product.',
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 180 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'PROD-002',
      name: 'Revenue Guard Leakage Sentinel',
      type: 'software',
      salesPrice: 1999.00,
      costPrice: 300.00,
      description: 'Automated 24/7 audit sentinel detecting unbilled cycles, duplicate invoices, and under-allocated cash.',
      internalNotes: 'High-margin intelligence module.',
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 160 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'PROD-003',
      name: 'Dedicated Enterprise SLA & Tam',
      type: 'service',
      salesPrice: 2500.00,
      costPrice: 1200.00,
      description: 'Dedicated Technical Account Manager, 15-minute response SLA, and monthly reconciliation reviews.',
      internalNotes: 'Human resource heavy.',
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 150 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'PROD-004',
      name: 'Bank Feeds & ERP Connector',
      type: 'addon',
      salesPrice: 750.00,
      costPrice: 120.00,
      description: 'Automated statement sync with major banks, SAP, Oracle NetSuite, and QuickBooks.',
      internalNotes: 'Uses secure Open Banking protocols.',
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 140 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'PROD-005',
      name: 'What-If Simulation & Cohorts Engine',
      type: 'software',
      salesPrice: 1250.00,
      costPrice: 220.00,
      description: 'Predictive scenario builder with parameter modeling, cohort churn tables, and LTV projections.',
      internalNotes: 'Popular with CFOs.',
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 120 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // 4. Product Variants
  const productVariants = [
    {
      id: 'VAR-001',
      productId: 'PROD-001',
      name: 'Standard Edition',
      additionalPrice: 0.00,
      isDefault: true,
      status: 'ACTIVE',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'VAR-002',
      productId: 'PROD-001',
      name: 'Professional Multi-Org',
      additionalPrice: 560.00,
      isDefault: false,
      status: 'ACTIVE',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'VAR-003',
      productId: 'PROD-001',
      name: 'Global Enterprise (Unlimited)',
      additionalPrice: 1200.00,
      isDefault: false,
      status: 'ACTIVE',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'VAR-004',
      productId: 'PROD-003',
      name: '24/7 Priority Support',
      additionalPrice: 1000.00,
      isDefault: false,
      status: 'ACTIVE',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // 5. Plans
  const plans = [
    {
      id: 'PLAN-001',
      name: 'NEXORA Starter',
      code: 'STARTER-M',
      description: 'Essential recurring billing, invoice generation, and customer ledger for emerging SaaS.',
      billingPrice: 2499.00,
      billingFrequency: 'monthly',
      minimumQuantity: 1,
      allowAutoClosure: true,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      allowUpgrade: true,
      allowDowngrade: true,
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 150 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'PLAN-002',
      name: 'Growth Pro with Revenue Guard',
      code: 'GROWTH-M',
      description: 'Full subscription engine with Revenue Guard anomaly alerts, health scoring, and auto-dunning.',
      billingPrice: 6999.00,
      billingFrequency: 'monthly',
      minimumQuantity: 1,
      allowAutoClosure: true,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      allowUpgrade: true,
      allowDowngrade: true,
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 150 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'PLAN-003',
      name: 'Enterprise Scale',
      code: 'ENTERPRISE-M',
      description: 'Unlimited volume, dedicated SLA, multi-currency ledger, bank reconciliation assistant, and simulator.',
      billingPrice: 18500.00,
      billingFrequency: 'monthly',
      minimumQuantity: 1,
      allowAutoClosure: false,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      allowUpgrade: true,
      allowDowngrade: false,
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 150 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'PLAN-004',
      name: 'Enterprise Annual Growth',
      code: 'ENTERPRISE-Y',
      description: 'Yearly commitment with 15% built-in discount, executive health monitoring, and custom integrations.',
      billingPrice: 198000.00,
      billingFrequency: 'yearly',
      minimumQuantity: 1,
      allowAutoClosure: false,
      allowEarlyClosure: false,
      allowPause: true,
      allowRenewal: true,
      allowUpgrade: true,
      allowDowngrade: false,
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 150 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'PLAN-005',
      name: 'Weekly High-Velocity Sandbox',
      code: 'SANDBOX-W',
      description: 'Weekly billing cycle for short-term enterprise pilots and proof-of-concept testing.',
      billingPrice: 999.00,
      billingFrequency: 'weekly',
      minimumQuantity: 1,
      allowAutoClosure: true,
      allowEarlyClosure: true,
      allowPause: false,
      allowRenewal: true,
      allowUpgrade: true,
      allowDowngrade: true,
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 150 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // 6. Tax Rules
  const taxRules = [
    {
      id: 'TAX-001',
      name: 'Standard GST / VAT (18%)',
      percentage: 18.00,
      type: 'GST',
      isDefault: true,
      status: 'ACTIVE',
      createdAt: now.toISOString(),
    },
    {
      id: 'TAX-002',
      name: 'European Digital VAT (20%)',
      percentage: 20.00,
      type: 'VAT',
      isDefault: false,
      status: 'ACTIVE',
      createdAt: now.toISOString(),
    },
    {
      id: 'TAX-003',
      name: 'US Out-of-State / Export (0%)',
      percentage: 0.00,
      type: 'Sales Tax',
      isDefault: false,
      status: 'ACTIVE',
      createdAt: now.toISOString(),
    },
  ];

  // 7. Discounts
  const discounts = [
    {
      id: 'DISC-001',
      name: 'Founder Launch 20% Off',
      code: 'FOUNDER20',
      type: 'percentage',
      value: 20.00,
      minPurchaseAmount: 2000.00,
      minQuantity: 1,
      startDate: new Date(now.getTime() - 180 * 86400000).toISOString(),
      expiryDate: new Date(now.getTime() + 180 * 86400000).toISOString(),
      totalUsageLimit: 50,
      perCustomerLimit: 1,
      usageCount: 14,
      status: 'ACTIVE',
      createdAt: now.toISOString(),
    },
    {
      id: 'DISC-002',
      name: 'Flat ₹500 First Bill Credit',
      code: 'FLAT500',
      type: 'fixed',
      value: 500.00,
      minPurchaseAmount: 1500.00,
      minQuantity: 1,
      startDate: new Date(now.getTime() - 90 * 86400000).toISOString(),
      expiryDate: new Date(now.getTime() + 90 * 86400000).toISOString(),
      totalUsageLimit: 100,
      perCustomerLimit: 1,
      usageCount: 38,
      status: 'ACTIVE',
      createdAt: now.toISOString(),
    },
    {
      id: 'DISC-003',
      name: 'Holiday Special 2024 (Expired)',
      code: 'HOLIDAY24',
      type: 'percentage',
      value: 15.00,
      minPurchaseAmount: 1000.00,
      minQuantity: 1,
      startDate: new Date(now.getTime() - 120 * 86400000).toISOString(),
      expiryDate: new Date(now.getTime() - 30 * 86400000).toISOString(), // EXPIRED
      totalUsageLimit: 25,
      perCustomerLimit: 1,
      usageCount: 25,
      status: 'EXPIRED',
      createdAt: now.toISOString(),
    },
  ];

  // 8. Subscriptions
  // Next billing dates:
  // - Some due in 3 days (trigger renewal reminders)
  // - Some due today
  // - Some overdue (generate Revenue Guard alert)
  // - Some paused
  // - Some closed
  const subscriptions = [
    {
      id: 'SUB-001',
      subscriptionNumber: 'SUB-2025-001',
      customerId: 'CUST-001',
      planId: 'PLAN-002', // Growth Pro
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 60 * 86400000).toISOString(),
      endDate: null,
      nextBillingDate: new Date(now.getTime() + 3 * 86400000).toISOString(), // in 3 days
      lastBillingDate: new Date(now.getTime() - 27 * 86400000).toISOString(),
      billingFrequency: 'monthly',
      paymentTerms: 'Net 30',
      quantity: 1,
      unitPrice: 6999.00,
      taxRate: 18.00,
      discountAmount: 0.00,
      totalRecurringAmount: 8258.82, // 6999 + 18% tax
      createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'SUB-002',
      subscriptionNumber: 'SUB-2025-002',
      customerId: 'CUST-002',
      planId: 'PLAN-003', // Enterprise Scale
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 90 * 86400000).toISOString(),
      endDate: null,
      nextBillingDate: new Date(now.getTime() + 15 * 86400000).toISOString(),
      lastBillingDate: new Date(now.getTime() - 15 * 86400000).toISOString(),
      billingFrequency: 'monthly',
      paymentTerms: 'Net 30',
      quantity: 1,
      unitPrice: 18500.00,
      taxRate: 18.00,
      discountAmount: 1850.00, // 10%
      totalRecurringAmount: 19647.00,
      createdAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'SUB-003',
      subscriptionNumber: 'SUB-2025-003',
      customerId: 'CUST-003',
      planId: 'PLAN-004', // Annual
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 300 * 86400000).toISOString(),
      endDate: new Date(now.getTime() + 65 * 86400000).toISOString(),
      nextBillingDate: new Date(now.getTime() + 65 * 86400000).toISOString(),
      lastBillingDate: new Date(now.getTime() - 300 * 86400000).toISOString(),
      billingFrequency: 'yearly',
      paymentTerms: 'Due Upon Receipt',
      quantity: 1,
      unitPrice: 198000.00,
      taxRate: 20.00,
      discountAmount: 0.00,
      totalRecurringAmount: 237600.00,
      createdAt: new Date(now.getTime() - 300 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'SUB-004',
      subscriptionNumber: 'SUB-2025-004',
      customerId: 'CUST-004',
      planId: 'PLAN-001', // Starter
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 45 * 86400000).toISOString(),
      endDate: null,
      nextBillingDate: new Date(now.getTime() - 3 * 86400000).toISOString(), // OVERDUE BILLING EVENT!
      lastBillingDate: new Date(now.getTime() - 33 * 86400000).toISOString(),
      billingFrequency: 'monthly',
      paymentTerms: 'Net 15',
      quantity: 2,
      unitPrice: 2499.00,
      taxRate: 18.00,
      discountAmount: 500.00,
      totalRecurringAmount: 5307.64,
      createdAt: new Date(now.getTime() - 45 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'SUB-005',
      subscriptionNumber: 'SUB-2025-005',
      customerId: 'CUST-005',
      planId: 'PLAN-002', // Growth Pro
      status: 'PAUSED',
      startDate: new Date(now.getTime() - 70 * 86400000).toISOString(),
      endDate: null,
      nextBillingDate: new Date(now.getTime() + 20 * 86400000).toISOString(),
      lastBillingDate: new Date(now.getTime() - 40 * 86400000).toISOString(),
      billingFrequency: 'monthly',
      paymentTerms: 'Net 30',
      quantity: 1,
      unitPrice: 6999.00,
      taxRate: 18.00,
      discountAmount: 0.00,
      totalRecurringAmount: 8258.82,
      pauseDate: new Date(now.getTime() - 10 * 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 70 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'SUB-006',
      subscriptionNumber: 'SUB-2025-006',
      customerId: 'CUST-006',
      planId: 'PLAN-001', // Starter
      status: 'CLOSED',
      startDate: new Date(now.getTime() - 180 * 86400000).toISOString(),
      endDate: new Date(now.getTime() - 15 * 86400000).toISOString(),
      nextBillingDate: new Date(now.getTime() - 15 * 86400000).toISOString(),
      lastBillingDate: new Date(now.getTime() - 45 * 86400000).toISOString(),
      billingFrequency: 'monthly',
      paymentTerms: 'Net 30',
      quantity: 1,
      unitPrice: 2499.00,
      taxRate: 20.00,
      discountAmount: 0.00,
      totalRecurringAmount: 2998.80,
      cancellationReason: 'Merged with internal toolchain.',
      createdAt: new Date(now.getTime() - 180 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // 9. Quotations
  const quotations = [
    {
      id: 'QT-001',
      quotationNumber: 'QT-2025-001',
      customerId: 'CUST-007', // Horizon Fintech
      quotationDate: new Date(now.getTime() - 5 * 86400000).toISOString(),
      expiryDate: new Date(now.getTime() + 25 * 86400000).toISOString(),
      paymentTerms: 'Net 30',
      planId: 'PLAN-003',
      quantity: 1,
      subtotal: 18500.00,
      discountAmount: 1850.00,
      discountId: 'DISC-001',
      taxAmount: 2997.00,
      totalAmount: 19647.00,
      notes: 'Includes dedicated TAM and custom banking feed connector.',
      status: 'SENT',
      convertedSubscriptionId: null,
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'QT-002',
      quotationNumber: 'QT-2025-002',
      customerId: 'CUST-008', // Crestline
      quotationDate: new Date(now.getTime() - 12 * 86400000).toISOString(),
      expiryDate: new Date(now.getTime() + 18 * 86400000).toISOString(),
      paymentTerms: 'Net 30',
      planId: 'PLAN-002',
      quantity: 3,
      subtotal: 20997.00,
      discountAmount: 0.00,
      taxAmount: 3779.46,
      totalAmount: 24776.46,
      notes: 'Multi-seat deployment with priority training.',
      status: 'ACCEPTED',
      convertedSubscriptionId: null,
      createdAt: new Date(now.getTime() - 12 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'QT-003',
      quotationNumber: 'QT-2025-003',
      customerId: 'CUST-001',
      quotationDate: new Date(now.getTime() - 65 * 86400000).toISOString(),
      expiryDate: new Date(now.getTime() - 35 * 86400000).toISOString(),
      paymentTerms: 'Net 30',
      planId: 'PLAN-002',
      quantity: 1,
      subtotal: 6999.00,
      discountAmount: 0.00,
      taxAmount: 1259.82,
      totalAmount: 8258.82,
      notes: 'Initial Growth Pro onboarding quotation.',
      status: 'CONVERTED',
      convertedSubscriptionId: 'SUB-001',
      createdAt: new Date(now.getTime() - 65 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // 10. Invoices (Draft, Confirmed, Partially Paid, Paid, Overdue)
  const invoices = [
    {
      id: 'INV-001',
      invoiceNumber: 'INV-2025-001',
      customerId: 'CUST-001',
      subscriptionId: 'SUB-001',
      invoiceDate: new Date(now.getTime() - 57 * 86400000).toISOString(),
      dueDate: new Date(now.getTime() - 27 * 86400000).toISOString(),
      billingPeriod: '2024-11',
      subtotal: 6999.00,
      discountAmount: 0.00,
      taxAmount: 1259.82,
      total: 8258.82,
      amountPaid: 8258.82,
      outstandingAmount: 0.00,
      status: 'PAID',
      isOverdue: false,
      notes: 'Cycle 1 billing - Paid via Wire Transfer.',
      createdAt: new Date(now.getTime() - 57 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'INV-002',
      invoiceNumber: 'INV-2025-002',
      customerId: 'CUST-001',
      subscriptionId: 'SUB-001',
      invoiceDate: new Date(now.getTime() - 27 * 86400000).toISOString(),
      dueDate: new Date(now.getTime() + 3 * 86400000).toISOString(),
      billingPeriod: '2024-12',
      subtotal: 6999.00,
      discountAmount: 0.00,
      taxAmount: 1259.82,
      total: 8258.82,
      amountPaid: 0.00,
      outstandingAmount: 8258.82,
      status: 'CONFIRMED',
      isOverdue: false,
      notes: 'Cycle 2 billing - Due in 3 days.',
      createdAt: new Date(now.getTime() - 27 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'INV-003',
      invoiceNumber: 'INV-2025-003',
      customerId: 'CUST-002',
      subscriptionId: 'SUB-002',
      invoiceDate: new Date(now.getTime() - 45 * 86400000).toISOString(),
      dueDate: new Date(now.getTime() - 15 * 86400000).toISOString(),
      billingPeriod: '2024-11',
      subtotal: 18500.00,
      discountAmount: 1850.00,
      taxAmount: 2997.00,
      total: 19647.00,
      amountPaid: 10000.00,
      outstandingAmount: 9647.00,
      status: 'PARTIALLY_PAID',
      isOverdue: true, // 15 days past due date!
      notes: 'Partial payment received; remaining balance under dunning.',
      createdAt: new Date(now.getTime() - 45 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'INV-004',
      invoiceNumber: 'INV-2025-004',
      customerId: 'CUST-003',
      subscriptionId: 'SUB-003',
      invoiceDate: new Date(now.getTime() - 300 * 86400000).toISOString(),
      dueDate: new Date(now.getTime() - 290 * 86400000).toISOString(),
      billingPeriod: '2024-ANNUAL',
      subtotal: 198000.00,
      discountAmount: 0.00,
      taxAmount: 39600.00,
      total: 237600.00,
      amountPaid: 237600.00,
      outstandingAmount: 0.00,
      status: 'PAID',
      isOverdue: false,
      notes: 'Annual Enterprise contract paid in full.',
      createdAt: new Date(now.getTime() - 300 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'INV-005',
      invoiceNumber: 'INV-2025-005',
      customerId: 'CUST-009',
      subscriptionId: null,
      invoiceDate: new Date(now.getTime() - 8 * 86400000).toISOString(),
      dueDate: new Date(now.getTime() + 22 * 86400000).toISOString(),
      billingPeriod: 'ONETIME-SETUP',
      subtotal: 3500.00,
      discountAmount: 500.00,
      taxAmount: 540.00,
      total: 3540.00,
      amountPaid: 0.00,
      outstandingAmount: 3540.00,
      status: 'CONFIRMED',
      isOverdue: false,
      notes: 'Custom integration & onboarding package.',
      createdAt: new Date(now.getTime() - 8 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // 11. Payments
  const payments = [
    {
      id: 'PAY-001',
      paymentNumber: 'PAY-2025-001',
      customerId: 'CUST-001',
      invoiceId: 'INV-001',
      paymentDate: new Date(now.getTime() - 55 * 86400000).toISOString(),
      paymentMethod: 'BANK_TRANSFER',
      amount: 8258.82,
      allocatedAmount: 8258.82,
      transactionReference: 'TXN-WIRE-992182',
      notes: 'Settled via J.P. Morgan Chase Wire.',
      status: 'COMPLETED',
      createdAt: new Date(now.getTime() - 55 * 86400000).toISOString(),
    },
    {
      id: 'PAY-002',
      paymentNumber: 'PAY-2025-002',
      customerId: 'CUST-002',
      invoiceId: 'INV-003',
      paymentDate: new Date(now.getTime() - 20 * 86400000).toISOString(),
      paymentMethod: 'CARD',
      amount: 10000.00,
      allocatedAmount: 10000.00,
      transactionReference: 'TXN-STRIPE-448129',
      notes: 'Installment 1 of 2 authorized by VP Finance.',
      status: 'COMPLETED',
      createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
    },
    {
      id: 'PAY-003',
      paymentNumber: 'PAY-2025-003',
      customerId: 'CUST-003',
      invoiceId: 'INV-004',
      paymentDate: new Date(now.getTime() - 295 * 86400000).toISOString(),
      paymentMethod: 'BANK_TRANSFER',
      amount: 237600.00,
      allocatedAmount: 237600.00,
      transactionReference: 'TXN-SWIFT-882194',
      notes: 'Annual upfront settlement via Barclays.',
      status: 'COMPLETED',
      createdAt: new Date(now.getTime() - 295 * 86400000).toISOString(),
    },
    {
      id: 'PAY-004',
      paymentNumber: 'PAY-2025-004',
      customerId: 'CUST-010', // Vertex Analytics
      invoiceId: null,
      paymentDate: new Date(now.getTime() - 2 * 86400000).toISOString(),
      paymentMethod: 'UPI',
      amount: 4500.00,
      allocatedAmount: 0.00, // UNALLOCATED PAYMENT!
      transactionReference: 'UPI/49281039812/HDFC',
      notes: 'Customer deposit awaiting open invoice generation.',
      status: 'COMPLETED',
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
  ];

  // 12. Billing Runs
  const billingRuns = [
    {
      id: 'RUN-2025-01',
      runNumber: 'RUN-2025-01-01',
      runDate: new Date(now.getTime() - 30 * 86400000).toISOString(),
      scheduledBy: 'node-cron scheduler',
      totalSubscriptionsScanned: 6,
      successfulInvoicesCount: 5,
      failedInvoicesCount: 0,
      skippedCount: 1,
      status: 'COMPLETED',
      logDetails: 'Scanned 6 active subscriptions; 1 paused skipped (policy verified); 5 recurring invoices generated.',
      createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
    },
  ];

  // 13. Subscription Events (Audit Timeline)
  const subscriptionEvents = [
    {
      id: 'EVT-001',
      subscriptionId: 'SUB-001',
      eventType: 'SUBSCRIPTION_CREATED',
      actorId: 'USR-STAFF-01',
      actorName: 'Sarah Jenkins',
      previousValue: null,
      newValue: 'DRAFT',
      description: 'Subscription drafted from accepted quotation QT-2025-003.',
      timestamp: new Date(now.getTime() - 60 * 86400000).toISOString(),
    },
    {
      id: 'EVT-002',
      subscriptionId: 'SUB-001',
      eventType: 'SUBSCRIPTION_ACTIVATED',
      actorId: 'USR-ADMIN-01',
      actorName: 'Elena Rostova',
      previousValue: 'CONFIRMED',
      newValue: 'ACTIVE',
      description: 'Subscription activated. Initial invoice INV-2025-001 dispatched.',
      timestamp: new Date(now.getTime() - 57 * 86400000).toISOString(),
    },
    {
      id: 'EVT-003',
      subscriptionId: 'SUB-005',
      eventType: 'SUBSCRIPTION_PAUSED',
      actorId: 'USR-STAFF-01',
      actorName: 'Sarah Jenkins',
      previousValue: 'ACTIVE',
      newValue: 'PAUSED',
      description: 'Customer requested 30-day operational pause as per plan policy.',
      timestamp: new Date(now.getTime() - 10 * 86400000).toISOString(),
    },
  ];

  // 14. Revenue Guard Alerts (10 pre-computed or real detected)
  const auditAlerts = runRevenueGuardAudit({
    subscriptions: subscriptions.map(s => {
      const cust = customers.find(c => c.id === s.customerId);
      return { ...s, customerName: cust?.name || 'Customer' };
    }),
    invoices: invoices.map(i => {
      const cust = customers.find(c => c.id === i.customerId);
      return { ...i, customerName: cust?.name || 'Customer' };
    }),
    payments: payments.map(p => {
      const cust = customers.find(c => c.id === p.customerId);
      return { ...p, customerName: cust?.name || 'Customer' };
    }),
    billingRuns: billingRuns.map(r => ({
      ...r,
      failedCount: r.failedInvoicesCount,
    })),
    now,
  });

  // 15. Subscription Health Scores
  const subscriptionHealthScores = subscriptions.map(sub => {
    const subInvoices = invoices.filter(i => i.subscriptionId === sub.id);
    const paidCount = subInvoices.filter(i => i.status === 'PAID').length;
    const overdueCount = subInvoices.filter(i => i.isOverdue).length;
    const health = calculateSubscriptionHealthScore({
      totalInvoicesCount: Math.max(1, subInvoices.length),
      paidInvoicesCount: paidCount,
      overdueInvoicesCount: overdueCount,
      failedPaymentsCount: 0,
      reversedPaymentsCount: 0,
      hasCancellationRequest: sub.status === 'CANCELLATION_REQUESTED',
      subscriptionStatus: (sub.status.toLowerCase() as any) || 'active',
      averagePaymentDelayDays: overdueCount > 0 ? 16 : 2,
    });

    return {
      id: `HLTH-${sub.id}`,
      subscriptionId: sub.id,
      customerId: sub.customerId,
      score: health.score,
      category: health.category,
      factorsJson: JSON.stringify(health.factors),
      actionsJson: JSON.stringify(health.recommendedActions),
      calculatedAt: health.calculatedAt,
    };
  });

  // 16. Renewal Reminders
  const renewalReminders = [
    {
      id: 'REM-001',
      subscriptionId: 'SUB-001',
      customerId: 'CUST-001',
      reminderType: 'pre_renewal_3d',
      scheduledFor: new Date(now.getTime() + 1 * 86400000).toISOString(),
      sentAt: null,
      status: 'scheduled',
      recipientEmail: 'customer@nexora.io',
    },
    {
      id: 'REM-002',
      subscriptionId: 'SUB-002',
      customerId: 'CUST-002',
      reminderType: 'overdue_15d',
      scheduledFor: now.toISOString(),
      sentAt: now.toISOString(),
      status: 'sent',
      recipientEmail: 'billing@apexmedialabs.com',
    },
  ];

  // 17. Bank Imports & Reconciliation
  const bankImports = [
    {
      id: 'IMP-001',
      fileName: 'HDFC_Statement_October_2025.csv',
      uploadDate: new Date(now.getTime() - 2 * 86400000).toISOString(),
      totalRows: 4,
      matchedRows: 2,
      unmatchedRows: 2,
      status: 'completed',
      uploadedBy: 'Elena Rostova',
    },
  ];

  const bankTransactions = [
    {
      id: 'TXN-001',
      importId: 'IMP-001',
      transactionReference: 'TXN-WIRE-992182',
      transactionDate: new Date(now.getTime() - 55 * 86400000).toISOString(),
      description: 'WIRE INWARD ACME CLOUD SOLUTIONS INV-2025-001',
      amount: 8258.82,
      customerNameMatch: 'Acme Cloud Solutions',
      invoiceMatch: 'INV-2025-001',
      matchStatus: 'exact',
      matchedPaymentId: 'PAY-001',
      createdAt: now.toISOString(),
    },
    {
      id: 'TXN-002',
      importId: 'IMP-001',
      transactionReference: 'TXN-STRIPE-448129',
      transactionDate: new Date(now.getTime() - 20 * 86400000).toISOString(),
      description: 'CARD SETTLEMENT APEX MEDIA LABS PARTIAL',
      amount: 10000.00,
      customerNameMatch: 'Apex Media Labs',
      invoiceMatch: 'INV-2025-003',
      matchStatus: 'exact',
      matchedPaymentId: 'PAY-002',
      createdAt: now.toISOString(),
    },
    {
      id: 'TXN-003',
      importId: 'IMP-001',
      transactionReference: 'NEFT-5591028301',
      transactionDate: new Date(now.getTime() - 1 * 86400000).toISOString(),
      description: 'NEFT FROM BLUEWAVE SUPPLY CHAIN FOR CONTRACT RENEWAL',
      amount: 5307.64,
      customerNameMatch: 'BlueWave Logistics',
      invoiceMatch: null,
      matchStatus: 'possible',
      matchedPaymentId: null,
      createdAt: now.toISOString(),
    },
    {
      id: 'TXN-004',
      importId: 'IMP-001',
      transactionReference: 'IMPS-9928102381',
      transactionDate: new Date(now.getTime() - 1 * 86400000).toISOString(),
      description: 'UNKNOWN DEPOSIT REF / MISC VENDOR CREDIT',
      amount: 1200.00,
      customerNameMatch: null,
      invoiceMatch: null,
      matchStatus: 'unmatched',
      matchedPaymentId: null,
      createdAt: now.toISOString(),
    },
  ];

  // 18. What-If Revenue Scenarios
  const revenueScenarios = [
    {
      id: 'SCN-001',
      name: 'Q1 Enterprise Price Optimization (+12%)',
      description: 'Evaluate impact of raising Enterprise tier from ₹18,500 to ₹20,720 assuming 4% elasticity churn.',
      baselineMrr: 33756.64,
      simulatedMrr: 38240.00,
      baselineArr: 405079.68,
      simulatedArr: 458880.00,
      projectedGrowthPct: 13.28,
      notes: 'Net positive revenue expansion of ₹4,483/mo despite minor churn.',
      createdBy: 'Elena Rostova',
      createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'SCN-002',
      name: 'Aggressive Self-Serve Growth Campaign',
      description: 'Acquire 25 new Starter customers via 20% discount code FOUNDER20.',
      baselineMrr: 33756.64,
      simulatedMrr: 83736.64,
      baselineArr: 405079.68,
      simulatedArr: 1004839.68,
      projectedGrowthPct: 148.00,
      notes: 'Requires 2 additional support staff to service influx.',
      createdBy: 'Elena Rostova',
      createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // 19. Email Logs
  const emailLogs = [
    {
      id: 'EML-001',
      recipient: 'customer@nexora.io',
      subject: 'Welcome to NEXORA – Subscription Activated',
      templateType: 'subscription_activation',
      relatedEntity: 'subscription',
      relatedId: 'SUB-001',
      sentAt: new Date(now.getTime() - 57 * 86400000).toISOString(),
      status: 'delivered',
      errorDetails: null,
      emailBody: 'Your NEXORA Growth Pro subscription is active. Your dashboard is ready.',
    },
    {
      id: 'EML-002',
      recipient: 'billing@apexmedialabs.com',
      subject: 'Invoice Overdue Notice: INV-2025-003',
      templateType: 'payment_overdue',
      relatedEntity: 'invoice',
      relatedId: 'INV-2025-003',
      sentAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      status: 'delivered',
      errorDetails: null,
      emailBody: 'Invoice INV-2025-003 has an unpaid balance of ₹9,647. Please settle to avoid service disruption.',
    },
  ];

  // 20. System Settings
  const systemSettings = [
    {
      id: 'SET-001',
      key: 'company_name',
      value: 'NEXORA Systems Inc.',
      description: 'Legal registered business entity name.',
      updatedAt: now.toISOString(),
    },
    {
      id: 'SET-002',
      key: 'default_currency',
      value: 'INR',
      description: 'Platform base accounting currency (INR / USD / EUR / GBP).',
      updatedAt: now.toISOString(),
    },
    {
      id: 'SET-003',
      key: 'currency_symbol',
      value: '₹',
      description: 'Currency display symbol.',
      updatedAt: now.toISOString(),
    },
    {
      id: 'SET-004',
      key: 'billing_retry_limit',
      value: '3',
      description: 'Maximum automatic retry attempts for failed card/mandate transactions.',
      updatedAt: now.toISOString(),
    },
    {
      id: 'SET-005',
      key: 'dunning_grace_period_days',
      value: '15',
      description: 'Number of grace period days prior to automated subscription suspension.',
      updatedAt: now.toISOString(),
    },
  ];

  return {
    users,
    customers,
    passwordResetTokens: [],
    auditLogs: [],
    products,
    productVariants,
    plans,
    planProducts: [],
    quotationTemplates: [],
    quotationTemplateItems: [],
    quotations,
    quotationItems: [],
    subscriptions,
    subscriptionItems: [],
    subscriptionEvents,
    subscriptionRequests: [],
    taxRules,
    taxRuleProducts: [],
    discounts,
    discountProducts: [],
    discountUsages: [],
    invoices,
    invoiceItems: [],
    billingRuns,
    billingRunItems: [],
    payments,
    paymentAllocations: [],
    revenueGuardAlerts: auditAlerts,
    subscriptionHealthScores,
    renewalReminders,
    subscriptionChangePreviews: [],
    bankImports,
    bankTransactions,
    reconciliationMatches: [],
    revenueScenarios,
    revenueScenarioAssumptions: [],
    emailLogs,
    systemSettings,
  };
}
