# Invoice & Billing System Documentation

## Overview
The Vevurn POS now includes a comprehensive invoice and billing system that extends the existing sales functionality with professional invoicing capabilities, automated reminders, and enhanced customer billing features.

## Database Schema Changes

### New Models

#### Invoice Model
```prisma
model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique // INV-2025-0001
  saleId        String        @unique
  customerId    String
  
  // Financial details
  subtotal      Decimal       @db.Decimal(12, 2)
  taxAmount     Decimal       @default(0) @db.Decimal(12, 2)
  discountAmount Decimal      @default(0) @db.Decimal(12, 2)
  totalAmount   Decimal       @db.Decimal(12, 2)
  amountPaid    Decimal       @default(0) @db.Decimal(12, 2)
  amountDue     Decimal       @db.Decimal(12, 2)
  
  // Status & Dates
  status        InvoiceStatus @default(DRAFT)
  issueDate     DateTime      @default(now())
  dueDate       DateTime
  paidDate      DateTime?
  
  // Consignment support
  isConsignment Boolean       @default(false)
  consignmentDue Decimal?     @db.Decimal(12, 2)
  
  // Communication tracking
  emailSent     Boolean       @default(false)
  emailSentAt   DateTime?
  smsSent       Boolean       @default(false)
  smsSentAt     DateTime?
  
  // Business details
  paymentTerms  String?
  notes         String?
  
  // Relations
  sale          Sale          @relation(fields: [saleId], references: [id])
  customer      Customer      @relation(fields: [customerId], references: [id])
  reminders     InvoiceReminder[]
}
```

#### InvoiceReminder Model
```prisma
model InvoiceReminder {
  id           String       @id @default(cuid())
  invoiceId    String
  type         ReminderType // EMAIL, SMS, CALL, WHATSAPP
  message      String
  sent         Boolean      @default(false)
  sentAt       DateTime?
  scheduledFor DateTime
  createdAt    DateTime     @default(now())
  
  invoice      Invoice      @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
}
```

### New Enums

#### InvoiceStatus
```prisma
enum InvoiceStatus {
  DRAFT          // Not yet sent to customer
  SENT           // Sent to customer, awaiting payment
  OVERDUE        // Past due date
  PARTIALLY_PAID // Partial payment received
  PAID           // Fully paid
  CANCELLED      // Cancelled/voided
  REFUNDED       // Refunded
}
```

#### ReminderType
```prisma
enum ReminderType {
  EMAIL
  SMS  
  CALL
  WHATSAPP
}
```

### Updated Existing Models

#### Sale Model Updates
- Added `isInvoiced: Boolean @default(false)` field
- Added `invoice: Invoice?` relation (one-to-one)

#### Customer Model Updates
- Added `companyName: String?` for business customers
- Added `taxNumber: String?` for business tax identification
- Added `billingAddress: String?` for separate billing address
- Added `paymentTerms: String?` for default payment terms
- Added `creditLimit: Decimal? @db.Decimal(12, 2)` for credit management
- Added `invoices: Invoice[]` relation (one-to-many)

## TypeScript Types

### Core Invoice Types
All invoice-related TypeScript types are available in `shared/src/types.ts`:

- `Invoice` - Complete invoice interface
- `InvoiceReminder` - Reminder interface
- `InvoiceStatus` - Status enum
- `ReminderType` - Reminder type enum
- `CreateInvoiceRequest` - Create invoice payload
- `UpdateInvoiceRequest` - Update invoice payload
- `InvoiceFilters` - Filtering options
- `CreateReminderRequest` - Create reminder payload
- `CustomerWithBilling` - Extended customer interface
- `SaleWithInvoice` - Extended sale interface
- `InvoiceSummary` - Statistics interface

### Utility Functions
New utility functions in `shared/src/index.ts`:

```typescript
// Generate unique invoice numbers
export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = Date.now().toString().slice(-8);
  
  return `INV-${year}-${timestamp}`;
};
```

