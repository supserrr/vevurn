# API Documentation

This directory contains documentation for the Vevurn POS Backend REST API endpoints.

## Contents

- [`ANALYTICS_CONTROLLER_API_DOCUMENTATION.md`](./ANALYTICS_CONTROLLER_API_DOCUMENTATION.md) - Analytics and reporting API endpoints

## API Overview

The backend provides RESTful APIs for:

- **Authentication** (`/api/auth/*`) - Better Auth endpoints
- **Users** (`/api/users`) - User management
- **Products** (`/api/products`) - Product catalog management
- **Categories** (`/api/categories`) - Product categories
- **Sales** (`/api/sales`) - Sales transactions and orders
- **Customers** (`/api/customers`) - Customer management
- **Suppliers** (`/api/suppliers`) - Supplier management
- **Loans** (`/api/loans`) - Loan tracking and management
- **Reports** (`/api/reports`) - Business intelligence and reporting
- **Settings** (`/api/settings`) - Application configuration
- **Analytics** (`/api/analytics`) - Business analytics and insights

## Base URL

- **Development:** `http://localhost:8001`
- **Production:** `https://vevurn.onrender.com`

## Authentication

All API endpoints (except public ones) require authentication via Better Auth. Include the session cookie or authorization header in your requests.

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {...},
  "timestamp": "2025-08-13T12:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-13T12:00:00.000Z"
}
```

## Testing

Use the testing scripts in `../scripts/testing/` to verify API functionality:

```bash
# Quick endpoint test
./scripts/testing/quick-test.sh

# Comprehensive API testing
node scripts/testing/backend-test.mjs
```
