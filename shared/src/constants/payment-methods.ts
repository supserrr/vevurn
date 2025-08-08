// Payment method constants
export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER', 
  CREDIT_CARD = 'CREDIT_CARD',
  STORE_CREDIT = 'STORE_CREDIT'
}

export const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.MOBILE_MONEY]: 'Mobile Money',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.CREDIT_CARD]: 'Credit Card',
  [PaymentMethod.STORE_CREDIT]: 'Store Credit'
} as const

export const MOBILE_MONEY_PROVIDERS = {
  MTN: 'MTN',
  AIRTEL: 'AIRTEL',
  TIGO: 'TIGO'
} as const
