# LocalizationService Implementation Guide

## Overview

The LocalizationService provides comprehensive internationalization (i18n) and localization (l10n) support for the Vevurn POS system. It handles multi-language content, currency formatting, date/time localization, number formatting, and regional preferences across different markets, with special focus on East African markets (Rwanda, Kenya, Uganda, Tanzania).

## Features

### Multi-Language Support
- **12 Supported Locales**: Including English, French, German, Spanish, Portuguese, Chinese, Japanese, Arabic, and Swahili
- **East African Focus**: Special support for Rwanda (en-RW, fr-RW), Kenya, Uganda, Tanzania
- **RTL Support**: Right-to-left text direction for Arabic and other RTL languages
- **Dynamic Translation**: Runtime language switching without app restart

### Currency & Number Formatting
- **9 Major Currencies**: RWF, USD, EUR, GBP, CNY, JPY, KES, UGX, TZS
- **Locale-Aware Formatting**: Numbers, currencies, and percentages formatted per regional standards
- **Decimal Handling**: Proper decimal places per currency (0 for RWF/JPY, 2 for USD/EUR)
- **Parsing Support**: Convert localized number strings back to numeric values

### Date & Time Localization
- **Multiple Formats**: Short, medium, long, full, and custom date formats
- **Time Zone Support**: Convert between different time zones
- **Relative Dates**: Human-readable relative time formatting ("2 hours ago", "tomorrow")
- **Business Hours**: Locale-specific business hours and working days
- **Calendar Support**: Localized day/month names with custom week start days

### Regional Preferences
- **Address Formatting**: Country-specific address formats
- **Phone Number Formatting**: Local phone number patterns and validation
- **Validation Rules**: Locale-specific regex patterns for phones, postal codes, tax IDs
- **File Size Formatting**: Localized file size display (KB, MB, GB)

## Implementation

### Core Service Structure

```typescript
interface LocalizationConfig {
  locale: string;              // Language and region (e.g., 'en-RW')
  timezone: string;            // IANA timezone (e.g., 'Africa/Kigali')
  currency: string;            // ISO currency code (e.g., 'RWF')
  dateFormat: string;          // Date format pattern
  timeFormat: '12h' | '24h';   // Time format preference
  numberFormat: string;        // Number format pattern
  firstDayOfWeek: 0 | 1 | 6;   // Week start day
  workingDays: number[];       // Business days (0-6)
}
```

### Singleton Pattern
The service uses singleton pattern for consistent configuration across the application:

```typescript
const localizationService = LocalizationService.getInstance();
```

## API Endpoints

### Public Endpoints (No Authentication)

#### Get Supported Locales
```http
GET /api/localization/locales

Response:
{
  "success": true,
  "locales": [
    {
      "code": "en-RW",
      "name": "English (Rwanda)",
      "rtl": false
    },
    {
      "code": "fr-RW",
      "name": "Français (Rwanda)",
      "rtl": false
    }
  ]
}
```

#### Get Supported Currencies
```http
GET /api/localization/currencies

Response:
{
  "success": true,
  "currencies": [
    {
      "code": "RWF",
      "symbol": "FRw",
      "decimals": 0
    },
    {
      "code": "USD",
      "symbol": "$",
      "decimals": 2
    }
  ]
}
```

#### Get Supported Timezones
```http
GET /api/localization/timezones

Response:
{
  "success": true,
  "timezones": [
    {
      "code": "Africa/Kigali",
      "name": "Rwanda"
    },
    {
      "code": "Africa/Nairobi",
      "name": "Kenya"
    }
  ]
}
```

#### Convert Timezone
```http
POST /api/localization/timezone/convert
Content-Type: application/json

{
  "date": "2024-08-10T14:30:00Z",
  "fromTimeZone": "UTC",
  "toTimeZone": "Africa/Kigali"
}

Response:
{
  "success": true,
  "converted": {
    "date": "2024-08-10T16:30:00.000Z",
    "iso": "2024-08-10T16:30:00.000Z",
    "timestamp": 1723308600000
  }
}
```

### Authenticated Endpoints

#### Get User Configuration
```http
GET /api/localization/config
Authorization: Bearer <token>

Response:
{
  "success": true,
  "config": {
    "locale": "en-RW",
    "timezone": "Africa/Kigali",
    "currency": "RWF",
    "dateFormat": "dd/MM/yyyy",
    "timeFormat": "24h",
    "numberFormat": "#,##0.00",
    "firstDayOfWeek": 1,
    "workingDays": [1, 2, 3, 4, 5]
  }
}
```

