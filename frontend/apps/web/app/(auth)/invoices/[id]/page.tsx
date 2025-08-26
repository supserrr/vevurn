'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  MessageSquare, 
  DollarSign,
  Download,
  Printer,
  Eye,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin
} from 'lucide-react';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { PaymentRecordForm } from '@/components/invoices/PaymentRecordForm';
import { InvoiceReminders } from '@/components/invoices/InvoiceReminders';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const invoiceId = params.id as string;
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  // Fetch invoice details
  const { data: invoiceData, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }

      return response.json();
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Invoice email sent successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    },
    onError: () => {
      toast.error('Failed to send email');
    },
  });

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}/send-sms`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Invoice SMS sent successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    },
    onError: () => {
      toast.error('Failed to send SMS');
    },
  });

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to mark as paid');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Invoice marked as paid');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    },
    onError: () => {
      toast.error('Failed to mark as paid');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoiceData?.data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Invoice not found</p>
          <p className="text-gray-600">The invoice you're looking for doesn't exist</p>
          <Button 
            onClick={() => router.push('/invoices' as any)} 
            className="mt-4"
          >
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const invoice = invoiceData.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/invoices' as any)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-gray-600">
              Created on {formatDate(invoice.issueDate)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <InvoiceStatusBadge status={invoice.status} />
          
          {invoice.status !== 'PAID' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendEmailMutation.mutate()}
                disabled={sendEmailMutation.isPending}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendSmsMutation.mutate()}
                disabled={sendSmsMutation.isPending}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send SMS
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentForm(true)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/invoices/${invoiceId}/edit` as any)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.customer.name}</p>
                      <p className="text-gray-600">{invoice.customer.email}</p>
                      {invoice.customer.phone && (
                        <p className="text-gray-600 flex items-center mt-1">
                          <Phone className="w-4 h-4 mr-1" />
                          {invoice.customer.phone}
                        </p>
                      )}
                    </div>
                    {invoice.customer.address && (
                      <div>
                        <p className="text-gray-600 flex items-start">
                          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          {invoice.customer.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Information */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Invoice Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Issue Date</p>
                    <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className={`font-medium ${
                      invoice.status === 'OVERDUE' ? 'text-red-600' : ''
                    }`}>
                      {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Terms</p>
                    <p className="font-medium">{invoice.paymentTerms}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h3 className="text-lg font-medium mb-3">Invoice Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Description
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoice.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          Total Amount:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{invoice.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoice.payments.map((payment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(payment.createdAt)} via {payment.method}
                        </p>
                      </div>
                      <Badge variant="secondary">Paid</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid Amount:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoice.paidAmount)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining:</span>
                <span className={`font-bold ${
                  invoice.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {formatCurrency(invoice.remainingAmount)}
                </span>
              </div>
              
              {invoice.remainingAmount > 0 && invoice.status !== 'PAID' && (
                <Button
                  className="w-full mt-4"
                  onClick={() => markPaidMutation.mutate()}
                  disabled={markPaidMutation.isPending}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Mark as Paid
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                Preview PDF
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowReminders(true)}
              >
                <Clock className="w-4 h-4 mr-2" />
                Manage Reminders
              </Button>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Invoice Created</p>
                    <p className="text-xs text-gray-600">{formatDate(invoice.createdAt)}</p>
                  </div>
                </div>
                
                {invoice.sentAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Invoice Sent</p>
                      <p className="text-xs text-gray-600">{formatDate(invoice.sentAt)}</p>
                    </div>
                  </div>
                )}
                
                {invoice.viewedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Invoice Viewed</p>
                      <p className="text-xs text-gray-600">{formatDate(invoice.viewedAt)}</p>
                    </div>
                  </div>
                )}
                
                {invoice.status === 'PAID' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Invoice Paid</p>
                      <p className="text-xs text-gray-600">{formatDate(invoice.paidAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Record Form */}
      {showPaymentForm && (
        <PaymentRecordForm
          invoiceId={invoiceId}
          remainingAmount={invoice.remainingAmount}
          onClose={() => setShowPaymentForm(false)}
          onSuccess={() => {
            setShowPaymentForm(false);
            queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
          }}
        />
      )}

      {/* Invoice Reminders */}
      {showReminders && (
        <InvoiceReminders
          invoiceId={invoiceId}
          onClose={() => setShowReminders(false)}
        />
      )}
    </div>
  );
}
