# AnalyticsController API Documentation

## Overview

The AnalyticsController provides comprehensive business intelligence and reporting capabilities for the Vevurn POS system. It integrates with the AdvancedAnalyticsService, ExportService, and LocalizationService to deliver rich analytics data with proper localization support.

## Features

### Core Analytics
- **Profit Margin Analysis**: Detailed profit analysis by product, category, and time periods
- **Customer Lifetime Value**: Customer segmentation and LTV calculations
- **Inventory Aging**: Stock aging reports with write-off recommendations
- **Dashboard Analytics**: Comprehensive business overview with key metrics

### Export & Reporting
- **Multi-Format Export**: CSV, Excel, and PDF report generation
- **Scheduled Reports**: Automated report generation with email delivery
- **Custom Templates**: Standard, detailed, and summary report layouts
- **Localized Content**: Reports formatted according to user's locale and currency preferences

### Localization Support
- **Currency Formatting**: Automatic currency conversion and formatting per user locale
- **Date/Time Localization**: Regional date and time formatting
- **Number Formatting**: Locale-specific number, percentage, and currency display

## API Endpoints

### Analytics Endpoints

#### Get Profit Margin Analysis
```http
GET /api/analytics/profit-margin?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z&groupBy=both
Authorization: Bearer <token>

Query Parameters:
- startDate (required): Start date in ISO 8601 format
- endDate (required): End date in ISO 8601 format  
- groupBy (optional): Group by 'product', 'category', or 'both' (default)

Response:
{
  "success": true,
  "data": {
    "overall": {
      "revenue": "FRw 15,000,000",
      "profit": "FRw 4,500,000", 
      "marginPercentage": "30.0%"
    },
    "byProduct": [...],
    "byCategory": [...],
    "trends": [...]
  }
}
```

#### Get Customer Lifetime Value
```http
GET /api/analytics/customer-ltv?segment=vip
Authorization: Bearer <token>

Query Parameters:
- customerId (optional): Specific customer ID
- segment (optional): Filter by 'all', 'vip', or 'at-risk'

Response:
{
  "success": true,
  "data": [
    {
      "customerId": "cust_123",
      "name": "John Doe",
      "metrics": {
        "totalSpent": "FRw 250,000",
        "averageOrderValue": "FRw 25,000",
        "predictedLTV": "FRw 500,000",
        "segment": "vip"
      }
    }
  ],
  "summary": {
    "totalCustomers": 150,
    "avgLTV": 350000,
    "vipCount": 25,
    "atRiskCount": 10
  }
}
```

#### Get Inventory Aging Report
```http
GET /api/analytics/inventory-aging
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "summary": {
      "totalInventoryValue": "FRw 5,000,000",
      "writeOffRecommended": "FRw 150,000"
    },
    "agingBrackets": {
      "0-30": { "items": 150, "value": "FRw 3,000,000" },
      "31-60": { "items": 75, "value": "FRw 1,500,000" },
      "61-90": { "items": 25, "value": "FRw 400,000" },
      "90+": { "items": 10, "value": "FRw 100,000" }
    },
    "deadStock": [...]
  }
}
```

#### Get Dashboard Analytics
```http
POST /api/analytics/dashboard?period=30d
Authorization: Bearer <token>

Query Parameters:
- period (optional): Time period ('7d', '30d', '90d', '1y')

Response:
{
  "success": true,
  "data": {
    "profitMargin": {
      "overall": {...},
      "topProducts": [...],
      "topCategories": [...],
      "trends": [...]
    },
    "inventory": {
      "summary": {...},
      "agingBrackets": {...},
      "criticalItems": [...]
    },
    "customers": {
      "topCustomers": [...],
      "segments": {
        "vip": 25,
        "loyal": 45,
        "regular": 80,
        "atRisk": 10
      }
    },
    "period": {
      "start": "2024-07-11T00:00:00.000Z",
      "end": "2024-08-10T00:00:00.000Z",
      "label": "30d"
    }
  }
}
```

### Export Endpoints

#### Export Data
```http
POST /api/analytics/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "format": "excel",
  "type": "analytics",
  "dateRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "filters": {
    "category": "electronics",
    "minAmount": 1000
  },
  "columns": ["product", "revenue", "profit", "margin"],
  "includeCharts": true,
  "template": "detailed"
}

Response:
Binary file download with appropriate Content-Type headers:
- CSV: text/csv
- Excel: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet  
- PDF: application/pdf
```

#### Schedule Report
```http
POST /api/analytics/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Weekly Sales Report",
  "schedule": "0 9 * * 1",
  "exportOptions": {
    "format": "pdf",
    "type": "sales",
    "template": "summary",
    "includeCharts": true
  },
  "recipients": ["manager@company.com", "owner@company.com"],
  "enabled": true
}

Response:
{
  "success": true,
  "message": "Report scheduled successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Weekly Sales Report",
    "schedule": "0 9 * * 1",
    "recipients": ["manager@company.com", "owner@company.com"],
    "enabled": true,
    "lastRun": null,
    "nextRun": "2024-08-12T09:00:00.000Z"
  }
}
```

