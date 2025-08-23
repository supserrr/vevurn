import { useState } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Mail, 
  MessageSquare, 
  DollarSign,
  Trash2,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { InvoiceStatusBadge } from './invoice-status-badge';
import type { Invoice } from '@/lib/types';
import { cn } from '@/lib/utils';

interface InvoicesListProps {
  invoices: Invoice[];
  isLoading?: boolean;
  onMarkPaid?: (invoice: Invoice) => void;
  onSendEmail?: (invoice: Invoice) => void;
  onSendSms?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onExport?: (invoice: Invoice) => void;
  onBulkAction?: (invoiceIds: string[], action: string) => void;
}

export function InvoicesList({
  invoices,
  isLoading = false,
  onMarkPaid,
  onSendEmail,
  onSendSms,
  onDelete,
  onExport,
  onBulkAction,
}: InvoicesListProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(invoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, invoiceId]);
    } else {
      setSelectedInvoices(selectedInvoices.filter(id => id !== invoiceId));
    }
  };

  const formatCustomerName = (customer: any) => {
    if (!customer) return 'Unknown Customer';
    if (customer.firstName || customer.lastName) {
      return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    }
    return customer.name || 'Unknown Customer';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const isOverdue = (dueDate: string | Date, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'PAID' && status !== 'CANCELLED';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <DollarSign className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
        <p className="text-muted-foreground mb-4">
          Get started by creating your first invoice.
        </p>
        <Link href="/dashboard/invoices/create">
          <Button>Create Invoice</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium">
            {selectedInvoices.length} invoice(s) selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              onClick={() => onBulkAction?.(selectedInvoices, 'mark-paid')}
            >
              Mark as Paid
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction?.(selectedInvoices, 'send-reminder')}
            >
              Send Reminders
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedInvoices([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedInvoices.length === invoices.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className={cn(
                  "hover:bg-muted/50",
                  isOverdue(invoice.dueDate, invoice.status) && "bg-red-50 hover:bg-red-100"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedInvoices.includes(invoice.id)}
                    onCheckedChange={(checked) => 
                      handleSelectInvoice(invoice.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{formatCustomerName(invoice.customer)}</div>
                    <div className="text-sm text-muted-foreground">
                      {invoice.customer?.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{formatCurrency(invoice.totalAmount)}</div>
                    {invoice.amountPaid > 0 && (
                      <div className="text-sm text-green-600">
                        Paid: {formatCurrency(invoice.amountPaid)}
                      </div>
                    )}
                    {invoice.amountDue > 0 && (
                      <div className="text-sm text-red-600">
                        Due: {formatCurrency(invoice.amountDue)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={cn(
                    isOverdue(invoice.dueDate, invoice.status) && "text-red-600 font-medium"
                  )}>
                    {formatDate(invoice.dueDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(invoice.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Invoice
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {invoice.status !== 'PAID' && onMarkPaid && (
                        <DropdownMenuItem onClick={() => onMarkPaid(invoice)}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      {onSendEmail && (
                        <DropdownMenuItem onClick={() => onSendEmail(invoice)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                      )}
                      {onSendSms && (
                        <DropdownMenuItem onClick={() => onSendSms(invoice)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send SMS
                        </DropdownMenuItem>
                      )}
                      {onExport && (
                        <DropdownMenuItem onClick={() => onExport(invoice)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {onDelete && invoice.status === 'DRAFT' && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(invoice)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Invoice
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
