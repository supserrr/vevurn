import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Download, Filter } from 'lucide-react';
import Link from 'next/link';
import { InvoiceStatus } from '@/lib/types';
import type { InvoiceFilters } from '@/lib/types';

interface InvoiceHeaderProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  onExport?: () => void;
  isLoading?: boolean;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export function InvoiceHeader({ 
  filters, 
  onFiltersChange, 
  onExport,
  isLoading = false 
}: InvoiceHeaderProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      status: value === '' ? undefined : [value as InvoiceStatus]
    });
  };

  const handleDateRangeChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    onFiltersChange({ ...filters, [field]: value || undefined });
  };

  return (
    <div className="space-y-4">
      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage customer invoices and billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              variant="outline"
              onClick={onExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          <Link href="/dashboard/invoices/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status?.[0] || ''}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Input
            type="date"
            placeholder="Start Date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleDateRangeChange('dateFrom', e.target.value)}
          />
          
          <Input
            type="date"
            placeholder="End Date"
            value={filters.dateTo || ''}
            onChange={(e) => handleDateRangeChange('dateTo', e.target.value)}
          />
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Quick filters:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ status: [InvoiceStatus.OVERDUE] })}
          >
            Overdue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ status: [InvoiceStatus.SENT] })}
          >
            Sent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ status: [InvoiceStatus.PAID] })}
          >
            Paid
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({})}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}
