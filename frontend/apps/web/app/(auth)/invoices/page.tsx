'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  FileText, 
  Mail, 
  MessageSquare, 
  DollarSign,
  Calendar,
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoiceStats } from '@/components/invoices/InvoiceStats';
import { CreateInvoiceDialog } from '@/components/invoices/CreateInvoiceDialog';
import { toast } from 'react-hot-toast';

interface InvoiceFilters {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<InvoiceFilters>({
    page: 1,
    limit: 20
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  // Fetch invoices with filters
  const { data: invoicesData, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/invoices?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      return response.json();
    },
  });

  // Fetch invoice statistics
  const { data: statsData } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async () => {
      const response = await fetch('/api/invoices/stats', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice statistics');
      }

      return response.json();
    },
  });

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: status === 'all' ? undefined : status, 
      page: 1 
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleBulkAction = async (action: string) => {
    if (selectedInvoices.length === 0) {
      toast.error('Please select at least one invoice');
      return;
    }

    try {
      const response = await fetch(`/api/invoices/bulk/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ invoiceIds: selectedInvoices }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} invoices`);
      }

      toast.success(`Successfully ${action}ed ${selectedInvoices.length} invoice(s)`);
      setSelectedInvoices([]);
      refetch();
    } catch (error) {
      toast.error(`Failed to ${action} invoices`);
    }
  };

  const handleCreateInvoice = () => {
    setShowCreateDialog(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Error loading invoices</p>
          <p className="text-gray-600">Please try again later</p>
          <Button 
            onClick={() => refetch()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage customer invoices and payments</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => handleBulkAction('export')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateInvoice}>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Statistics */}
      {statsData && <InvoiceStats stats={statsData.data} />}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices by customer name, invoice number..."
                  className="pl-10"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="VIEWED">Viewed</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters */}
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedInvoices.length} invoice(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('send-email')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('send-sms')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send SMS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('mark-paid')}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Mark Paid
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
          </CardContent>
        </Card>
      )}

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <InvoiceTable
            invoices={invoicesData?.data?.invoices || []}
            isLoading={isLoading}
            selectedInvoices={selectedInvoices}
            onSelectionChange={setSelectedInvoices}
            onPageChange={handlePageChange}
            totalPages={invoicesData?.data?.totalPages || 1}
            currentPage={filters.page || 1}
          />
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </div>
  );
}