#### Update User Configuration
```http
PUT /api/localization/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "locale": "fr-RW",
  "currency": "USD",
  "timeFormat": "12h"
}

Response:
{
  "success": true,
  "message": "Localization configuration updated successfully",
  "config": {
    "locale": "fr-RW",
    "timezone": "Africa/Kigali",
    "currency": "USD",
    "dateFormat": "dd/MM/yyyy",
    "timeFormat": "12h",
    "numberFormat": "#,##0.00",
    "firstDayOfWeek": 1,
    "workingDays": [1, 2, 3, 4, 5]
  }
}
```

#### Format Date
```http
POST /api/localization/format/date
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-08-10T14:30:00Z",
  "formatType": "medium"
}

Response:
{
  "success": true,
  "formatted": {
    "formatted": "10/08/2024 16:30",
    "relative": "today at 4:30 PM",
    "iso": "2024-08-10T14:30:00.000Z",
    "timestamp": 1723301400000,
    "parts": {
      "year": 2024,
      "month": 8,
      "day": 10,
      "hour": 16,
      "minute": 30,
      "second": 0,
      "dayOfWeek": 6,
      "weekOfYear": 32
    }
  }
}
```

#### Format Number
```http
POST /api/localization/format/number
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": 1234567.89,
  "options": {
    "style": "currency",
    "currency": "RWF"
  }
}

Response:
{
  "success": true,
  "formatted": {
    "formatted": "FRw 1,234,568",
    "raw": 1234567.89,
    "currency": "RWF",
    "parts": {
      "integer": "1234568",
      "currency": "FRw"
    }
  }
}
```

#### Format Phone Number
```http
POST /api/localization/format/phone
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "250788123456"
}

Response:
{
  "success": true,
  "formatted": "+250 788 123 456"
}
```

#### Get Localized Day Names
```http
GET /api/localization/days?format=long
Authorization: Bearer <token>

Response:
{
  "success": true,
  "dayNames": [
    "Monday", "Tuesday", "Wednesday", "Thursday", 
    "Friday", "Saturday", "Sunday"
  ]
}
```

#### Get Validation Rules
```http
GET /api/localization/validation-rules
Authorization: Bearer <token>

Response:
{
  "success": true,
  "rules": {
    "phone": "^\\+?250?[-\\.\\s]?7[2-9]\\d{7}$",
    "postalCode": "^\\d{4,6}$",
    "taxId": "^\\d{9}$"
  }
}
```

## Usage Examples

### Service Integration

```typescript
import { LocalizationService } from '../services/LocalizationService';

const localizationService = LocalizationService.getInstance();

// Set user configuration
localizationService.setUserConfig('user123', {
  locale: 'fr-RW',
  currency: 'RWF',
  timezone: 'Africa/Kigali'
});

// Format currency for Rwanda French user
const price = localizationService.formatNumber(15000, 'user123', {
  style: 'currency',
  currency: 'RWF'
});
console.log(price.formatted); // "FRw 15,000"

// Format date
const date = localizationService.formatDate(
  new Date(),
  'user123',
  'medium'
);
console.log(date.formatted); // "10/08/2024 16:30"

// Get localized day names
const days = localizationService.getDayNames('user123', 'short');
console.log(days); // ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
```

### Frontend Integration

```javascript
// React component example
import { useEffect, useState } from 'react';

function PriceDisplay({ amount, userId }) {
  const [formattedPrice, setFormattedPrice] = useState('');
  
  useEffect(() => {
    fetch('/api/localization/format/number', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        value: amount,
        options: { style: 'currency' }
      })
    })
    .then(res => res.json())
    .then(data => setFormattedPrice(data.formatted.formatted));
  }, [amount]);
  
  return <span>{formattedPrice}</span>;
}
```

## Regional Configurations

### Rwanda (RWF)
- **Locale**: `en-RW`, `fr-RW`
- **Currency**: RWF (Rwandan Franc) - no decimal places
- **Phone Format**: +250 XXX XXX XXX
- **Business Hours**: 08:00 - 17:00
- **Working Days**: Monday to Friday
- **Date Format**: dd/MM/yyyy

### Kenya (KES)
- **Locale**: `sw-KE` (Swahili), `en-US`
- **Currency**: KES (Kenyan Shilling) - 2 decimal places
- **Phone Format**: +254 XXX XXX XXX
- **Business Hours**: 08:00 - 17:00
- **Working Days**: Monday to Friday

