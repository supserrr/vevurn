// Utility functions for formatting data
import { Currency, CURRENCY_SYMBOLS } from '../constants'

export function formatCurrency(amount: number, currency: Currency = Currency.RWF): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  
  // Format based on currency
  switch (currency) {
    case Currency.RWF:
      return `${symbol} ${amount.toLocaleString('en-RW')}`
    case Currency.USD:
      return `${symbol}${amount.toFixed(2)}`
    case Currency.EUR:
      return `${symbol}${amount.toFixed(2)}`
    default:
      return `${symbol} ${amount.toLocaleString()}`
  }
}

export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatPhoneNumber(phone: string): string {
  // Format Rwandan phone numbers
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('25')) {
    // International format: +250 XXX XXX XXX
    const match = cleaned.match(/^(250)(\d{3})(\d{3})(\d{3})$/)
    if (match) {
      return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`
    }
  } else if (cleaned.startsWith('0')) {
    // Local format: 0XXX XXX XXX
    const match = cleaned.match(/^(0)(\d{3})(\d{3})(\d{3})$/)
    if (match) {
      return `${match[1]}${match[2]} ${match[3]} ${match[4]}`
    }
  }
  
  return phone // Return original if no pattern matches
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function capitalizeWords(str: string): string {
  return str.replace(/\w\S*/g, capitalizeFirst)
}
