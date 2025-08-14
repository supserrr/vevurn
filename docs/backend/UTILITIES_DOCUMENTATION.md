# Backend Utilities Documentation

This document describes all the utility modules available in the backend API, providing comprehensive functionality for a Point of Sale (POS) system tailored for Rwanda's phone accessories market.

## Overview

The utilities provide essential functionality for:
- **Logging**: Structured logging with Winston
- **Response Formatting**: Consistent API responses
- **Constants**: Business logic constants and configurations
- **Helpers**: Common business functions and calculations
- **Encryption**: Security utilities for sensitive data

## Utility Modules

### 1. Logger (`utils/logger.ts`)

Winston-based logging system with structured logging and file rotation.

```typescript
import { logger } from './utils';
```

**Features:**
- Structured JSON logging
- Console and file outputs
- Production file logging
- Error stack trace capture
- Timestamp and service metadata

**Usage:**
```typescript
logger.info('User logged in', { userId: '123', action: 'login' });
logger.error('Database error', { error: error.message, query: 'SELECT * FROM users' });
logger.warn('Rate limit approached', { ip: '192.168.1.1', attempts: 4 });
logger.debug('Debug information', { data: someObject });
```

**Log Levels:**
- `error`: Error conditions
- `warn`: Warning conditions  
- `info`: Informational messages
- `debug`: Debug-level messages

### 2. API Response Formatter (`utils/response.ts`)

Standardized response formatting for all API endpoints.

```typescript
import { ApiResponse } from './utils';
```

**Response Structure:**
```typescript
interface ApiResponseData<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
```

**Methods:**
```typescript
// Success response
ApiResponse.success('Operation successful', data, meta)

// Error response  
ApiResponse.error('Error occurred', errorDetails)

// Paginated response
ApiResponse.paginated('Data retrieved', items, page, limit, total)
```

**Examples:**
```typescript
// Success with data
res.json(ApiResponse.success('User created successfully', newUser));

// Error response
res.status(400).json(ApiResponse.error('Invalid input', validationErrors));

// Paginated products
res.json(ApiResponse.paginated('Products retrieved', products, 1, 20, 150));
```

### 3. Constants (`utils/constants.ts`)

Business logic constants tailored for Rwanda's phone accessories market.

```typescript
import { 
  USER_ROLES, 
  PAYMENT_METHODS, 
  PRODUCT_CATEGORIES,
  BUSINESS_CONFIG 
} from './utils';
```

**User Roles:**
```typescript
USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER', 
  CASHIER: 'CASHIER'
}
```

**Payment Methods:**
```typescript
PAYMENT_METHODS = {
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY', // MTN Mobile Money, Airtel Money
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT: 'CREDIT'
}
```

**Product Categories:**
```typescript
PRODUCT_CATEGORIES = {
  PHONE_CASES: 'Phone Cases',
  SCREEN_PROTECTORS: 'Screen Protectors',
  CHARGERS: 'Chargers',
  EARPHONES: 'Earphones',
  POWER_BANKS: 'Power Banks'
  // ... more categories
}
```

**Popular Phone Models:**
- iPhone 15 series, iPhone 14, iPhone 13
- Samsung Galaxy S24 series, Galaxy A series
- Tecno, Infinix, Redmi, Huawei models popular in Rwanda

**Business Configuration:**
```typescript
BUSINESS_CONFIG = {
  OPENING_HOURS: '08:00',
  CLOSING_HOURS: '20:00',
  TIMEZONE: 'Africa/Kigali',
  CURRENCY: 'RWF',
  TAX_RATE: 0.18, // 18% VAT in Rwanda
  MIN_CASH_CHANGE: 50 // Minimum change in RWF
}
```

**MTN Mobile Money Config:**
```typescript
MOMO_CONFIG = {
  SANDBOX_BASE_URL: 'https://sandbox.momodeveloper.mtn.co.rw/collection',
  PRODUCTION_BASE_URL: 'https://api.mtn.co.rw/collection',
  CURRENCY: 'RWF',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
}
```

