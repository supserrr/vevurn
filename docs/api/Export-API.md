# Export API Documentation

The Export API provides comprehensive report generation and automated scheduling capabilities for the Vevurn POS System. Generate reports in CSV, Excel, and PDF formats with custom filtering, scheduling, and email delivery.

## Base URL
```
/api/exports
```

## Authentication
All export endpoints require authentication and appropriate role permissions.

## Endpoints

### 1. Get Export Templates
Get available export formats, types, and configuration options.

**Endpoint:** `GET /api/exports/templates`

**Access:** All authenticated users

**Response:**
```json
{
  "success": true,
  "data": {
    "formats": ["csv", "excel", "pdf"],
    "types": ["sales", "inventory", "customers", "financial", "analytics"],
    "templates": ["standard", "detailed", "summary"],
    "scheduleExamples": {
      "daily": "0 9 * * *",
      "weekly": "0 9 * * 1", 
      "monthly": "0 9 1 * *",
      "custom": "Custom cron expression"
    },
    "columnOptions": {
      "sales": ["id", "date", "time", "customer", "items", "subtotal", "tax", "discount", "total", "paymentMethod", "status", "cashier"],
      "inventory": ["id", "name", "sku", "category", "supplier", "stockQuantity", "reorderLevel", "costPrice", "sellingPrice", "status"],
      "customers": ["id", "name", "email", "phone", "address", "totalSales", "totalSpent", "lastPurchase", "dateAdded"],
      "financial": ["metric", "amount", "type", "period"],
      "analytics": ["metric", "value", "type"]
    }
  }
}
```

### 2. Generate Report
Generate and download a report in the specified format.

**Endpoint:** `POST /api/exports/generate`

**Access:** Manager, Admin

**Request Body:**
```json
{
  "format": "csv|excel|pdf",
  "type": "sales|inventory|customers|financial|analytics",
  "dateRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "filters": {
    "status": "COMPLETED",
    "paymentMethod": "MOBILE_MONEY"
  },
  "columns": ["id", "date", "customer", "total", "status"],
  "groupBy": "category",
  "includeCharts": true,
  "template": "detailed"
}
```

**Response:**
- **Success**: File download with appropriate headers
- **Content-Type**: `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, or `application/pdf`
- **Content-Disposition**: `attachment; filename="sales_report_2024-01-31T14-30-00.csv"`

**Error Response:**
```json
{
  "success": false,
  "message": "Format and type are required"
}
```

### 3. Schedule Report
Create an automated report that runs on a schedule.

**Endpoint:** `POST /api/exports/schedule`

**Access:** Admin only

**Request Body:**
```json
{
  "name": "Weekly Sales Report",
  "schedule": "0 9 * * 1",
  "exportOptions": {
    "format": "excel",
    "type": "sales",
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    },
    "template": "detailed",
    "includeCharts": true
  },
  "recipients": [
    "manager@vevurn.com",
    "owner@vevurn.com"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report scheduled successfully",
  "data": {
    "id": "uuid-generated-id",
    "name": "Weekly Sales Report",
    "schedule": "0 9 * * 1",
    "exportOptions": { /* ... */ },
    "recipients": ["manager@vevurn.com", "owner@vevurn.com"],
    "enabled": true,
    "createdAt": "2024-01-31T14:30:00Z"
  }
}
```

### 4. Get Scheduled Reports
Retrieve all scheduled reports.

**Endpoint:** `GET /api/exports/scheduled`

**Access:** Manager, Admin

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "Daily Sales Summary",
      "schedule": "0 9 * * *",
      "exportOptions": {
        "format": "pdf",
        "type": "sales",
        "template": "summary"
      },
      "recipients": ["manager@vevurn.com"],
      "enabled": true,
      "lastRun": "2024-01-31T09:00:00Z",
      "nextRun": "2024-02-01T09:00:00Z"
    },
    {
      "id": "uuid-2", 
      "name": "Monthly Inventory Report",
      "schedule": "0 9 1 * *",
      "exportOptions": {
        "format": "excel",
        "type": "inventory",
        "template": "detailed"
      },
      "recipients": ["inventory@vevurn.com"],
      "enabled": true,
      "lastRun": "2024-01-01T09:00:00Z",
      "nextRun": "2024-02-01T09:00:00Z"
    }
  ]
}
```

### 5. Update Scheduled Report
Modify an existing scheduled report.

**Endpoint:** `PUT /api/exports/scheduled/:id`

**Access:** Admin only

**Request Body:**
```json
{
  "name": "Updated Weekly Sales Report",
  "schedule": "0 10 * * 1",
  "exportOptions": {
    "format": "excel",
    "type": "sales",
    "template": "detailed"
  },
  "recipients": [
    "manager@vevurn.com",
    "owner@vevurn.com",
    "analyst@vevurn.com"
  ],
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduled report updated successfully",
  "data": {
    "id": "uuid-generated-id",
    "name": "Updated Weekly Sales Report",
    "schedule": "0 10 * * 1",
    "exportOptions": { /* ... */ },
    "recipients": ["manager@vevurn.com", "owner@vevurn.com", "analyst@vevurn.com"],
    "enabled": true,
    "updatedAt": "2024-01-31T14:30:00Z"
  }
}
```

### 6. Delete Scheduled Report
Remove a scheduled report.

