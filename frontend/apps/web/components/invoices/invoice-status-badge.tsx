import { Badge } from '@/components/ui/badge';
import type { InvoiceStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  },
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  },
  SENT: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
  PAID: {
    label: 'Paid',
    color: 'bg-green-100 text-green-800 hover:bg-green-200',
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    color: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  },
  OVERDUE: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-800 hover:bg-red-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  },
} as const;

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="secondary"
      className={cn(
        config.color,
        'border-0 font-medium',
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
