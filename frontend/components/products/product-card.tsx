import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Package, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Copy,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
  minStock: number;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
  };
  images?: string[];
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onDuplicate?: (product: Product) => void;
  className?: string;
}

// Stock status helper
function getStockStatus(currentStock: number, minStock: number) {
  if (currentStock <= 0) return { status: 'out', label: 'Out of Stock', color: 'destructive' };
  if (currentStock <= minStock) return { status: 'low', label: 'Low Stock', color: 'warning' };
  return { status: 'in', label: 'In Stock', color: 'success' };
}

function StockStatusBadge({ currentStock, minStock }: { currentStock: number; minStock: number }) {
  const { label, color } = getStockStatus(currentStock, minStock);
  
  return (
    <Badge 
      variant={color === 'destructive' ? 'destructive' : color === 'warning' ? 'secondary' : 'default'}
      className={cn(
        color === 'success' && 'bg-green-100 text-green-800 hover:bg-green-100',
        color === 'warning' && 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      )}
    >
      {label}
    </Badge>
  );
}

export function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  className 
}: ProductCardProps) {
  return (
    <Card className={cn('group hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant={product.isActive ? 'default' : 'secondary'}>
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/products/${product.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(product)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(product)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(product.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Product Image Placeholder */}
        <div className="h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2" title={product.name}>
            {product.name}
          </h3>
          
          <p className="text-xs text-muted-foreground">
            {product.category?.name || 'Uncategorized'}
          </p>
          
          <p className="text-xs font-mono text-muted-foreground">
            SKU: {product.sku}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              {formatCurrency(product.unitPrice)}
            </span>
            <StockStatusBadge 
              currentStock={product.currentStock} 
              minStock={product.minStock} 
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Stock: {product.currentStock}</span>
            <span>Min: {product.minStock}</span>
          </div>
          
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2" title={product.description}>
              {product.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
