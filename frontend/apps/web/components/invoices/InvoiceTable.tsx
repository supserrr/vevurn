'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Mail, 
  MessageSquare, 
  DollarSign,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  saleId?: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issueDate: string | null;
  dueDate: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  selectedInvoices: string[];
  onSelectionChange: (selected: string[]) => void;
  onPageChange: (page: number) => void;
  totalPages: number;
  currentPage: number;
}

export function InvoiceTable({
  invoices,
  isLoading,
  selectedInvoices,
  onSelectionChange,
  onPageChange,
  totalPages,
  currentPage
}: InvoiceTableProps) {
  const router = useRouter();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(invoices.map(invoice => invoice.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedInvoices, invoiceId]);
    } else {
      onSelectionChange(selectedInvoices.filter(id => id !== invoiceId));
    }
  };

  const handleAction = async (action: string, invoiceId: string) => {
    switch (action) {
      case 'view':
        router.push(`/invoices/${invoiceId}` as any);
        break;
      case 'edit':
        router.push(`/invoices/${invoiceId}/edit` as any);
        break;
      case 'send-email':
        // Handle send email
        break;
      case 'send-sms':
        // Handle send SMS
        break;
      case 'mark-paid':
        // Handle mark as paid
        break;
      case 'delete':
        // Handle delete
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox disabled />
              </TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-6 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell className="text-right"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" /></TableCell>
                <TableCell className="text-right"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" /></TableCell>
                <TableCell className="text-right"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" /></TableCell>
                <TableCell><div className="h-6 w-6 bg-gray-200 rounded animate-pulse" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
        <p className="text-gray-600 mb-4">Create your first invoice to get started</p>
        <Button onClick={() => router.push('/invoices/create' as any)}>
          Create Invoice
        </Button>
      </div>
    );
  }

  const allSelected = invoices.length > 0 && selectedInvoices.length === invoices.length;
  const someSelected = selectedInvoices.length > 0 && selectedInvoices.length < invoices.length;

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                className={someSelected ? "data-[state=checked]:bg-blue-600" : ""}
              />
            </TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow 
              key={invoice.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`/invoices/${invoice.id}` as any)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedInvoices.includes(invoice.id)}
                  onCheckedChange={(checked) => 
                    handleSelectInvoice(invoice.id, checked as boolean)
                  }
                  aria-label={`Select invoice ${invoice.invoiceNumber}`}
                />
              </TableCell>
              <TableCell className="font-medium">
                {invoice.invoiceNumber}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{invoice.customer.name}</div>
                  <div className="text-sm text-gray-600">{invoice.customer.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell>
                {formatDate(invoice.issueDate)}
              </TableCell>
              <TableCell>
                <div className={`${
                  invoice.status === 'OVERDUE' ? 'text-red-600 font-medium' : ''
                }`}>
                  {formatDate(invoice.dueDate)}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(invoice.totalAmount)}
              </TableCell>
              <TableCell className="text-right">
                <span className={invoice.paidAmount > 0 ? 'text-green-600 font-medium' : ''}>
                  {formatCurrency(invoice.paidAmount)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className={`font-medium ${
                  invoice.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {formatCurrency(invoice.remainingAmount)}
                </span>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAction('view', invoice.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('edit', invoice.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Invoice
                    </DropdownMenuItem>
                    {invoice.status !== 'PAID' && (
                      <>
                        <DropdownMenuItem onClick={() => handleAction('send-email', invoice.id)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('send-sms', invoice.id)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send SMS
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('mark-paid', invoice.id)}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleAction('delete', invoice.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Invoice
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="flex items-center text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
