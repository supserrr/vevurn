# Backend Validation Schemas Documentation

This document describes all the Zod validation schemas used throughout the backend API for type-safe request validation in the POS system.

## Overview

The validation schemas provide:
- **Type Safety**: Ensure data integrity at runtime
- **Input Sanitization**: Clean and validate user inputs
- **Error Handling**: Detailed validation error messages
- **Business Logic**: Rwanda-specific validations (phone numbers, business rules)
- **API Consistency**: Standardized validation across endpoints

## Common Schemas (`common.schemas.ts`)

Base validation schemas used across multiple modules.

```typescript
import { 
  idSchema,
  emailSchema,
  phoneSchema,
  decimalSchema,
  positiveIntSchema,
  nonNegativeIntSchema,
  paginationSchema
} from './validators';
```

### Core Types

**ID Schema**
```typescript
idSchema // Validates CUID format IDs
// Example: "clr5j1ql50000356s7d8k2m9x"
```

**Email Schema**
```typescript
emailSchema // Validates and converts to lowercase
// Example: "user@example.com" → "user@example.com"
```

**Phone Schema**
```typescript
phoneSchema // Rwanda phone number validation
// Accepts: "0788123456", "+250788123456", "788123456"
// Validates: Must be valid Rwanda format (+250 7XX XXX XXX or +250 2XX XXX XXX)
```

**Decimal Schema**
```typescript
decimalSchema // Non-negative numbers with up to 2 decimal places
// Accepts: 1500, "1500.50", 0
// Rejects: -100, "abc", "1500.123"
```

**Integer Schemas**
```typescript
positiveIntSchema     // Positive integers only (> 0)
nonNegativeIntSchema  // Zero and positive integers (≥ 0)
// Accepts strings and numbers, converts to integers
```

**Pagination Schema**
```typescript
paginationSchema.parse({ page: "2", limit: "25" })
// Returns: { page: 2, limit: 25 }
// Defaults: page=1, limit=20, max limit=100
```

## Authentication Schemas (`auth.schemas.ts`)

User authentication and profile management validation.

```typescript
import { 
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateProfileSchema
} from './validators';
```

### Login Validation
```typescript
loginSchema.parse({
  email: "user@example.com",
  password: "password123",
  rememberMe: true // optional, defaults to false
});
```

### User Registration
```typescript
registerSchema.parse({
  name: "John Doe",
  email: "john@example.com",
  password: "securePassword123",
  phoneNumber: "0788123456", // optional, Rwanda format
  department: "Sales" // optional
});
```

### Password Change
```typescript
changePasswordSchema.parse({
  currentPassword: "oldPassword",
  newPassword: "newSecurePassword123",
  confirmPassword: "newSecurePassword123" // Must match newPassword
});
```

## Product Schemas (`products.schemas.ts`)

Product management and inventory validation.

```typescript
import { 
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  updateStockSchema
} from './validators';
```

### Product Creation
```typescript
createProductSchema.parse({
  name: "iPhone 15 Pro Case",
  description: "Premium silicone case",
  categoryId: "clr5j1ql50000356s7d8k2m9x",
  
  // Required pricing (validates hierarchy: min ≤ wholesale ≤ retail)
  costPrice: 1500,      // Cost from supplier
  wholesalePrice: 2000, // Wholesale price
  retailPrice: 3000,    // Retail price
  minPrice: 1800,       // Minimum selling price
  
  // Optional inventory
  stockQuantity: 50,     // Current stock (default: 0)
  minStockLevel: 10,     // Low stock alert (default: 0)
  maxStockLevel: 100,    // Maximum stock
  reorderPoint: 15,      // Reorder trigger (default: 0)
  
  // Optional details
  brand: "Apple",
  model: "iPhone 15 Pro",
  color: "Black",
  size: "Standard",
  weight: 50.5,
  dimensions: "15x8x1cm",
  
  // Optional consignment
  isConsignment: false,
  consignmentRate: 0.7, // 70% to supplier if consignment
  tags: ["premium", "apple", "case"]
});
```

**Validation Rules:**
- Price hierarchy enforced: `minPrice ≤ wholesalePrice ≤ retailPrice`
- SKU auto-generated if not provided
- Stock quantities must be non-negative integers

### Product Filtering
```typescript
productFilterSchema.parse({
  categoryId: "clr5j1ql50000356s7d8k2m9x",
  status: "ACTIVE", // ACTIVE, INACTIVE, DISCONTINUED
  minPrice: 1000,
  maxPrice: 5000,
  inStock: true,     // Products with stock > 0
  lowStock: false,   // Products below minStockLevel
  brand: "Apple",
  tags: ["premium", "case"]
});
```

## Customer Schemas (`customers.schemas.ts`)

Customer management validation.

```typescript
import { 
  createCustomerSchema,
  updateCustomerSchema,
  customerFilterSchema
} from './validators';
```

