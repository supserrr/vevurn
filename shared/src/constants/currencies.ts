// Currency constants and utilities
export enum Currency {
  RWF = 'RWF',
  USD = 'USD',
  EUR = 'EUR'
}

export const CURRENCY_SYMBOLS = {
  [Currency.RWF]: 'FRw',
  [Currency.USD]: '$',
  [Currency.EUR]: '€'
} as const

export const CURRENCY_NAMES = {
  [Currency.RWF]: 'Rwandan Franc',
  [Currency.USD]: 'US Dollar', 
  [Currency.EUR]: 'Euro'
} as const

export const DEFAULT_CURRENCY = Currency.RWF