#### Get Scheduled Reports
```http
GET /api/analytics/scheduled
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Weekly Sales Report",
      "schedule": "0 9 * * 1",
      "exportOptions": {...},
      "recipients": ["manager@company.com"],
      "enabled": true,
      "lastRun": "2024-08-05T09:00:00.000Z",
      "nextRun": "2024-08-12T09:00:00.000Z"
    }
  ]
}
```

#### Cancel Scheduled Report
```http
DELETE /api/analytics/scheduled/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Scheduled report cancelled"
}
```

### Additional Endpoints (Placeholder)

#### Get Sales Trends
```http
GET /api/analytics/sales-trends?period=30d&groupBy=day
Authorization: Bearer <token>

Response:
{
  "success": false,
  "message": "Sales trends endpoint not yet implemented in AdvancedAnalyticsService"
}
```

#### Get Product Performance
```http
GET /api/analytics/product-performance?limit=20&sortBy=revenue
Authorization: Bearer <token>

Response:
{
  "success": false,
  "message": "Product performance endpoint not yet implemented in AdvancedAnalyticsService"
}
```

#### Get Staff Performance
```http
GET /api/analytics/staff-performance?period=30d
Authorization: Bearer <token>

Response:
{
  "success": false,
  "message": "Staff performance endpoint not yet implemented in AdvancedAnalyticsService"
}
```

## Request Validation

### Input Schemas

All requests are validated using Zod schemas:

```typescript
// Profit margin analysis
const profitMarginSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['product', 'category', 'both']).optional()
});

// Customer LTV
const customerLTVSchema = z.object({
  customerId: z.string().optional(),
  segment: z.enum(['all', 'vip', 'at-risk']).optional()
});

// Export options
const exportSchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf']),
  type: z.enum(['sales', 'inventory', 'customers', 'financial', 'analytics']),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  filters: z.record(z.string(), z.any()).optional(),
  columns: z.array(z.string()).optional(),
  includeCharts: z.boolean().optional(),
  template: z.enum(['standard', 'detailed', 'summary']).optional()
});

// Scheduled export
const scheduleExportSchema = z.object({
  name: z.string(),
  schedule: z.string(), // Cron expression
  exportOptions: exportSchema,
  recipients: z.array(z.string().email()),
  enabled: z.boolean()
});
```

## Authentication & Authorization

### Route Protection
All analytics endpoints require authentication via Bearer token:
```typescript
router.use(requireBetterAuth);
```

### Role-Based Access Control

#### All Staff Access (Admin, Manager, Staff)
- `GET /analytics/dashboard`
- `GET /analytics/sales-trends`
- `GET /analytics/product-performance`

#### Manager & Admin Only
- `GET /analytics/profit-margin`
- `GET /analytics/customer-ltv`
- `GET /analytics/inventory-aging`
- `POST /analytics/export`
- `POST /analytics/schedule`
- `GET /analytics/scheduled`
- `DELETE /analytics/scheduled/:id`
- `GET /analytics/staff-performance`

## Localization Integration

### Automatic Currency Formatting

The controller automatically formats currency values based on user's locale:

```typescript
// Example: Rwanda user with RWF currency
const userId = (req as any).user?.id;
analysis.overall.revenue = localizationService.formatNumber(
  analysis.overall.revenue,
  userId,
  { style: 'currency' }
).formatted; // Returns "FRw 15,000,000"

// Example: US user with USD currency  
analysis.overall.revenue = localizationService.formatNumber(
  analysis.overall.revenue,
  userId,
  { style: 'currency' }
).formatted; // Returns "$15,000,000.00"
```

### Percentage Formatting

Percentages are formatted according to user's locale:

```typescript
analysis.overall.marginPercentage = localizationService.formatNumber(
  analysis.overall.marginPercentage / 100,
  userId,
  { style: 'percent' }
).formatted; // Returns "30.0%" or "30,0%" based on locale
```

### Date Range Handling

Date strings are converted to Date objects for service calls:

```typescript
const exportOptions = {
  ...validated,
  dateRange: validated.dateRange ? {
    start: new Date(validated.dateRange.start),
    end: new Date(validated.dateRange.end)
  } : undefined
};
```

## Error Handling

### Validation Errors
All input validation uses Zod schemas with automatic error responses:

```typescript
try {
  const validated = profitMarginSchema.parse(req.query);
  // Process request...
} catch (error) {
  next(error); // Handled by error middleware
}
```

### Service Errors
Service-level errors are caught and passed to error middleware:

```typescript
try {
  const analysis = await analyticsService.getProfitMarginAnalysis(...);
  // Process response...
} catch (error) {
  next(error); // Returns appropriate HTTP status and message
}
```

### Export File Errors
Export operations include proper error handling for file generation:

