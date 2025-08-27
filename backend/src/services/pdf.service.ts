import * as puppeteer from 'puppeteer';
import { logger } from '../utils/logger';

export class PDFService {
  private static browser: puppeteer.Browser | null = null;

  private static async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  static async generateInvoicePDF(invoiceData: any): Promise<Buffer> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      const html = this.generateInvoiceHTML(invoiceData);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        displayHeaderFooter: false,
        printBackground: true
      });
      
      await page.close();
      
      return Buffer.from(pdf);
    } catch (error) {
      logger.error('PDF generation failed:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  private static generateInvoiceHTML(invoice: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .invoice-title { font-size: 20px; margin: 20px 0; }
        .invoice-details { display: flex; justify-content: space-between; margin: 20px 0; }
        .customer-info, .invoice-info { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .total-section { margin-top: 20px; text-align: right; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">VEVURN ACCESSORIES</div>
        <div>Phone Accessories & Electronics</div>
        <div>Kigali, Rwanda | +250 XXX XXX XXX</div>
    </div>

    <div class="invoice-title">INVOICE #${invoice.invoiceNumber}</div>

    <div class="invoice-details">
        <div class="customer-info">
            <h3>Bill To:</h3>
            <p><strong>${invoice.customer ? `${invoice.customer.firstName} ${invoice.customer.lastName || ''}`.trim() : 'Walk-in Customer'}</strong></p>
            <p>${invoice.customer?.email || ''}</p>
            <p>${invoice.customer?.phone || ''}</p>
            <p>${invoice.customer?.address || ''}</p>
        </div>
        <div class="invoice-info">
            <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Payment Terms:</strong> ${invoice.paymentTerms || 'Net 30'}</p>
            <p><strong>Status:</strong> ${invoice.status}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${invoice.sale?.items?.map((item: any) => `
                <tr>
                    <td>${item.product?.name || 'Product'}</td>
                    <td>${item.quantity}</td>
                    <td>RWF ${Number(item.unitPrice).toLocaleString()}</td>
                    <td>RWF ${Number(item.totalPrice).toLocaleString()}</td>
                </tr>
            `).join('') || ''}
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>RWF ${Number(invoice.subtotal).toLocaleString()}</span>
        </div>
        <div class="total-row">
            <span>VAT (18%):</span>
            <span>RWF ${Number(invoice.taxAmount).toLocaleString()}</span>
        </div>
        ${invoice.discountAmount > 0 ? `
        <div class="total-row">
            <span>Discount:</span>
            <span>-RWF ${Number(invoice.discountAmount).toLocaleString()}</span>
        </div>
        ` : ''}
        <div class="total-row total-final">
            <span>Total Amount:</span>
            <span>RWF ${Number(invoice.totalAmount).toLocaleString()}</span>
        </div>
        <div class="total-row">
            <span>Amount Paid:</span>
            <span>RWF ${Number(invoice.amountPaid).toLocaleString()}</span>
        </div>
        <div class="total-row">
            <span>Amount Due:</span>
            <span>RWF ${Number(invoice.amountDue).toLocaleString()}</span>
        </div>
    </div>

    <div class="footer">
        <p>Thank you for your business!</p>
        <p>For support, contact us at support@vevurn.com</p>
    </div>
</body>
</html>`;
  }

  static async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}