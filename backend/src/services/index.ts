// Services exports for Vevurn POS System

// Service exports
export { productsService } from './products.service';
export { EmailService } from './email.service';
export { SMSService } from './sms.service';
export { PDFService } from './pdf.service';
export { paymentService } from './payment.service';
export { invoiceService } from './invoices.service';

// MTN MoMo service (comment out if not available)
// export { mtnMomoService } from './mtn-momo.service';

// Dashboard service (comment out if not available)
// export { dashboardService } from './dashboard.service';

// Sales service 
export { SalesService } from './sales.service';

// Customers service
export { CustomersService } from './customers.service';

// Export service types
export type { 
  CreateProductSchema, 
  UpdateProductSchema 
} from './products.service';

export type { 
  CreatePaymentData, 
  PaymentResult 
} from './payment.service';

export type {
  MoMoTokenResponse,
  MoMoBalance,
  MoMoParty,
  MoMoRequestToPay,
  MoMoRequestToPayResult,
  MoMoError
} from './momo.service';