### Uganda (UGX)
- **Locale**: `en-US`
- **Currency**: UGX (Ugandan Shilling) - no decimal places
- **Phone Format**: +256 XXX XXX XXX
- **Business Hours**: 08:00 - 17:00

### Tanzania (TZS)
- **Locale**: `sw-TZ` (Swahili), `en-US`
- **Currency**: TZS (Tanzanian Shilling) - no decimal places
- **Phone Format**: +255 XXX XXX XXX
- **Business Hours**: 08:00 - 17:00

## Configuration Files

### Default Configuration
The service starts with Rwanda-focused defaults:

```typescript
private defaultConfig: LocalizationConfig = {
  locale: 'en-RW',           // English (Rwanda)
  timezone: 'Africa/Kigali', // Rwanda timezone
  currency: 'RWF',           // Rwandan Franc
  dateFormat: 'dd/MM/yyyy',  // European date format
  timeFormat: '24h',         // 24-hour format
  numberFormat: '#,##0.00',  // Standard number format
  firstDayOfWeek: 1,         // Monday start
  workingDays: [1,2,3,4,5]   // Monday-Friday
};
```

### Supported Locales Configuration
```typescript
const SUPPORTED_LOCALES = {
  'en-US': { dateLocale: enUS, name: 'English (US)', rtl: false },
  'en-GB': { dateLocale: enGB, name: 'English (UK)', rtl: false },
  'en-RW': { dateLocale: enGB, name: 'English (Rwanda)', rtl: false },
  'fr-FR': { dateLocale: fr, name: 'Français', rtl: false },
  'fr-RW': { dateLocale: fr, name: 'Français (Rwanda)', rtl: false },
  'sw-KE': { dateLocale: enUS, name: 'Kiswahili', rtl: false },
  'ar-SA': { dateLocale: arSA, name: 'العربية', rtl: true }
};
```

### Currency Configuration
```typescript
const CURRENCY_CONFIG = {
  'RWF': { symbol: 'FRw', decimals: 0, format: '#,##0' },
  'USD': { symbol: '$', decimals: 2, format: '#,##0.00' },
  'EUR': { symbol: '€', decimals: 2, format: '#,##0.00' },
  'KES': { symbol: 'KSh', decimals: 2, format: '#,##0.00' },
  'UGX': { symbol: 'USh', decimals: 0, format: '#,##0' },
  'TZS': { symbol: 'TSh', decimals: 0, format: '#,##0' }
};
```

## Translation Files

### English (`/locales/en.json`)
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "total": "Total",
    "amount": "Amount"
  },
  "pos": {
    "pointOfSale": "Point of Sale",
    "newSale": "New Sale",
    "checkout": "Checkout"
  },
  "validation": {
    "required": "This field is required",
    "invalidEmail": "Please enter a valid email address"
  }
}
```

### French (`/locales/fr.json`)
```json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "total": "Total",
    "amount": "Montant"
  },
  "pos": {
    "pointOfSale": "Point de vente",
    "newSale": "Nouvelle vente",
    "checkout": "Commander"
  },
  "validation": {
    "required": "Ce champ est obligatoire",
    "invalidEmail": "Veuillez saisir une adresse email valide"
  }
}
```

## Validation & Formatting Rules

### Phone Number Patterns
```typescript
const phonePatterns = {
  'en-RW': /^\+?250?[-.\s]?7[2-9]\d{7}$/,    // Rwanda: +250 7XX XXX XXX
  'en-US': /^\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, // US
  'en-GB': /^\+?44?[-.\s]?\(?[0-9]{4,5}\)?[-.\s]?[0-9]{6,7}$/,       // UK
  'sw-KE': /^\+?254?[-.\s]?[7][0-9]{8}$/     // Kenya: +254 7XX XXX XXX
};
```

### Address Formats
```typescript
// Rwanda format
"Street Address, City, Province, Rwanda"

// US format  
"Street Address, City, State ZIP, Country"