```typescript
try {
  const buffer = await exportService.exportToExcel(exportOptions);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
} catch (error) {
  next(error); // Returns error instead of corrupted file
}
```

## Performance Considerations

### Parallel Data Fetching
Dashboard endpoint fetches multiple analytics concurrently:

```typescript
const [profitMargin, inventoryAging, topCustomers] = await Promise.all([
  analyticsService.getProfitMarginAnalysis(startDate, endDate, 'both'),
  analyticsService.getInventoryAgingReport(),
  analyticsService.getCustomerLifetimeValue(undefined, 'vip')
]);
```

### Data Limiting
Large datasets are limited to prevent performance issues:

```typescript
topProducts: profitMargin.byProduct.slice(0, 5),
topCategories: profitMargin.byCategory.slice(0, 5),
criticalItems: inventoryAging.deadStock.slice(0, 10)
```

### Caching Strategy
Consider implementing caching for:
- Dashboard data (short TTL - 5 minutes)
- Profit margin analysis (medium TTL - 30 minutes)
- Inventory aging (long TTL - 2 hours)

## Usage Examples

### Frontend Integration

```javascript
// React component for analytics dashboard
import { useEffect, useState } from 'react';

function AnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [period, setPeriod] = useState('30d');
  
  useEffect(() => {
    fetch(`/api/analytics/dashboard?period=${period}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(data => setDashboardData(data.data));
  }, [period]);
  
  return (
    <div>
      <h2>Business Analytics</h2>
      {dashboardData && (
        <>
          <div>Revenue: {dashboardData.profitMargin.overall.revenue}</div>
          <div>Profit: {dashboardData.profitMargin.overall.profit}</div>
          <div>Margin: {dashboardData.profitMargin.overall.marginPercentage}</div>
        </>
      )}
    </div>
  );
}
```

### Export Data Example

```javascript
// Export sales data to Excel
async function exportSalesData() {
  try {
    const response = await fetch('/api/analytics/export', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        format: 'excel',
        type: 'sales',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z'
        },
        template: 'detailed',
        includeCharts: true
      })
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales_report.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Export failed:', error);
  }
}
```

### Schedule Report Example

```javascript
// Schedule weekly profit report
async function scheduleWeeklyReport() {
  try {
    const response = await fetch('/api/analytics/schedule', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Weekly Profit Report',
        schedule: '0 9 * * 1', // Every Monday at 9 AM
        exportOptions: {
          format: 'pdf',
          type: 'analytics',
          template: 'summary',
          includeCharts: true
        },
        recipients: ['manager@company.com'],
        enabled: true
      })
    });
    
    const result = await response.json();
    console.log('Report scheduled:', result.data);
  } catch (error) {
    console.error('Scheduling failed:', error);
  }
}
```

## Cron Expression Examples

For scheduled reports, use standard cron expressions:

```bash
# Every Monday at 9 AM
0 9 * * 1

# Every day at 6 AM
0 6 * * *

# Every first day of month at 8 AM
0 8 1 * *

# Every Sunday at 10 PM
0 22 * * 0

# Every 6 hours
0 */6 * * *
```

## Integration with Services

### AdvancedAnalyticsService Integration
The controller relies on AdvancedAnalyticsService for core analytics:

```typescript
const analyticsService = AdvancedAnalyticsService.getInstance();

// Available methods:
// - getProfitMarginAnalysis(startDate, endDate, groupBy)
// - getCustomerLifetimeValue(customerId?, segment?)
// - getInventoryAgingReport()
```

### ExportService Integration
Export functionality is handled by ExportService:

```typescript
const exportService = ExportService.getInstance();

// Available methods:
// - exportToCSV(options)
// - exportToExcel(options)
// - exportToPDF(options)
// - scheduleExport(scheduledExport)
// - getScheduledExports()
// - deleteScheduledExport(id)
```

### LocalizationService Integration
All numeric values are formatted using LocalizationService:

```typescript
const localizationService = LocalizationService.getInstance();

// Currency formatting
const formatted = localizationService.formatNumber(
  value,
  userId,
  { style: 'currency' }
);

// Percentage formatting
const percentage = localizationService.formatNumber(
  value / 100,
  userId, 
  { style: 'percent' }
);
```

## Future Enhancements

### Planned Features
- **Sales Trends Analysis**: Detailed sales trending with predictive analytics
- **Product Performance Metrics**: Advanced product analysis with recommendations
- **Staff Performance Tracking**: Individual staff member performance metrics
- **Real-time Analytics**: WebSocket-based live analytics updates
- **Custom KPI Dashboard**: User-configurable key performance indicators

### Extensibility Points
- Additional export formats (JSON, XML)
- Custom report templates
- Advanced filtering options
- Drill-down analytics
- Comparative analysis tools

The AnalyticsController provides a comprehensive foundation for business intelligence in the Vevurn POS system, with full localization support and extensible architecture for future enhancements.
