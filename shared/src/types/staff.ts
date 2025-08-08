// Staff and employee types
import { UserRole } from '../constants'

export interface Staff {
  id: string
  employeeId: string
  clerkUserId?: string // Link to Clerk authentication
  
  // Personal information
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: Date
  nationalId?: string
  
  // Employment details
  role: UserRole
  department: Department
  position: string
  hireDate: Date
  
  // Work schedule
  workSchedule: WorkSchedule
  hourlyRate?: number
  salary?: number
  
  // Address
  address?: StaffAddress
  
  // Performance tracking
  totalSales: number
  totalCustomers: number
  performanceRating?: number
  
  // Status
  isActive: boolean
  terminationDate?: Date
  terminationReason?: string
  
  // Photos and documents
  photoUrl?: string
  documentUrls: string[]
  
  // Audit
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface StaffAddress {
  street?: string
  city?: string
  district?: string
  province?: string
  country: string
  postalCode?: string
}

export enum Department {
  SALES = 'SALES',
  INVENTORY = 'INVENTORY',
  ADMINISTRATION = 'ADMINISTRATION',
  MANAGEMENT = 'MANAGEMENT'
}

export interface WorkSchedule {
  monday?: WorkDay
  tuesday?: WorkDay
  wednesday?: WorkDay
  thursday?: WorkDay
  friday?: WorkDay
  saturday?: WorkDay
  sunday?: WorkDay
}

export interface WorkDay {
  startTime: string // HH:MM format
  endTime: string
  breakStart?: string
  breakEnd?: string
}

// Staff performance tracking
export interface StaffPerformance {
  id: string
  staffId: string
  staff?: Staff
  period: PerformancePeriod
  
  // Sales metrics
  totalSales: number
  salesCount: number
  averageSaleValue: number
  
  // Customer metrics
  customersServed: number
  customerSatisfaction?: number
  
  // Productivity metrics
  hoursWorked: number
  productivityScore: number
  
  // Goals and targets
  salesTarget?: number
  salesTargetAchieved: boolean
  
  // Rating
  overallRating: number // 1-5 scale
  managerNotes?: string
  
  // Period
  startDate: Date
  endDate: Date
  
  // Audit
  createdAt: Date
  evaluatedBy: string
}

export interface PerformancePeriod {
  type: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  year: number
  period: number // Week, month, quarter number
}

export interface StaffAttendance {
  id: string
  staffId: string
  staff?: Staff
  
  // Attendance details
  date: Date
  clockIn?: Date
  clockOut?: Date
  hoursWorked?: number
  
  // Break times
  breakStart?: Date
  breakEnd?: Date
  breakDuration?: number
  
  // Status
  status: AttendanceStatus
  
  // Notes
  notes?: string
  approvedBy?: string
  
  // Audit
  createdAt: Date
  updatedAt: Date
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  SICK_LEAVE = 'SICK_LEAVE',
  VACATION = 'VACATION',
  PERSONAL_LEAVE = 'PERSONAL_LEAVE'
}