### 4. Helper Functions (`utils/helpers.ts`)

Business logic and utility functions specific to POS operations.

```typescript
import { 
  generateSaleNumber,
  formatCurrency,
  calculateTax,
  parseRwandaPhoneNumber,
  generateSKU
} from './utils';
```

**Sale Management:**
```typescript
// Generate unique sale number
generateSaleNumber() // Returns: "SALE-1755173270165-133"

// Generate purchase order number  
generatePurchaseOrderNumber() // Returns: "PO-1755173270165-456"
```

**Financial Calculations:**
```typescript
// Calculate tax (18% VAT default for Rwanda)
calculateTax(1000) // Returns: Decimal(180)
calculateTax(1000, 0.15) // Returns: Decimal(150) for 15% tax

// Calculate discount
calculateDiscount(1000, 10) // Returns: Decimal(100) for 10% discount

// Format currency for Rwanda
formatCurrency(1500) // Returns: "RF 1.500"
formatCurrency(25000) // Returns: "RF 25.000"

// Calculate profit margin
calculateProfitMargin(1200, 800) // Returns: Decimal(50) for 50% margin
```

**Phone Number Handling:**
```typescript
// Parse Rwanda phone numbers
parseRwandaPhoneNumber('0788123456') // Returns: "250788123456"
parseRwandaPhoneNumber('+250788123456') // Returns: "250788123456"

// Validate Rwanda phone numbers
isValidRwandaPhoneNumber('0788123456') // Returns: true
isValidRwandaPhoneNumber('123456') // Returns: false
```

**Product Management:**
```typescript
// Generate SKU
generateSKU('Phone Cases', 'Apple') // Returns: "PHO-APP-270165-42"

// Generate barcode (EAN-13)
generateBarcode() // Returns: "1234567890128"
```

**Business Operations:**
```typescript
// Check if business is open
isBusinessOpen() // Returns: true/false based on current time

// Round cash transactions 
roundToNearestDenomination(1547, 50) // Returns: Decimal(1550)

// Pagination helpers
validatePagination('2', '25') // Returns: { page: 2, limit: 25 }
getPaginationOffset(2, 20) // Returns: 20
```

**Search & Validation:**
```typescript
// Sanitize search queries
sanitizeSearchQuery('<script>alert("xss")</script>phone') // Returns: "phone"
```

### 5. Encryption & Security (`utils/encryption.ts`)

Security utilities for handling sensitive data and passwords.

```typescript
import { 
  encrypt, 
  decrypt, 
  hashPassword, 
  verifyPassword,
  generateSecureToken 
} from './utils';
```

**Data Encryption:**
```typescript
// Encrypt sensitive data
const encrypted = encrypt('sensitive-customer-data');
// Returns: "iv:authTag:encryptedData" format

// Decrypt data
const decrypted = decrypt(encrypted);
// Returns: original sensitive data
```

**Password Management:**
```typescript
// Hash passwords (bcrypt with salt rounds 12)
const hashedPassword = await hashPassword('userPassword123');

// Verify passwords
const isValid = await verifyPassword('userPassword123', hashedPassword);
// Returns: true if password matches
```

**Token Generation:**
```typescript
// Generate secure random tokens
generateSecureToken() // Returns: 64-character hex string (32 bytes)
generateSecureToken(16) // Returns: 32-character hex string (16 bytes)

// Hash API keys
hashApiKey('user-api-key-123') // Returns: SHA-256 hash
```

## Integration Examples

### Complete POS Sale Processing