### Customer Creation
```typescript
createCustomerSchema.parse({
  firstName: "Jean Baptiste",
  lastName: "Uwimana", // optional
  email: "jean@example.com", // optional but either email or phone required
  phone: "0788123456", // optional but either email or phone required
  address: "KN 5 Ave, Kigali",
  city: "Kigali",
  dateOfBirth: "1990-05-15T00:00:00Z", // ISO datetime
  gender: "MALE", // MALE, FEMALE, OTHER
  preferredPaymentMethod: "MOBILE_MONEY", // CASH, MOBILE_MONEY, BANK_TRANSFER, CREDIT
  notes: "VIP customer",
  tags: ["vip", "regular"]
});
```

**Validation Rules:**
- Either email or phone number must be provided
- Phone numbers validated for Rwanda format
- Gender and payment method from predefined enums

## Sales Schemas (`sales.schemas.ts`)

Sales transaction validation.

```typescript
import { 
  createSaleSchema,
  createSaleItemSchema,
  saleFilterSchema
} from './validators';
```

### Sale Creation
```typescript
createSaleSchema.parse({
  customerId: "clr5j1ql50000356s7d8k2m9x", // optional for walk-in sales
  items: [
    {
      productId: "clr5j1ql50000356s7d8k2m9y",
      productVariationId: "clr5j1ql50000356s7d8k2m9z", // optional
      quantity: 2,
      unitPrice: 3000,
      discountAmount: 200, // optional, default: 0
      notes: "Customer requested specific color" // optional
    }
  ],
  subtotal: 5800,     // Before tax and discount
  taxAmount: 1044,    // 18% VAT for Rwanda
  discountAmount: 200, // Total discount applied
  totalAmount: 6644,   // Final amount
  notes: "Customer paid cash" // optional
});
```

### Sale Filtering
```typescript
saleFilterSchema.parse({
  customerId: "clr5j1ql50000356s7d8k2m9x",
  cashierId: "clr5j1ql50000356s7d8k2m9a",
  status: "COMPLETED", // DRAFT, COMPLETED, CANCELLED, REFUNDED
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2024-12-31T23:59:59Z",
  minAmount: 1000,
  maxAmount: 100000,
  paymentMethod: "CASH"
});
```

## Payment Schemas (`payments.schemas.ts`)

Payment processing validation including Mobile Money.

```typescript
import { 
  createPaymentSchema,
  momoRequestSchema,
  momoCallbackSchema
} from './validators';
```

### Payment Processing
```typescript
createPaymentSchema.parse({
  saleId: "clr5j1ql50000356s7d8k2m9x", // optional for standalone payments
  amount: 7000,
  method: "MOBILE_MONEY", // CASH, MOBILE_MONEY, BANK_TRANSFER, CREDIT
  transactionId: "TXN123456789", // optional
  referenceNumber: "REF789", // optional
  momoPhoneNumber: "0788123456", // required for MOBILE_MONEY
  bankAccount: "0001234567890", // required for BANK_TRANSFER
  changeGiven: 300, // optional for cash payments
  changeMethod: "CASH", // CASH, MOBILE_MONEY
  notes: "Payment processed successfully"
});
```

**Validation Rules:**
- Mobile Money payments must include phone number
- Bank transfers must include account information
- Phone numbers validated for Rwanda format

### MTN Mobile Money Request
```typescript
momoRequestSchema.parse({
  amount: 5000,
  phoneNumber: "0788123456", // Rwanda format
  externalId: "ORDER123", // optional
  payerMessage: "Payment for phone accessories",
  payeeNote: "Vevurn POS Payment"
});
```

### Mobile Money Callback
```typescript
momoCallbackSchema.parse({
  externalId: "ORDER123",
  amount: "5000",
  currency: "RWF",
  payer: {
    partyIdType: "MSISDN",
    partyId: "250788123456"
  },
  status: "SUCCESSFUL", // PENDING, SUCCESSFUL, FAILED
  reason: { // optional, present on failures
    code: "PAYER_NOT_FOUND",
    message: "Payer not found"
  },
  financialTransactionId: "FT123456789" // optional
});
```

## Inventory Schemas (`inventory.schemas.ts`)

Stock management and inventory tracking.

```typescript
import { 
  inventoryMovementSchema,
  stockAdjustmentSchema,
  transferStockSchema
} from './validators';
```

### Inventory Movement
```typescript
inventoryMovementSchema.parse({
  productId: "clr5j1ql50000356s7d8k2m9x",
  type: "STOCK_IN", // STOCK_IN, STOCK_OUT, ADJUSTMENT, TRANSFER, DAMAGED, EXPIRED
  quantity: 50, // Can be negative for STOCK_OUT
  unitPrice: 1500, // optional
  referenceType: "PURCHASE", // SALE, PURCHASE, ADJUSTMENT, REFUND
  referenceId: "clr5j1ql50000356s7d8k2m9y", // optional
  reason: "New stock delivery",
  notes: "Delivered by supplier on time"
});
```

