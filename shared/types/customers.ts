// Customer Types (already defined in sales.ts but extracted here for reuse)
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastPurchase?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  sales?: any[]; // Sale type from sales to avoid circular dependency
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  notes?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  loyaltyPoints?: number;
  isActive?: boolean;
}

export interface CustomerSearchFilters {
  hasEmail?: boolean;
  hasPhone?: boolean;
  city?: string;
  loyaltyPointsRange?: {
    min: number;
    max: number;
  };
  totalSpentRange?: {
    min: number;
    max: number;
  };
  lastPurchaseRange?: {
    startDate: string;
    endDate: string;
  };
  isActive?: boolean;
}

// Loyalty Program Types
export interface LoyaltyProgram {
  id: string;
  name: string;
  description?: string;
  pointsPerRwf: number; // Points earned per RWF spent
  minimumSpend: number;
  isActive: boolean;
  rules: LoyaltyRule[];
  tiers: LoyaltyTier[];
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyRule {
  id: string;
  type: LoyaltyRuleType;
  condition: LoyaltyCondition;
  reward: LoyaltyReward;
  isActive: boolean;
}

export enum LoyaltyRuleType {
  PURCHASE_AMOUNT = 'PURCHASE_AMOUNT',
  PURCHASE_FREQUENCY = 'PURCHASE_FREQUENCY',
  PRODUCT_CATEGORY = 'PRODUCT_CATEGORY',
  BIRTHDAY_BONUS = 'BIRTHDAY_BONUS',
  REFERRAL = 'REFERRAL',
}

export interface LoyaltyCondition {
  minAmount?: number;
  categoryId?: string;
  frequency?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface LoyaltyReward {
  type: 'points' | 'discount' | 'free_item';
  value: number;
  productId?: string;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minimumPoints: number;
  benefits: LoyaltyBenefit[];
  color: string;
  icon?: string;
}

export interface LoyaltyBenefit {
  type: 'discount_percentage' | 'discount_amount' | 'free_shipping' | 'priority_support';
  value?: number;
  description: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: LoyaltyTransactionType;
  points: number;
  description: string;
  reference?: string;
  saleId?: string;
  expiresAt?: string;
  createdAt: string;
  
  // Relations
  customer?: Customer;
}

export enum LoyaltyTransactionType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  ADJUSTED = 'ADJUSTED',
  BONUS = 'BONUS',
}

// Customer Analytics Types
export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  averageLifetimeValue: number;
  averageLoyaltyPoints: number;
  topCustomers: TopCustomer[];
  customerSegments: CustomerSegment[];
  retentionRate: number;
}

export interface TopCustomer {
  customer: Customer;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
}

export interface CustomerSegment {
  name: string;
  description: string;
  count: number;
  percentage: number;
  averageSpend: number;
  criteria: SegmentCriteria;
}

export interface SegmentCriteria {
  minTotalSpent?: number;
  maxTotalSpent?: number;
  minLoyaltyPoints?: number;
  maxLoyaltyPoints?: number;
  recencyDays?: number;
  purchaseFrequency?: 'high' | 'medium' | 'low';
}