// Japanese format
"Postal Code Prefecture City Street Address"
```

### Business Hours by Locale
```typescript
const businessHours = {
  'en-RW': { start: '08:00', end: '17:00' },  // Rwanda
  'fr-RW': { start: '08:00', end: '17:00' },  // Rwanda
  'en-US': { start: '09:00', end: '17:00' },  // US
  'sw-KE': { start: '08:00', end: '17:00' },  // Kenya
  'ar-SA': { start: '08:00', end: '16:00' }   // Saudi Arabia
};
```

## Best Practices

### Performance Optimization
1. **Singleton Pattern**: Single service instance across the app
2. **Caching**: User configurations cached in memory
3. **Lazy Loading**: Translation files loaded on demand
4. **Batch Formatting**: Format multiple items in single call

### Error Handling
1. **Graceful Fallbacks**: Default to English if locale not found
2. **Validation**: Validate locale/currency/timezone before setting
3. **Logging**: Log configuration changes for audit
4. **Error Messages**: Localized error messages per user

### Security Considerations
1. **Input Validation**: Sanitize all localization inputs
2. **XSS Prevention**: Escape translated content in HTML
3. **Access Control**: User can only modify own configuration
4. **Audit Trail**: Log all configuration changes

### Extensibility
1. **Plugin Architecture**: Easy to add new locales
2. **Custom Formats**: Support for custom date/number formats
3. **Dynamic Loading**: Add locales without restart
4. **API Versioning**: Maintain backward compatibility

## Integration Examples

### Express Middleware
```typescript
// Localization middleware
app.use((req, res, next) => {
  if (req.user) {
    const userConfig = localizationService.getUserConfig(req.user.id);
    req.locale = userConfig.locale;
    req.currency = userConfig.currency;
    req.timezone = userConfig.timezone;
  }
  next();
});
```

### Database Integration
```typescript
// Store user preferences in database
await prisma.userPreference.upsert({
  where: { userId: user.id },
  update: { 
    locale: config.locale,
    currency: config.currency,
    timezone: config.timezone
  },
  create: {
    userId: user.id,
    locale: config.locale,
    currency: config.currency,
    timezone: config.timezone
  }
});
```

### React Hook
```typescript
// Custom React hook for localization
function useLocalization() {
  const [config, setConfig] = useState(null);
  
  const formatCurrency = (amount) => {
    return localizationService.formatNumber(amount, userId, {
      style: 'currency'
    });
  };
  
  const formatDate = (date, format = 'medium') => {
    return localizationService.formatDate(date, userId, format);
  };
  
  return { config, formatCurrency, formatDate };
}
```

## Troubleshooting

### Common Issues

#### Date Formatting Issues
- **Problem**: Incorrect date format display
- **Solution**: Check user's `dateFormat` and `locale` configuration
- **Debug**: Log the user's timezone and locale settings

#### Currency Formatting
- **Problem**: Wrong currency symbol or decimal places
- **Solution**: Verify currency configuration in `CURRENCY_CONFIG`
- **Debug**: Check if currency code exists and is supported

#### Timezone Conversion
- **Problem**: Incorrect time zone conversion
- **Solution**: Ensure IANA timezone identifiers are used
- **Debug**: Validate timezone string format

#### Missing Translations
- **Problem**: Untranslated text appearing
- **Solution**: Add missing keys to translation files
- **Debug**: Check console for missing translation warnings

### Performance Issues

#### Memory Usage
- Monitor user configuration cache size
- Clear unused configurations periodically
- Use WeakMap for automatic garbage collection

#### API Response Time
- Cache frequently used formatting results
- Batch multiple formatting operations
- Use async operations for heavy computations

## Production Deployment

### Environment Configuration
```bash
# Set default locale for server
DEFAULT_LOCALE=en-RW
DEFAULT_CURRENCY=RWF  
DEFAULT_TIMEZONE=Africa/Kigali

# Translation file paths
LOCALES_PATH=./locales
SUPPORTED_LOCALES=en-US,en-GB,en-RW,fr-FR,fr-RW,sw-KE,ar-SA

# Regional settings
BUSINESS_HOURS_START=08:00
BUSINESS_HOURS_END=17:00
FIRST_DAY_OF_WEEK=1
```

### Docker Configuration
```dockerfile
# Copy locale files
COPY locales/ /app/locales/

# Set locale environment
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

# Install locale packages
RUN apt-get update && apt-get install -y locales
RUN locale-gen en_US.UTF-8 fr_FR.UTF-8
```

### Monitoring & Analytics
- Track most used locales and currencies
- Monitor API endpoint performance
- Log configuration change patterns
- Alert on formatting errors

The LocalizationService provides comprehensive internationalization support optimized for East African markets while maintaining global compatibility. It integrates seamlessly with the Vevurn POS system to deliver localized user experiences across different regions and languages.
