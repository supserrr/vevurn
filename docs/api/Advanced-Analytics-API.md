# Advanced Analytics API Documentation

The Advanced Analytics API provides sophisticated business intelligence features including profit margin analysis, customer lifetime value calculations, and inventory aging reports.

## Base URL
```
/api/analytics
```

## Authentication
All analytics endpoints require authentication and appropriate role permissions.

## Endpoints

### 1. Dashboard Summary
Get a comprehensive analytics dashboard with key metrics.

**Endpoint:** `GET /api/analytics/dashboard`

**Access:** All staff (Cashier, Supervisor, Manager, Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "profitMargins": {
      "totalProfit": 450000,
      "marginPercentage": 23.5,
      "isImproving": true,
      "changePercentage": 12.3
    },
    "topCustomers": [
      {
        "name": "John Doe",
        "predictedLTV": 2500000,
        "totalSpent": 850000,
        "segment": "vip"
      }
    ],
    "atRiskCustomers": {
      "count": 15,
      "totalValue": 1200000
    },
    "inventory": {
      "totalValue": 5400000,
      "deadStockValue": 230000,
      "deadStockItems": 25,
      "writeOffRecommended": 45000
    },
    "kpis": {
      "avgOrderValue": 125000,
      "customerRetentionRate": 78.5,
      "inventoryTurnover": 6.2
    }
  }
}
```

### 2. Profit Margin Analysis
Get detailed profit margin analysis with trends and forecasting.

**Endpoint:** `GET /api/analytics/profit-margins`

**Access:** Manager, Admin

**Query Parameters:**
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format  
- `groupBy` (optional): Group results by 'product', 'category', or 'both' (default: 'both')

**Example Request:**
```
GET /api/analytics/profit-margins?startDate=2024-01-01&endDate=2024-01-31&groupBy=both
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "revenue": 2500000,
      "cost": 1800000,
      "profit": 700000,
      "marginPercentage": 28.0
    },
    "byProduct": [
      {
        "productId": "prod_123",
        "productName": "iPhone 15 Pro",
        "revenue": 800000,
        "cost": 600000,
        "profit": 200000,
        "marginPercentage": 25.0,
        "unitsSold": 10
      }
    ],
    "byCategory": [
      {
        "category": "Smartphones",
        "revenue": 1500000,
        "cost": 1100000,
        "profit": 400000,
        "marginPercentage": 26.7
      }
    ],
    "byTimeRange": {
      "daily": [
        {
          "date": "2024-01-01",
          "profit": 25000,
          "margin": 24.5
        }
      ],
      "monthly": [
        {
          "month": "2024-01",
          "profit": 700000,
          "margin": 28.0
        }
      ]
    },
    "trends": {
      "isImproving": true,
      "changePercentage": 15.2,
      "forecast": 805000
    }
  }
}
```

### 3. Customer Lifetime Value Analysis
Calculate and analyze customer lifetime value with segmentation.

**Endpoint:** `GET /api/analytics/customer-ltv`

**Access:** Manager, Admin

**Query Parameters:**
- `customerId` (optional): Get LTV for specific customer
- `segment` (optional): Filter by segment ('all', 'vip', 'at-risk')

**Example Request:**
```
GET /api/analytics/customer-ltv?segment=vip
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "customerId": "cust_123",
      "customerName": "John Doe",
      "email": "john@example.com",
      "phone": "+250788123456",
      "metrics": {
        "totalPurchases": 25,
        "totalSpent": 1500000,
        "averageOrderValue": 60000,
        "purchaseFrequency": 2.5,
        "customerLifespan": 365,
        "predictedLTV": 3600000,
        "churnRisk": "low",
        "segment": "vip"
      },
      "history": {
        "firstPurchase": "2023-06-15T10:30:00Z",
        "lastPurchase": "2024-01-20T14:22:00Z",
        "totalTransactions": 25,
        "favoriteCategories": ["Smartphones", "Accessories", "Cases"],
        "preferredPaymentMethod": "MOBILE_MONEY"
      }
    }
  ]
}
```

### 4. Inventory Aging Report
Get comprehensive inventory aging analysis with actionable recommendations.

**Endpoint:** `GET /api/analytics/inventory-aging`

**Access:** Manager, Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalInventoryValue": 8500000,
      "totalAgedItems": 150,
      "totalDeadStock": 35,
      "writeOffRecommended": 280000
    },
    "agingBrackets": {
      "current": {
        "items": 500,
        "value": 6000000,
        "percentage": 70.6
      },
      "30-60days": {
        "items": 80,
        "value": 1200000,
        "percentage": 14.1
      },
      "60-90days": {
        "items": 45,
        "value": 750000,
        "percentage": 8.8
      },
      "90-180days": {
        "items": 25,
        "value": 270000,
        "percentage": 3.2
      },
      "over180days": {
        "items": 35,
        "value": 280000,
        "percentage": 3.3
      }
    },
    "deadStock": [
      {
        "productId": "prod_456",
        "productName": "Old Phone Model",
        "sku": "OPM-001",
        "quantity": 5,
        "value": 50000,
        "lastMovementDate": "2023-05-01T00:00:00Z",
        "daysInStock": 265,
        "recommendedAction": "writeoff"
      }
    ],
    "slowMoving": [
      {
        "productId": "prod_789",
        "productName": "Luxury Case",
        "turnoverRate": 2.1,
        "currentStock": 25,
        "averageDailySales": 0.15,
        "daysOfSupply": 167
      }
    ]
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info (development only)"
}
```

