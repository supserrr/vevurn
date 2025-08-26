'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InvoiceStatusBadgeProps {
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  className?: string;
}

const statusConfig = {
  DRAFT: {
    label: 'Draft',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  },
  SENT: {
    label: 'Sent',
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  VIEWED: {
    label: 'Viewed',
    variant: 'secondary' as const,
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
  },
  PAID: {
    label: 'Paid',
    variant: 'secondary' as const,
    className: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  OVERDUE: {
    label: 'Overdue',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 hover:bg-red-200'
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
