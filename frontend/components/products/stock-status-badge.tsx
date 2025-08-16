import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export type StockStatus = 'in' | 'low' | 'out';

interface StockStatusBadgeProps {
  currentStock: number;
  minStock: number;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Stock status helper
export function getStockStatus(currentStock: number, minStock: number): {
  status: StockStatus;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
} {
  if (currentStock <= 0) {
    return {
      status: 'out',
      label: 'Out of Stock',
      color: 'destructive',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    };
  }
  
  if (currentStock <= minStock) {
    return {
      status: 'low',
      label: 'Low Stock',
      color: 'secondary',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    };
  }
  
  return {
    status: 'in',
    label: 'In Stock',
    color: 'default',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  };
}

export function StockStatusBadge({ 
  currentStock, 
  minStock, 
  className,
  showIcon = false,
  size = 'md'
}: StockStatusBadgeProps) {
  const { status, label, color, bgColor, textColor } = getStockStatus(currentStock, minStock);
  
  const getIcon = () => {
    switch (status) {
      case 'out':
        return <XCircle className="h-3 w-3" />;
      case 'low':
        return <AlertTriangle className="h-3 w-3" />;
      case 'in':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2',
  };

  return (
    <Badge 
      variant={color === 'destructive' ? 'destructive' : 'secondary'}
      className={cn(
        sizeClasses[size],
        status === 'in' && bgColor + ' ' + textColor + ' hover:' + bgColor,
        status === 'low' && bgColor + ' ' + textColor + ' hover:' + bgColor,
        'flex items-center gap-1',
        className
      )}
    >
      {showIcon && getIcon()}
      {label}
    </Badge>
  );
}

// Export the status types for use in other components
