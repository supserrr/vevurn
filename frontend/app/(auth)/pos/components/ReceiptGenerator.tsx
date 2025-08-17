'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt,
  Printer,
  Download,
  Share2,
  CheckCircle,
  X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePOSStore } from '@/lib/store';

interface ReceiptGeneratorProps {
  className?: string;
}

export default function ReceiptGenerator({ className }: ReceiptGeneratorProps) {
  const {
    showReceipt,
    currentSale,
    cart,
    currentCustomer,
    paymentMethod,
    cashReceived,
    changeAmount,
    subtotal,
    taxAmount,
    totalAmount,
    setShowReceipt,
    resetTransaction
  } = usePOSStore();

  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setPrinting(true);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      // Generate the receipt HTML
      const receiptHTML = generateReceiptHTML();
      
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Print the receipt
      printWindow.focus();
      printWindow.print();
      
      // Close the print window after printing
      setTimeout(() => {
        printWindow.close();
      }, 1000);
      
    } catch (err) {
      console.error('Print error:', err);
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadReceipt = () => {
    const receiptHTML = generateReceiptHTML();
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${currentSale?.saleNumber || Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  };

  const handleNewSale = () => {
    setShowReceipt(false);
    resetTransaction();
  };

  const generateReceiptHTML = () => {
    const now = new Date();
    const saleNumber = currentSale?.saleNumber || `POS-${Date.now()}`;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${saleNumber}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              max-width: 300px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .store-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .store-info {
              font-size: 12px;
              margin-bottom: 2px;
            }
            .receipt-info {
              margin-bottom: 15px;
              font-size: 12px;
            }
            .items {
              margin-bottom: 15px;
            }
            .item {
              margin-bottom: 8px;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 5px;
            }
            .item-header {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
            }
            .item-details {
              font-size: 11px;
              color: #666;
              margin-top: 2px;
            }
            .totals {
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-bottom: 15px;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .total-line.grand-total {
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
              font-size: 14px;
            }
            .payment-info {
              margin-bottom: 15px;
              padding: 10px;
              background: #f5f5f5;
              border: 1px solid #ddd;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              margin-top: 20px;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">VEVURN POS</div>
            <div class="store-info">Phone Accessories Store</div>
            <div class="store-info">Kigali, Rwanda</div>
            <div class="store-info">Tel: +250 781 234 567</div>
          </div>
          
          <div class="receipt-info">
            <div><strong>Receipt #:</strong> ${saleNumber}</div>
            <div><strong>Date:</strong> ${now.toLocaleDateString()}</div>
            <div><strong>Time:</strong> ${now.toLocaleTimeString()}</div>
            ${currentCustomer ? `<div><strong>Customer:</strong> ${currentCustomer.name}</div>` : '<div><strong>Customer:</strong> Walk-in</div>'}
            ${currentCustomer?.phone ? `<div><strong>Phone:</strong> ${currentCustomer.phone}</div>` : ''}
          </div>
          
          <div class="items">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">ITEMS PURCHASED</div>
            ${cart.map(item => `
              <div class="item">
                <div class="item-header">
                  <span>${item.name}</span>
                </div>
                <div class="item-details">
                  SKU: ${item.sku} | Qty: ${item.quantity} x ${formatCurrency(item.unitPrice)}
                  ${item.discount > 0 ? `<br>Discount: ${formatCurrency(item.discount)}` : ''}
                </div>
                <div style="text-align: right; font-weight: bold; margin-top: 5px;">
                  ${formatCurrency(item.totalPrice)}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="total-line">
              <span>VAT (18%):</span>
              <span>${formatCurrency(taxAmount)}</span>
            </div>
            <div class="total-line grand-total">
              <span>TOTAL:</span>
              <span>${formatCurrency(totalAmount)}</span>
            </div>
          </div>
          
          <div class="payment-info">
            <div><strong>Payment Method:</strong> ${getPaymentMethodLabel(paymentMethod)}</div>
            ${paymentMethod === 'CASH' ? `
              <div><strong>Cash Received:</strong> ${formatCurrency(cashReceived)}</div>
              <div><strong>Change:</strong> ${formatCurrency(changeAmount)}</div>
            ` : ''}
            <div><strong>Status:</strong> PAID</div>
          </div>
          
          <div class="footer">
            <div>Thank you for shopping with us!</div>
            <div style="margin-top: 5px;">Visit us again soon</div>
            <div style="margin-top: 10px; font-size: 10px;">
              Powered by Vevurn POS System
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case 'CASH': return 'Cash';
      case 'MOMO_MTN': return 'MTN Mobile Money';
      case 'MOMO_AIRTEL': return 'Airtel Money';
      case 'BANK_TRANSFER': return 'Bank Transfer';
      case 'CARD': return 'Credit/Debit Card';
      default: return 'Unknown';
    }
  };

  if (!showReceipt || !currentSale) {
    return null;
  }

  return (
    <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Payment Successful!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Sale Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sale Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-mono">{currentSale.saleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Items:</span>
                <span>{cart.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span>{getPaymentMethodLabel(paymentMethod)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              {paymentMethod === 'CASH' && changeAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Change:</span>
                  <span>{formatCurrency(changeAmount)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receipt Actions */}
          <div className="space-y-3">
            <Button
              onClick={handlePrint}
              disabled={printing}
              className="w-full"
              size="lg"
            >
              <Printer className="h-4 w-4 mr-2" />
              {printing ? 'Printing...' : 'Print Receipt'}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadReceipt}
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Receipt ${currentSale.saleNumber}`,
                      text: `Receipt for sale ${currentSale.saleNumber} - Total: ${formatCurrency(totalAmount)}`
                    });
                  }
                }}
                size="sm"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* Continue Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleNewSale}
              variant="default"
              className="w-full"
              size="lg"
            >
              New Sale
            </Button>
            
            <Button
              onClick={() => setShowReceipt(false)}
              variant="outline"
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
