# PROJECT INTELLIGENCE - Vevurn POS System

## Project Overview
**Vevurn POS** is a comprehensive point-of-sale system specifically designed for phone accessories retail businesses in Rwanda. It integrates modern web technologies with local payment methods and business practices.

## Business Context

### Target Market
- **Primary**: Phone accessories retailers in Rwanda
- **Secondary**: Small to medium retail businesses
- **Geography**: Rwanda with potential for East African expansion

### Key Business Requirements
1. **Local Payment Integration**: MTN Mobile Money & Airtel Money
2. **Multi-language Support**: Kinyarwanda, English, French
3. **Offline Capability**: Limited offline functionality with sync
4. **Receipt Printing**: Thermal printer support
5. **Inventory Management**: Real-time stock tracking
6. **Role-based Access**: Multiple user roles and permissions
7. **Invoice & Credit Management**: Comprehensive billing system
8. **Customer Credit Tracking**: Credit limits and payment terms

## Technical Architecture

### Technology Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Express.js with TypeScript, Prisma ORM
- **Database**: PostgreSQL with Redis for caching
- **Authentication**: Better-Auth for modern auth flows
- **Payments**: MTN Mobile Money API integration
- **Real-time**: Socket.io for live updates
- **File Storage**: AWS S3 or local storage
- **Monitoring**: Winston for logging

### Architecture Principles
1. **Monorepo Structure**: Shared code and consistent tooling
2. **Clean Architecture**: Clear separation of concerns
3. **Type Safety**: TypeScript throughout the stack
4. **API-First**: RESTful APIs with proper documentation
5. **Scalability**: Designed for growth and expansion
6. **Security**: Proper authentication, authorization, and data protection

## Core Features

### 1. Point of Sale
- **Sales Processing**: Quick product lookup, barcode scanning
- **Cart Management**: Add/remove items, apply discounts
- **Payment Processing**: Cash, mobile money, card payments
- **Receipt Generation**: PDF and thermal printer support
- **Customer Management**: Quick customer lookup and creation
- **Invoice Creation**: Direct conversion from sales to invoices

### 2. Inventory Management
- **Product Catalog**: Categories, brands, specifications
- **Stock Tracking**: Real-time inventory levels
- **Low Stock Alerts**: Automated notifications
- **Purchase Orders**: Supplier management and ordering
- **Stock Movements**: Track all inventory changes

### 3. Customer Management
- **Customer Database**: Contact information, purchase history
- **Loyalty Program**: Points system and rewards
- **Customer Analytics**: Purchase patterns and preferences
- **Communication**: SMS/email notifications
- **Credit Management**: Credit limits, payment terms, billing info
- **Business Customer Support**: Company names, tax numbers

### 4. User Management
- **Role-based Access**: Super Admin, Admin, Manager, Cashier
- **User Permissions**: Granular access control
- **Activity Tracking**: Audit logs for all actions
- **Shift Management**: Cashier shift tracking and reports

### 5. Invoice & Billing System
- **Invoice Generation**: Create invoices from completed sales
- **Invoice Management**: Draft, sent, paid, overdue status tracking
- **Payment Tracking**: Partial payments, payment history
- **Credit Sales**: Support for credit transactions with payment terms
- **Consignment Sales**: Track consignment items and payments
- **Automated Reminders**: Email, SMS, and call reminders
- **Payment Terms**: Flexible payment terms configuration
- **Tax Compliance**: Rwanda VAT compliance (18% tax rate)
- **Multi-currency Support**: RWF primary with USD support

### 6. Reporting & Analytics
- **Sales Reports**: Daily, weekly, monthly summaries
- **Inventory Reports**: Stock levels, movement analysis
- **Financial Reports**: Revenue, profit margins
- **Customer Reports**: Purchase patterns, loyalty metrics
- **Invoice Reports**: Outstanding invoices, aging reports
- **Credit Reports**: Customer credit utilization and limits
- **Export Options**: PDF, Excel, CSV formats

### 7. Mobile Money Integration
- **MTN Mobile Money**: Collection API integration
- **Airtel Money**: Payment processing
- **Transaction Tracking**: Real-time payment status
- **Reconciliation**: Automated payment matching
- **Webhook Handling**: Payment confirmations
- **Invoice Payments**: Mobile money payments for invoices

### 8. Communication System
- **Email Integration**: Automated invoice and receipt sending
- **SMS Notifications**: Payment reminders and alerts
- **WhatsApp Integration**: Modern communication channel
- **Call Reminders**: Manual reminder tracking
- **Notification Templates**: Customizable message templates

## Data Model

### Core Entities
1. **Users**: Authentication and role management
2. **Products**: Product catalog with categories and brands
3. **Customers**: Enhanced customer information with billing details
4. **Sales**: Transaction records with invoice integration
5. **Invoices**: Complete invoice lifecycle management
6. **InvoiceReminders**: Automated reminder system
7. **Payments**: Payment tracking and reconciliation
8. **Inventory**: Stock levels and movements
9. **Suppliers**: Vendor management

### Enhanced Customer Model
- **Basic Info**: Name, phone, email, address
- **Business Info**: Company name, tax number, billing address
- **Credit Management**: Credit limit, current balance, payment terms
- **Communication Preferences**: Email, SMS, WhatsApp preferences