**Common Error Status Codes:**
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error

## Data Insights

### Profit Margin Analysis
- **Overall Metrics**: Total revenue, cost, profit, and margin percentage
- **Product Analysis**: Individual product performance and profitability
- **Category Analysis**: Category-wise profit margins
- **Time Series**: Daily and monthly profit trends
- **Forecasting**: Simple linear forecasting based on trends

### Customer Lifetime Value
- **Segmentation**: Customers categorized as VIP, Loyal, Regular, At-Risk, or New
- **Churn Risk**: Low, Medium, or High based on purchase recency
- **Predictive LTV**: Estimated lifetime value using frequency and order value
- **Purchase Patterns**: Favorite categories and payment preferences

### Inventory Aging
- **Aging Brackets**: Items categorized by days in stock
- **Dead Stock**: Items with no movement in 180+ days
- **Slow Moving**: Items with low turnover rates (< 4x per year)
- **Recommendations**: Specific actions for aged inventory (discount, writeoff, return)

## Caching

All analytics endpoints use Redis caching to improve performance:
- **Profit Margins**: Cached for 1 hour
- **Inventory Aging**: Cached for 6 hours
- **Customer LTV**: No caching (dynamic calculations)

## Usage Examples

### Get monthly profit analysis
```javascript
const response = await fetch('/api/analytics/profit-margins?startDate=2024-01-01&endDate=2024-01-31');
const data = await response.json();
console.log(`Monthly profit: ${data.data.overall.profit}`);
```

### Find at-risk customers
```javascript
const response = await fetch('/api/analytics/customer-ltv?segment=at-risk');
const customers = await response.json();
console.log(`${customers.data.length} customers at risk of churning`);
```

### Check dead stock
```javascript
const response = await fetch('/api/analytics/inventory-aging');
const report = await response.json();
const deadStockValue = report.data.agingBrackets.over180days.value;
console.log(`Dead stock value: ${deadStockValue}`);
```

## Integration Notes

- All monetary values are in Rwandan Francs (RWF)
- Date parameters should be in ISO format (YYYY-MM-DD)
- Results are sorted by relevance (highest profit, LTV, or aging severity)
- Large datasets are automatically paginated
- Use the dashboard endpoint for overview metrics
- Use specific endpoints for detailed analysis