### Stock Adjustment
```typescript
stockAdjustmentSchema.parse({
  productId: "clr5j1ql50000356s7d8k2m9x",
  newQuantity: 75, // Set absolute quantity
  reason: "Physical count correction",
  notes: "Found extra units during stocktake"
});
```

## User Management Schemas (`users.schemas.ts`)

Staff user management validation.

```typescript
import { 
  createUserSchema,
  updateUserSchema,
  changeUserRoleSchema,
  userFilterSchema
} from './validators';
```

### User Creation
```typescript
createUserSchema.parse({
  name: "Marie Claire Mukamana",
  email: "marie@vevurn.com",
  password: "securePassword123",
  role: "CASHIER", // ADMIN, MANAGER, CASHIER (default: CASHIER)
  phoneNumber: "0788123456", // optional
  department: "Sales", // optional
  salary: 150000 // optional, in RWF
});
```

## Reports Schemas (`reports.schemas.ts`)

Business reporting and analytics validation.

```typescript
import { 
  salesReportSchema,
  inventoryReportSchema,
  profitAnalysisSchema,
  exportSchema
} from './validators';
```

### Sales Report
```typescript
salesReportSchema.parse({
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2024-01-31T23:59:59Z",
  cashierId: "clr5j1ql50000356s7d8k2m9x", // optional
  customerId: "clr5j1ql50000356s7d8k2m9y", // optional
  categoryId: "clr5j1ql50000356s7d8k2m9z", // optional
  groupBy: "day" // day, week, month (default: day)
});
```

### Export Configuration
```typescript
exportSchema.parse({
  format: "excel", // excel, pdf, csv (default: excel)
  reportType: "sales", // sales, inventory, customers, profit
  filters: {
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-01-31T23:59:59Z"
  }
});
```

## Usage Examples

### Middleware Integration
```typescript
import { validateRequest } from '../middlewares';
import { createProductSchema, paginationSchema } from '../validators';

// Validate request body
app.post('/api/products', 
  validateRequest({ body: createProductSchema }),
  productController.create
);

// Validate query parameters
app.get('/api/products',
  validateRequest({ query: paginationSchema }),
  productController.list
);

// Validate both body and params
app.put('/api/products/:id',
  validateRequest({ 
    params: z.object({ id: idSchema }),
    body: updateProductSchema 
  }),
  productController.update
);
```

### Controller Usage
```typescript
import { createSaleSchema } from '../validators';

export const createSale = async (req: Request, res: Response) => {
  try {
    // Manual validation if needed
    const validatedData = createSaleSchema.parse(req.body);
    
    // Process validated data
    const sale = await saleService.createSale(validatedData);
    
    res.json(ApiResponse.success('Sale created successfully', sale));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', error.errors)
      );
    }
    throw error;
  }
};
```

### Frontend Type Safety
```typescript
// Generate TypeScript types from schemas
import { z } from 'zod';
import { createProductSchema } from '../validators';

type CreateProductInput = z.infer<typeof createProductSchema>;

const productData: CreateProductInput = {
  name: "iPhone 15 Pro Case",
  categoryId: "clr5j1ql50000356s7d8k2m9x",
  costPrice: 1500,
  wholesalePrice: 2000,
  retailPrice: 3000,
  minPrice: 1800
};
```

## Rwanda-Specific Validations

### Phone Number Validation
- Accepts multiple formats: `0788123456`, `+250788123456`, `788123456`
- Validates against Rwanda mobile patterns: `250[27]XXXXXXXX`
- Supports MTN (078X, 079X) and Airtel (073X) networks

### Business Rules
- **Currency**: All amounts in Rwanda Francs (RWF)
- **Tax Rate**: 18% VAT validation in sale calculations
- **Business Hours**: Validates operations within 8AM-8PM Kigali time
- **Payment Methods**: Rwanda-specific payment options including Mobile Money

### Product Categories
- Tailored for phone accessories market in Rwanda
- Popular phone models (iPhone, Samsung, Tecno, Infinix)
- Local business practices (consignment, cash rounding)

## Error Handling

### Validation Error Structure
```typescript
{
  success: false,
  message: "Validation failed",
  errors: [
    {
      field: "email",
      message: "Invalid email format"
    },
    {
      field: "phoneNumber", 
      message: "Invalid Rwanda phone number format"
    }
  ]
}
```

### Custom Error Messages
- Rwanda phone number: "Invalid Rwanda phone number format"
- Price hierarchy: "Price hierarchy must be: minPrice ≤ wholesalePrice ≤ retailPrice"
- Required fields: "Either email or phone number is required"
- Date ranges: "Start date must be before end date"

This validation system provides comprehensive type safety, business rule enforcement, and Rwanda-specific validations for your POS system!
