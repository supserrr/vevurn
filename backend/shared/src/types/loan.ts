// Loan management types
import { Currency } from '../constants'
import { Customer } from './customer'
import { User } from './auth'

export interface Loan {
  id: string
  loanNumber: string
  
  // Customer
  customerId: string
  customer?: Customer
  
  // Loan details
  principal: number
  interestRate: number // Annual percentage
  duration: number // In days
  currency: Currency
  
  // Calculated amounts
  totalAmount: number
  totalInterest: number
  dailyInterest: number
  
  // Payment tracking
  amountPaid: number
  remainingBalance: number
  
  // Dates
  disbursementDate: Date
  dueDate: Date
  
  // Status
  status: LoanStatus
  
  // Collateral/guarantee
  collateralDescription?: string
  guarantorName?: string
  guarantorPhone?: string
  
  // Processing
  approvedBy: string
  approvedByUser?: User
  disbursedBy: string
  disbursedByUser?: User
  
  // Terms and conditions
  termsAccepted: boolean
  termsAcceptedAt?: Date
  
  // Audit
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface LoanPayment {
  id: string
  loanId: string
  loan?: Loan
  
  // Payment details
  amount: number
  currency: Currency
  paymentMethod: string
  paymentReference?: string
  
  // Allocation
  principalAmount: number
  interestAmount: number
  penaltyAmount?: number
  
  // Processing
  receivedBy: string
  receivedByUser?: User
  
  // Receipt
  receiptNumber: string
  receiptUrl?: string
  
  // Audit
  createdAt: Date
  recordedAt: Date
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DISBURSED = 'DISBURSED',
  ACTIVE = 'ACTIVE',
  OVERDUE = 'OVERDUE',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
  CANCELLED = 'CANCELLED'
}

export interface LoanApplication {
  id: string
  applicationNumber: string
  customerId: string
  customer?: Customer
  
  // Requested details
  requestedAmount: number
  requestedDuration: number
  purpose: string
  currency: Currency
  
  // Assessment
  creditScore?: number
  assessmentNotes?: string
  
  // Status
  status: ApplicationStatus
  
  // Processing
  reviewedBy?: string
  reviewedByUser?: User
  
  // Audit
  createdAt: Date
  reviewedAt?: Date
  approvedAt?: Date
  rejectedAt?: Date
  rejectionReason?: string
}

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