**Endpoint:** `DELETE /api/exports/scheduled/:id`

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "message": "Scheduled report deleted successfully"
}
```

### 7. Test Scheduled Export
Manually trigger a scheduled export for testing purposes.

**Endpoint:** `POST /api/exports/test/:id`

**Access:** Admin only (Development environment)

**Response:**
```json
{
  "success": true,
  "message": "Test export triggered",
  "data": {
    "scheduledExport": { /* scheduled export details */ }
  }
}
```

## Export Types

### Sales Reports
Export sales data with comprehensive details about transactions, customers, and performance metrics.

**Available Columns:**
- `id`: Sale ID
- `date`: Sale date (YYYY-MM-DD)
- `time`: Sale time (HH:MM:SS)
- `customer`: Customer name
- `items`: Number of items sold
- `subtotal`: Subtotal amount
- `tax`: Tax amount
- `discount`: Discount amount
- `total`: Total amount
- `paymentMethod`: Payment method used
- `status`: Sale status
- `cashier`: Cashier who processed the sale

### Inventory Reports
Export product inventory data with stock levels, pricing, and movement history.

**Available Columns:**
- `id`: Product ID
- `name`: Product name
- `sku`: Product SKU
- `category`: Product category
- `supplier`: Supplier name
- `stockQuantity`: Current stock quantity
- `reorderLevel`: Reorder level threshold
- `costPrice`: Product cost price
- `sellingPrice`: Product selling price
- `status`: Product status

### Customer Reports
Export customer data with purchase history and lifetime value metrics.

**Available Columns:**
- `id`: Customer ID
- `name`: Customer name
- `email`: Customer email
- `phone`: Customer phone
- `address`: Customer address
- `totalSales`: Total number of purchases
- `totalSpent`: Total amount spent
- `lastPurchase`: Date of last purchase
- `dateAdded`: Date customer was added

### Financial Reports
Export financial summaries with revenue, expenses, and profit analysis.

**Available Columns:**
- `metric`: Financial metric name
- `amount`: Metric amount
- `type`: Metric type (Income, Expense, Profit)
- `period`: Time period for the metric

### Analytics Reports
Export business analytics and performance metrics.

**Available Columns:**
- `metric`: Analytics metric name
- `value`: Metric value
- `type`: Value type (Count, Amount, Percentage)

## Report Templates

### Standard Template
Basic report format with essential data and minimal formatting.

### Detailed Template  
Comprehensive report with additional data points, subtotals, and enhanced formatting.

### Summary Template
High-level overview with key metrics and aggregated data.

## Scheduling

### Cron Expression Format
Use standard cron expressions to schedule reports:

- **Every day at 9 AM**: `0 9 * * *`
- **Every Monday at 9 AM**: `0 9 * * 1`
- **First day of every month at 9 AM**: `0 9 1 * *`
- **Every hour**: `0 * * * *`
- **Every 30 minutes**: `*/30 * * * *`

### Email Delivery
Scheduled reports are automatically:
1. Generated in the specified format
2. Uploaded to cloud storage (S3)
3. Emailed to all recipients with download links
4. Attached directly to the email (for smaller files)

## Filters and Options

### Date Range Filtering
```json
{
  "dateRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  }
}
```

### Custom Filters
```json
{
  "filters": {
    "status": "COMPLETED",
    "paymentMethod": ["CASH", "MOBILE_MONEY"],
    "customerId": "specific-customer-id",
    "categoryId": "specific-category-id"
  }
}
```

### Column Selection
```json
{
  "columns": ["id", "date", "customer", "total", "status"]
}
```

### Grouping Options
```json
{
  "groupBy": "category|paymentMethod|status|date"
}
```

## Error Handling

**Common Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Format and type are required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Scheduled export not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to generate report",
  "error": "Detailed error information (development only)"
}
```

## Usage Examples

### Generate a Sales Report (CSV)
```javascript
const response = await fetch('/api/exports/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    format: 'csv',
    type: 'sales',
    dateRange: {
      start: '2024-01-01T00:00:00Z',
      end: '2024-01-31T23:59:59Z'
    }
  })
});

if (response.ok) {
  const blob = await response.blob();
  // Handle file download
} else {
  const error = await response.json();
  console.error('Export failed:', error.message);
}
```

### Schedule a Weekly Report
```javascript
const scheduledExport = await fetch('/api/exports/schedule', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    name: 'Weekly Inventory Report',
    schedule: '0 9 * * 1', // Every Monday at 9 AM
    exportOptions: {
      format: 'excel',
      type: 'inventory',
      template: 'detailed',
      includeCharts: true
    },
    recipients: ['manager@company.com', 'inventory@company.com']
  })
});

const result = await scheduledExport.json();
console.log('Report scheduled:', result.data.id);
```

### Get All Scheduled Reports
```javascript
const response = await fetch('/api/exports/scheduled', {
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

const data = await response.json();
console.log(`Found ${data.data.length} scheduled reports`);
```

## Integration Notes

- All monetary values are in Rwandan Francs (RWF)
- Date formats use ISO 8601 standard
- File downloads include appropriate MIME types and headers
- Large files are uploaded to cloud storage with signed download URLs
- Email notifications include both attachments and download links
- Scheduled reports run server-side using cron jobs
- Failed exports are logged for troubleshooting
- Reports can be cached for improved performance
