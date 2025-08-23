import { Metadata } from "next"
import { InvoicesHeader } from "@/components/invoices/invoices-header"
import { InvoicesList } from "@/components/invoices/invoices-list"

'use client';

import { useState } from 'react';
import { InvoiceHeader } from '@/components/invoices/invoice-header';
import { InvoicesList } from '@/components/invoices/invoices-list';
import { 
  useInvoices, 
  useRecordPayment, 
  useSendInvoiceEmail,
  useSendInvoiceSms,
  useDeleteInvoice,
  useBulkMarkPaid
} from '@/hooks/use-invoices';
import type { InvoiceFilters, Invoice } from '@/lib/types';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const [filters, setFilters] = useState<InvoiceFilters>({
    page: 1,
    limit: 20,
  });

  const { data: invoicesData, isLoading } = useInvoices(filters);
  const recordPaymentMutation = useRecordPayment();
  const sendEmailMutation = useSendInvoiceEmail();
  const sendSmsMutation = useSendInvoiceSms();
  const deleteInvoiceMutation = useDeleteInvoice();
  const bulkMarkPaidMutation = useBulkMarkPaid();

  const handleFiltersChange = (newFilters: InvoiceFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      await recordPaymentMutation.mutateAsync({
        id: invoice.id,
        payment: {
          amount: invoice.amountDue,
          method: 'CASH',
          notes: 'Marked as paid from invoice list',
        },
      });
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    try {
      await sendEmailMutation.mutateAsync({
        id: invoice.id,
        options: {},
      });
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleSendSms = async (invoice: Invoice) => {
    try {
      await sendSmsMutation.mutateAsync({
        id: invoice.id,
        options: {},
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      try {
        await deleteInvoiceMutation.mutateAsync(invoice.id);
      } catch (error) {
        console.error('Failed to delete invoice:', error);
      }
    }
  };

  const handleExport = (invoice: Invoice) => {
    // TODO: Implement PDF export
    toast.info('PDF export functionality coming soon');
  };

  const handleBulkAction = async (invoiceIds: string[], action: string) => {
    if (action === 'mark-paid') {
      try {
        await bulkMarkPaidMutation.mutateAsync({ invoiceIds });
      } catch (error) {
        console.error('Failed to bulk mark as paid:', error);
      }
    } else if (action === 'send-reminder') {
      // TODO: Implement bulk send reminders
      toast.info('Bulk reminders functionality coming soon');
    }
  };

  const handleExportAll = () => {
    // TODO: Implement bulk export
    toast.info('Bulk export functionality coming soon');
  };

  const invoices = invoicesData?.invoices || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <InvoiceHeader
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onExport={handleExportAll}
        isLoading={isLoading}
      />
      
      <InvoicesList
        invoices={invoices}
        isLoading={isLoading}
        onMarkPaid={handleMarkPaid}
        onSendEmail={handleSendEmail}
        onSendSms={handleSendSms}
        onDelete={handleDelete}
        onExport={handleExport}
        onBulkAction={handleBulkAction}
      />

      {/* Pagination */}
      {invoicesData?.pagination && invoicesData.pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handleFiltersChange({ page: Math.max(1, filters.page! - 1) })}
            disabled={filters.page === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {filters.page} of {invoicesData.pagination.pages}
          </span>
          <button
            onClick={() => handleFiltersChange({ page: Math.min(invoicesData.pagination.pages, filters.page! + 1) })}
            disabled={filters.page === invoicesData.pagination.pages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