```typescript
import { 
  logger,
  ApiResponse,
  generateSaleNumber,
  calculateTax,
  formatCurrency,
  BUSINESS_CONFIG,
  USER_ROLES
} from './utils';

async function processSale(saleData: any, user: any) {
  try {
    // Check user permissions
    if (!user.role || user.role === USER_ROLES.CASHIER) {
      logger.info('Sale initiated by cashier', { 
        userId: user.id, 
        cashierId: user.id 
      });
    }

    // Generate sale number
    const saleNumber = generateSaleNumber();
    
    // Calculate totals
    const subtotal = saleData.items.reduce((sum, item) => sum + item.total, 0);
    const tax = calculateTax(subtotal, BUSINESS_CONFIG.TAX_RATE);
    const total = subtotal + tax.toNumber();
    
    // Format for display
    const formattedTotal = formatCurrency(total);
    
    // Process sale (database operations...)
    const sale = await processSaleInDatabase({
      saleNumber,
      subtotal,
      tax: tax.toNumber(),
      total,
      ...saleData
    });
    
    logger.info('Sale processed successfully', {
      saleNumber,
      total: formattedTotal,
      userId: user.id
    });
    
    return ApiResponse.success('Sale processed successfully', {
      sale,
      formattedTotal
    });
    
  } catch (error) {
    logger.error('Sale processing failed', {
      error: error.message,
      saleData,
      userId: user.id
    });
    
    return ApiResponse.error('Sale processing failed', error.message);
  }
}
```

### Rwanda Mobile Money Integration

```typescript
import { 
  parseRwandaPhoneNumber,
  isValidRwandaPhoneNumber,
  MOMO_CONFIG,
  formatCurrency
} from './utils';

async function processMobileMoneyPayment(phoneNumber: string, amount: number) {
  // Validate and parse phone number
  if (!isValidRwandaPhoneNumber(phoneNumber)) {
    return ApiResponse.error('Invalid Rwanda phone number');
  }
  
  const cleanPhone = parseRwandaPhoneNumber(phoneNumber);
  const formattedAmount = formatCurrency(amount);
  
  // Process with MTN Mobile Money API
  const momoRequest = {
    amount: amount.toString(),
    currency: MOMO_CONFIG.CURRENCY,
    externalId: generateSecureToken(16),
    payer: {
      partyIdType: "MSISDN",
      partyId: cleanPhone
    },
    payerMessage: `Payment for POS purchase - ${formattedAmount}`,
    payeeNote: "Vevurn POS Payment"
  };
  
  // Integration with MTN Mobile Money API...
}
```

## Environment Variables

Required environment variables:

```env
# Logging
LOG_LEVEL=info                           # debug, info, warn, error

# Encryption  
ENCRYPTION_KEY=your-32-byte-secret-key   # For data encryption

# Business Configuration
BUSINESS_OPENING_HOURS=08:00
BUSINESS_CLOSING_HOURS=20:00

# Mobile Money (MTN)
MOMO_API_KEY=your-mtn-momo-api-key
MOMO_SUBSCRIPTION_KEY=your-subscription-key
MOMO_ENVIRONMENT=sandbox                 # or 'production'
```

## Best Practices

### 1. Logging
- Use structured logging with relevant context
- Include user IDs and actions for audit trails
- Log errors with sufficient detail for debugging
- Use appropriate log levels

### 2. Error Handling
- Always return consistent API responses
- Log errors before returning responses
- Sanitize error messages for production
- Include correlation IDs for tracking

### 3. Security
- Encrypt sensitive customer data
- Hash passwords with bcrypt
- Generate secure tokens for sessions
- Validate all input data

### 4. Business Logic
- Use Rwanda-specific formatting and validation
- Handle MTN Mobile Money integration properly
- Calculate taxes according to Rwanda VAT (18%)
- Format currency in Rwanda Francs (RWF)

### 5. Performance
- Use pagination for large datasets
- Cache frequently used constants
- Validate input parameters
- Optimize database queries with helpers

This utility system provides a solid foundation for building a comprehensive POS system tailored specifically for Rwanda's phone accessories market with proper security, logging, and business logic handling.
