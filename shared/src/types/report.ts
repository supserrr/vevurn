// Reporting and analytics types
import { Currency } from '../constants'
import { StaffPerformance } from './staff'

export interface SalesReport {
  id: string
  title: string
  type: ReportType
  period: ReportPeriod
  
  // Date range
  startDate: Date
  endDate: Date
  
  // Filters applied
  filters: ReportFilters
  
  // Metrics
  totalSales: number
  salesCount: number
  totalRevenue: number
  totalProfit: number
  currency: Currency
  
  // Top performers
  topProducts: ProductPerformance[]
  topCustomers: CustomerPerformance[]
  topStaff: StaffPerformance[]
  
  // Generated details
  generatedAt: Date
  generatedBy: string
  format: ReportFormat
  fileUrl?: string
}

export enum ReportType {
  SALES_SUMMARY = 'SALES_SUMMARY',
  PRODUCT_PERFORMANCE = 'PRODUCT_PERFORMANCE',
  CUSTOMER_ANALYSIS = 'CUSTOMER_ANALYSIS',
  STAFF_PERFORMANCE = 'STAFF_PERFORMANCE',
  INVENTORY_STATUS = 'INVENTORY_STATUS',
  FINANCIAL_SUMMARY = 'FINANCIAL_SUMMARY',
  PROFIT_LOSS = 'PROFIT_LOSS'
}

export enum ReportPeriod {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  THIS_WEEK = 'THIS_WEEK',
  LAST_WEEK = 'LAST_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  THIS_QUARTER = 'THIS_QUARTER',
  LAST_QUARTER = 'LAST_QUARTER',
  THIS_YEAR = 'THIS_YEAR',
  LAST_YEAR = 'LAST_YEAR',
  CUSTOM = 'CUSTOM'
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON'
}

export interface ReportFilters {
  productIds?: string[]
  customerIds?: string[]
  staffIds?: string[]
  categories?: string[]
  paymentMethods?: string[]
  minAmount?: number
  maxAmount?: number
  currency?: Currency
}

export interface ProductPerformance {
  productId: string
  productName: string
  category: string
  quantitySold: number
  revenue: number
  profit: number
  margin: number
}

export interface CustomerPerformance {
  customerId: string
  customerName: string
  totalPurchases: number
  totalAmount: number
  averageOrderValue: number
  lastPurchase: Date
}

// Dashboard metrics
export interface DashboardMetrics {
  // Today's metrics
  todaySales: number
  todayRevenue: number
  todayProfit: number
  todayCustomers: number
  
  // This week's metrics
  weekSales: number
  weekRevenue: number
  weekProfit: number
  weekCustomers: number
  
  // This month's metrics
  monthSales: number
  monthRevenue: number
  monthProfit: number
  monthCustomers: number
  
  // Comparisons (vs previous period)
  salesGrowth: number
  revenueGrowth: number
  profitGrowth: number
  
  // Top performers
  topSellingProduct: ProductPerformance
  topCustomer: CustomerPerformance
  topStaff: StaffPerformance
  
  // Inventory alerts
  lowStockCount: number
  outOfStockCount: number
  
  // Financial health
  totalInventoryValue: number
  cashOnHand: number
  outstandingLoans: number
  
  // Trends (daily values for charts)
  salesTrend: DailyMetric[]
  revenueTrend: DailyMetric[]
  customerTrend: DailyMetric[]
}

export interface DailyMetric {
  date: Date
  value: number
}

// KPI definitions
export interface KPI {
  id: string
  name: string
  description: string
  category: KPICategory
  value: number
  target?: number
  unit: string
  trend: TrendDirection
  changePercentage: number
  updatedAt: Date
}

export enum KPICategory {
  SALES = 'SALES',
  FINANCIAL = 'FINANCIAL',
  INVENTORY = 'INVENTORY',
  CUSTOMER = 'CUSTOMER',
  OPERATIONAL = 'OPERATIONAL'
}

export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  STABLE = 'STABLE'
}
