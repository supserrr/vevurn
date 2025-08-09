// Currency conversion and exchange rate utilities
import { Currency } from '../constants'

// Mock exchange rates - in production, these would come from an API
const EXCHANGE_RATES: Record<Currency, Record<Currency, number>> = {
  [Currency.RWF]: {
    [Currency.RWF]: 1,
    [Currency.USD]: 0.00081, // 1 RWF = 0.00081 USD (approximate)
    [Currency.EUR]: 0.00074  // 1 RWF = 0.00074 EUR (approximate)
  },
  [Currency.USD]: {
    [Currency.RWF]: 1235,    // 1 USD = 1235 RWF (approximate)
    [Currency.USD]: 1,
    [Currency.EUR]: 0.91     // 1 USD = 0.91 EUR (approximate)
  },
  [Currency.EUR]: {
    [Currency.RWF]: 1356,    // 1 EUR = 1356 RWF (approximate)
    [Currency.USD]: 1.10,    // 1 EUR = 1.10 USD (approximate)
    [Currency.EUR]: 1
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount
  
  const rate = EXCHANGE_RATES[fromCurrency]?.[toCurrency]
  if (!rate) {
    throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`)
  }
  
  return amount * rate
}

export function getAllExchangeRates(): Record<Currency, Record<Currency, number>> {
  return EXCHANGE_RATES
}

export function getExchangeRate(from: Currency, to: Currency): number {
  if (from === to) return 1
  
  const rate = EXCHANGE_RATES[from]?.[to]
  if (!rate) {
    throw new Error(`Exchange rate not available for ${from} to ${to}`)
  }
  
  return rate
}

export function calculateMarkup(costPrice: number, sellingPrice: number): number {
  if (costPrice === 0) return 0
  return ((sellingPrice - costPrice) / costPrice) * 100
}

export function calculateMargin(costPrice: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0
  return ((sellingPrice - costPrice) / sellingPrice) * 100
}

export function calculateSellingPrice(costPrice: number, markupPercentage: number): number {
  return costPrice * (1 + markupPercentage / 100)
}

export function calculateTax(amount: number, taxRate: number): number {
  return amount * (taxRate / 100)
}

export function calculateDiscount(originalPrice: number, discountPercentage: number): number {
  return originalPrice * (discountPercentage / 100)
}

export function calculateTotal(
  subtotal: number,
  taxRate: number = 0,
  discountAmount: number = 0
): {
  subtotal: number
  tax: number
  discount: number
  total: number
} {
  const tax = calculateTax(subtotal, taxRate)
  const total = subtotal + tax - discountAmount
  
  return {
    subtotal,
    tax,
    discount: discountAmount,
    total: Math.max(0, total) // Ensure total is not negative
  }
}