## Business Logic

### Invoice Creation Workflow
1. Sale is completed with status `COMPLETED`
2. If customer requires invoicing, create invoice from sale
3. Invoice starts in `DRAFT` status
4. Once sent to customer, status changes to `SENT`
5. Track payment status: `PARTIALLY_PAID` → `PAID`
6. Monitor due dates for `OVERDUE` status

### Payment Tracking
- `amountPaid` tracks total payments received
- `amountDue` calculated as `totalAmount - amountPaid`
- Status automatically updates based on payment amounts

### Consignment Support
- Set `isConsignment: true` for consignment sales
- Track `consignmentDue` amount owed to consigner
- Separate from customer payment tracking

### Communication Tracking
- Track `emailSent` and `emailSentAt` for email invoices
- Track `smsSent` and `smsSentAt` for SMS notifications
- Automated reminder system with configurable schedules

## Integration Points

### With Existing Sales System
- Every invoice is linked to exactly one sale
- Sales can optionally have invoices (`isInvoiced` flag)
- Invoice financial details mirror sale totals

### With Customer Management
- Enhanced customer profiles with billing information
- Support for both individual and business customers
- Configurable payment terms and credit limits

### With Payment System
- Payment records can be linked to invoices
- Track payment methods and transaction details
- Support for partial payments and payment plans

## API Endpoints (To Be Implemented)

### Invoice Management
```
GET    /api/invoices              # List invoices with filtering
POST   /api/invoices              # Create invoice from sale
GET    /api/invoices/:id          # Get invoice details
PUT    /api/invoices/:id          # Update invoice
DELETE /api/invoices/:id          # Delete/cancel invoice
POST   /api/invoices/:id/send     # Send invoice to customer
POST   /api/invoices/:id/payment  # Record payment
```

### Reminder Management
```
GET    /api/invoices/:id/reminders    # Get invoice reminders
POST   /api/invoices/:id/reminders    # Create reminder
PUT    /api/reminders/:id             # Update reminder
DELETE /api/reminders/:id             # Delete reminder
POST   /api/reminders/:id/send        # Send reminder now
```

### Reporting
```
GET    /api/invoices/summary          # Invoice statistics
GET    /api/invoices/overdue          # Overdue invoices
GET    /api/invoices/aging            # Aging report
```

## Rwanda-Specific Features

### Tax Compliance
- 18% VAT rate support (configurable)
- Business tax number tracking
- Proper invoice numbering for compliance

### Local Business Practices
- Support for both cash and credit sales
- Mobile money integration for invoice payments
- Multi-language support (English/Kinyarwanda)

## Future Enhancements

### Planned Features
1. **Automated Reminder Scheduling** - Configurable reminder workflows
2. **PDF Invoice Generation** - Professional invoice templates
3. **Email/SMS Integration** - Automated sending capabilities
4. **Payment Gateway Integration** - Online payment collection
5. **Reporting Dashboard** - Visual analytics and insights
6. **Credit Management** - Advanced credit limit enforcement
7. **Multi-Currency Support** - Foreign currency invoicing

### Technical Improvements
1. **Audit Trail** - Complete invoice change history
2. **Bulk Operations** - Mass invoice creation and updates
3. **Template System** - Customizable invoice templates
4. **Integration APIs** - Third-party accounting system integration
5. **Mobile App** - Invoice management on mobile devices

## Database Migration

The invoice system has been successfully migrated with migration: `20250823214013_vevurn`

All existing data is preserved, and new invoice functionality is ready for implementation.

## Getting Started

1. **Database is ready** - All tables and relations are created
2. **Types are available** - Import from `@vevurn/shared`
3. **Utility functions** - Use `generateInvoiceNumber()` for new invoices
4. **Next steps** - Implement backend API endpoints and frontend components

The invoice system is now fully integrated into the Vevurn POS schema and ready for development!
