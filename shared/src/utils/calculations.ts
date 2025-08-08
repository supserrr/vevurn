// Business calculation utilities

export function calculateProfitMargin(costPrice: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0
  return ((sellingPrice - costPrice) / sellingPrice) * 100
}

export function calculateMarkupPercentage(costPrice: number, sellingPrice: number): number {
  if (costPrice === 0) return 0
  return ((sellingPrice - costPrice) / costPrice) * 100
}

export function calculateBreakevenPoint(fixedCosts: number, variableCostPerUnit: number, pricePerUnit: number): number {
  const contributionMargin = pricePerUnit - variableCostPerUnit
  if (contributionMargin <= 0) return Infinity
  return Math.ceil(fixedCosts / contributionMargin)
}

export function calculateInventoryTurnover(costOfGoodsSold: number, averageInventory: number): number {
  if (averageInventory === 0) return 0
  return costOfGoodsSold / averageInventory
}

export function calculateCustomerLifetimeValue(
  averageOrderValue: number,
  purchaseFrequency: number,
  customerLifespan: number
): number {
  return averageOrderValue * purchaseFrequency * customerLifespan
}

export function calculateROI(gain: number, cost: number): number {
  if (cost === 0) return 0
  return ((gain - cost) / cost) * 100
}

export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  compoundingFrequency: number = 1
): number {
  return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * time)
}

export function calculateSimpleInterest(principal: number, rate: number, time: number): number {
  return principal * rate * time
}

export function calculateLoanPayment(principal: number, annualRate: number, termInYears: number): number {
  const monthlyRate = annualRate / 12
  const numberOfPayments = termInYears * 12
  
  if (monthlyRate === 0) return principal / numberOfPayments
  
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  )
}

export function calculateInventoryValue(items: Array<{ quantity: number; unitCost: number }>): number {
  return items.reduce((total, item) => total + item.quantity * item.unitCost, 0)
}

export function calculateReorderPoint(
  averageDailyUsage: number,
  leadTimeDays: number,
  safetyStock: number = 0
): number {
  return averageDailyUsage * leadTimeDays + safetyStock
}

export function calculateEconomicOrderQuantity(
  annualDemand: number,
  orderingCost: number,
  holdingCost: number
): number {
  return Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)
}

export function calculateDaysInInventory(averageInventory: number, costOfGoodsSold: number): number {
  if (costOfGoodsSold === 0) return 0
  return (averageInventory / costOfGoodsSold) * 365
}

export function calculateGrossMargin(revenue: number, costOfGoodsSold: number): number {
  if (revenue === 0) return 0
  return ((revenue - costOfGoodsSold) / revenue) * 100
}
