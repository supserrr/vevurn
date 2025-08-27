import puppeteer from 'puppeteer';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';

class PDFService {
  async generateInvoicePDF(invoiceData: any): Promise<string> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      const html = this.generateInvoiceHTML(invoiceData);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfPath = path.join(process.cwd(), 'uploads', `invoice-${invoiceData.invoiceNumber}.pdf`);
      
      // Ensure uploads directory exists
      await fs.mkdir(path.dirname(pdfPath), { recursive: true });
      
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      await browser.close();
      
      logger.info('Invoice PDF generated successfully', { path: pdfPath });
      return pdfPath;
      
    } catch (error) {
      logger.error('Failed to generate invoice PDF:', error);
      throw error;
    }
  }

  async generateReceiptPDF(saleData: any): Promise<string> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      const html = this.generateReceiptHTML(saleData);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfPath = path.join(process.cwd(), 'uploads', `receipt-${saleData.saleNumber}.pdf`);
      
      // Ensure uploads directory exists
      await fs.mkdir(path.dirname(pdfPath), { recursive: true });
      
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15px',
          right: '15px',
          bottom: '15px',
          left: '15px'
        }
      });
      
      await browser.close();
      
      logger.info('Receipt PDF generated successfully', { path: pdfPath });
      return pdfPath;
      
    } catch (error) {
      logger.error('Failed to generate receipt PDF:', error);
      throw error;
    }
  }

  private generateInvoiceHTML(invoiceData: any): string {
    const items = invoiceData.sale?.items || [];
    const customer = invoiceData.customer || {};
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: 'Helvetica', Arial, sans-serif; margin: 0; padding: 0; color: #333; }
          .invoice-container { max-width: 800px; margin: 0 auto; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
          .company-info h1 { color: #2563eb; margin: 0; font-size: 32px; }
          .company-info p { margin: 5px 0; color: #666; }
          .invoice-info { text-align: right; }
          .invoice-number { font-size: 24px; font-weight: bold; color: #2563eb; }
          .billing-info { display: flex; justify-content: space-between; margin: 40px 0; }
          .billing-section h3 { margin: 0 0 15px 0; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 40px 0; }
          .items-table th { background: #f8fafc; border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: bold; color: #374151; }
          .items-table td { border: 1px solid #e5e7eb; padding: 12px; }
          .items-table .amount { text-align: right; }
          .totals { float: right; width: 300px; margin: 20px 0; }
          .totals table { width: 100%; }
          .totals td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
          .total-row { font-weight: bold; font-size: 18px; background: #f0f9ff; }
          .payment-info { margin: 40px 0; padding: 20px; background: #f8fafc; border-left: 4px solid #2563eb; }
          .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-info">
              <h1>Vevurn POS</h1>
              <p>Phone Accessories & Technology Solutions</p>
              <p>Kigali, Rwanda</p>
              <p>info@vevurn.com | +250 XXX XXX XXX</p>
            </div>
            <div class="invoice-info">
              <div class="invoice-number">INVOICE</div>
              <div class="invoice-number">${invoiceData.invoiceNumber}</div>
              <p>Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}</p>
              <p>Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div class="billing-info">
            <div class="billing-section">
              <h3>Bill To:</h3>
              <p><strong>${customer.firstName} ${customer.lastName || ''}</strong></p>
              ${customer.email ? `<p>Email: ${customer.email}</p>` : ''}
              ${customer.phone ? `<p>Phone: ${customer.phone}</p>` : ''}
              ${customer.address ? `<p>Address: ${customer.address}</p>` : ''}
              ${customer.companyName ? `<p>Company: ${customer.companyName}</p>` : ''}
            </div>
            <div class="billing-section">
              <h3>Payment Terms:</h3>
              <p>${invoiceData.paymentTerms || 'Net 30'}</p>
              <p>Status: <strong>${invoiceData.status}</strong></p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th class="amount">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>${item.product?.name || 'Product'}</td>
                  <td>${item.product?.sku || '-'}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unitPrice.toLocaleString()} RWF</td>
                  <td class="amount">${item.totalPrice.toLocaleString()} RWF</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td class="amount">${invoiceData.subtotal.toLocaleString()} RWF</td>
              </tr>
              ${invoiceData.taxAmount > 0 ? `
                <tr>
                  <td>Tax (18%):</td>
                  <td class="amount">${invoiceData.taxAmount.toLocaleString()} RWF</td>
                </tr>
              ` : ''}
              ${invoiceData.discountAmount > 0 ? `
                <tr>
                  <td>Discount:</td>
                  <td class="amount">-${invoiceData.discountAmount.toLocaleString()} RWF</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td><strong>Total Amount:</strong></td>
                <td class="amount"><strong>${invoiceData.totalAmount.toLocaleString()} RWF</strong></td>
              </tr>
              ${invoiceData.amountPaid > 0 ? `
                <tr>
                  <td>Amount Paid:</td>
                  <td class="amount">${invoiceData.amountPaid.toLocaleString()} RWF</td>
                </tr>
                <tr class="total-row">
                  <td><strong>Balance Due:</strong></td>
                  <td class="amount"><strong>${(invoiceData.totalAmount - invoiceData.amountPaid).toLocaleString()} RWF</strong></td>
                </tr>
              ` : ''}
            </table>
          </div>

          <div class="payment-info">
            <h3>Payment Information:</h3>
            <p><strong>MTN Mobile Money:</strong> *182*8*1*{amount}#${process.env.MOMO_MERCHANT_NUMBER || 'XXXXXXX'}#</p>
            <p><strong>Bank Transfer:</strong> Contact us for banking details</p>
            <p><strong>Cash Payment:</strong> Visit our store in Kigali</p>
            <p><strong>Payment Terms:</strong> ${invoiceData.paymentTerms || 'Payment due within 30 days'}</p>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated invoice. No signature required.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateReceiptHTML(saleData: any): string {
    const items = saleData.items || [];
    const customer = saleData.customer || {};
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${saleData.saleNumber}</title>
        <style>
          body { font-family: 'Helvetica', Arial, sans-serif; margin: 0; padding: 0; color: #333; }
          .receipt-container { max-width: 600px; margin: 0 auto; padding: 30px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
          .company-name { color: #10b981; font-size: 28px; font-weight: bold; margin: 0; }
          .receipt-number { font-size: 18px; font-weight: bold; margin: 10px 0; }
          .date { color: #666; }
          .customer-info { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 6px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #f8fafc; border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          .items-table td { border: 1px solid #e5e7eb; padding: 10px; }
          .items-table .amount { text-align: right; }
          .total-section { margin: 20px 0; text-align: right; }
          .total-row { font-size: 20px; font-weight: bold; color: #10b981; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1 class="company-name">Vevurn POS</h1>
            <p>Phone Accessories & Technology Solutions</p>
            <div class="receipt-number">Receipt #${saleData.saleNumber}</div>
            <div class="date">${new Date(saleData.createdAt).toLocaleDateString()} ${new Date(saleData.createdAt).toLocaleTimeString()}</div>
          </div>

          ${customer.firstName ? `
            <div class="customer-info">
              <strong>Customer:</strong> ${customer.firstName} ${customer.lastName || ''}<br>
              ${customer.phone ? `Phone: ${customer.phone}<br>` : ''}
              ${customer.email ? `Email: ${customer.email}` : ''}
            </div>
          ` : ''}

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th class="amount">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>${item.product?.name || 'Product'}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unitPrice.toLocaleString()} RWF</td>
                  <td class="amount">${item.totalPrice.toLocaleString()} RWF</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            ${saleData.discountAmount > 0 ? `<div>Discount: -${saleData.discountAmount.toLocaleString()} RWF</div>` : ''}
            ${saleData.taxAmount > 0 ? `<div>Tax: ${saleData.taxAmount.toLocaleString()} RWF</div>` : ''}
            <div class="total-row">Total: ${saleData.totalAmount.toLocaleString()} RWF</div>
            <div>Payment Method: ${saleData.paymentMethod || 'Cash'}</div>
          </div>

          <div class="footer">
            <p><strong>Thank you for shopping with us!</strong></p>
            <p>Vevurn POS - Kigali, Rwanda</p>
            <p>For support: info@vevurn.com | +250 XXX XXX XXX</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const pdfService = new PDFService();