### Invoice Model
- **Core Details**: Invoice number, amounts, dates, status
- **Financial Tracking**: Subtotal, tax, discount, paid amounts
- **Status Management**: Draft → Sent → Paid/Overdue lifecycle
- **Communication**: Email/SMS sent tracking
- **Consignment**: Special handling for consignment sales

## Business Logic

### Invoice Workflow
1. **Sale Completion**: Sale marked as completed with customer
2. **Invoice Creation**: Option to create invoice from sale
3. **Invoice Processing**: Draft → Sent → Payment tracking
4. **Payment Management**: Partial payments, overpayments handling
5. **Status Updates**: Automatic status changes based on payments
6. **Overdue Management**: Automatic overdue detection and reminders

### Credit Management
- **Credit Limits**: Per-customer credit limits
- **Credit Utilization**: Track current outstanding amounts
- **Payment Terms**: Net 30, Net 60, custom terms
- **Credit Alerts**: Notifications when approaching limits

### Rwanda-Specific Features
- **Tax Compliance**: 18% VAT rate with proper invoice formatting
- **Business Registration**: Support for Rwanda business tax numbers
- **Local Currency**: Rwandan Franc (RWF) with proper formatting
- **Payment Methods**: Integration with local mobile money providers

## Project Structure

### Frontend (Next.js 15)
```
frontend/
├── app/             # App Router pages
├── components/      # React components
├── hooks/          # Custom hooks
├── lib/            # Utilities
├── store/          # State management
└── types/          # TypeScript types
```

### Backend (Express)
```
src/
├── controllers/    # Route handlers
├── services/       # Business logic
├── repositories/   # Data access
├── middlewares/    # Express middlewares
├── utils/          # Helpers
├── validators/     # Zod schemas
├── webhooks/       # Webhook handlers
└── types/          # TypeScript types
```

### Shared Components
```
shared/
├── src/
│   ├── types/      # Shared TypeScript interfaces
│   ├── validation/ # Zod schemas
│   └── utils/      # Common utilities
└── package.json
```

## Environment Variables Structure

Follow .env.example template:
- Never commit real credentials
- Use strong secrets (32+ characters)
- Document all variables
- Validate env vars on startup

## Current Focus Areas

1. **Invoice System Completion**: Full invoice lifecycle implementation
2. **Payment Integration**: MTN Mobile Money invoice payment
3. **Email/SMS System**: Communication infrastructure
4. **Credit Management**: Customer credit limit enforcement
5. **Reporting Dashboard**: Invoice and credit analytics
6. **Mobile Optimization**: Invoice management on mobile devices

## Known Constraints

- Must work reliably with intermittent internet (Rwanda)
- Support for French and English interfaces (future)
- Mobile-responsive for tablet POS systems
- Offline-first capability (future enhancement)
- Rwanda tax compliance requirements
- Local business practice integration

## Communication Style
When working on this project:

- Be explicit about design decisions
- Document everything inline and in separate docs
- Explain the why not just the what
- Provide examples for complex implementations
- Suggest improvements when you see opportunities

## AI Agent Context
This project is primarily developed using AI coding assistants. Each new conversation with an AI agent should:

- Start by referencing this PROJECT_INTELLIGENCE.md file
- Provide specific context about the current task
- Include relevant error messages in full
- Share the current file structure if relevant
- Specify the exact problem to be solved

The AI should always:

- Prioritize best practices over speed
- Choose maintainable solutions over clever ones
- Implement comprehensive error handling
- Follow the established patterns in the codebase
- Document all decisions and trade-offs

## Questions to Always Consider

- Is this the most maintainable solution?
- Will this scale to 1000+ products and 100+ daily transactions?
- Is the error handling comprehensive?
- Are we following security best practices?
- Is the code testable and tested?
- Will another developer understand this in 6 months?
- Does this support Rwanda business practices?
- Is the invoice system compliant with local regulations?

## When working with AI:

- Always review generated code for security and best practices
- Provide clear context using this PROJECT_INTELLIGENCE.md file
- Test all AI-generated code thoroughly
- Document AI-assisted sections for future maintainability
- Verify AI suggestions against project requirements

## Code Standards

- Always use TypeScript with strict mode
- Follow ESLint and Prettier configurations
- Write tests for critical business logic
- Document all APIs with clear examples
- Use conventional commits for version control

## Architecture Principles

- **Separation of Concerns**: Clear boundaries between layers
- **DRY (Don't Repeat Yourself)**: Reuse code through shared packages
- **SOLID Principles**: Especially Single Responsibility
- **Error Handling**: Always handle errors at the deepest layer first
- **Security First**: Validate all inputs, sanitize outputs

## Problem-Solving Approach
When encountering errors:

1. Simulate the complete user path that led to the error
2. Identify the deepest layer where the error originates
3. Fix from the bottom up (database → backend → frontend)
4. Add tests to prevent regression
5. Document the solution for future reference

## AI Agent Instructions
When an AI agent is assisting with this project:

- Always choose the better implementation over the quicker one
- Simulate user paths when debugging to understand the full context
- Fix errors from the deepest layer first (database → backend → frontend)
- Use webhooks for all real-time updates and notifications
- Follow monorepo structure strictly
- Document everything with clear examples
- Consider Rwanda-specific business requirements
- Ensure invoice system compliance with local practices
- **Always document what you just did**: Clearly explain changes made, files modified, and the reasoning behind decisions