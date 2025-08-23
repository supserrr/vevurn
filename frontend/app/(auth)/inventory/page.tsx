'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Upload,
  Plus,
  Minus,
  Eye,
  Calendar,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Interfaces for inventory management
interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  lastRestocked: string;
  lastSold: string;
  unitCost: number;
  unitPrice: number;
  totalValue: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  category: string;
  supplier: string;
  location: string;
}

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  reason: 'PURCHASE' | 'SALE' | 'RETURN' | 'DAMAGE' | 'EXPIRED' | 'CORRECTION' | 'RESTOCK';
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  unitCost?: number;
  totalValue: number;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  totalMovements24h: number;
  totalInbound24h: number;
  totalOutbound24h: number;
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Mock data - replace with actual API calls
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 1247,
    totalValue: 125000000, // RWF 125M
    lowStockItems: 23,
    outOfStockItems: 5,
    overstockItems: 12,
    totalMovements24h: 156,
    totalInbound24h: 45,
    totalOutbound24h: 111,
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: '1',
      productId: 'prod-1',
      productName: 'iPhone 15 Pro Case - Clear',
      sku: 'IPH15-CASE-001',
      currentStock: 5,
      minStock: 20,
      maxStock: 100,
      reorderLevel: 25,
      lastRestocked: '2025-08-20T10:30:00Z',
      lastSold: '2025-08-23T14:15:00Z',
      unitCost: 25000,
      unitPrice: 45000,
      totalValue: 225000, // 5 * 45000
      status: 'LOW_STOCK',
      category: 'iPhone Accessories',
      supplier: 'Tech Supply Co.',
      location: 'A1-B2',
    },
    {
      id: '2',
      productId: 'prod-2',
      productName: 'Samsung Galaxy S24 Screen Protector',
      sku: 'SAM-SCREEN-002',
      currentStock: 0,
      minStock: 15,
      maxStock: 80,
      reorderLevel: 20,
      lastRestocked: '2025-08-15T09:00:00Z',
      lastSold: '2025-08-23T12:30:00Z',
      unitCost: 8000,
      unitPrice: 15000,
      totalValue: 0,
      status: 'OUT_OF_STOCK',
      category: 'Samsung Accessories',
      supplier: 'Mobile Parts Ltd.',
      location: 'B1-C3',
    },
    {
      id: '3',
      productId: 'prod-3',
      productName: 'USB-C Fast Charger 65W',
      sku: 'USBC-CHAR-003',
      currentStock: 45,
      minStock: 10,
      maxStock: 50,
      reorderLevel: 15,
      lastRestocked: '2025-08-22T16:00:00Z',
      lastSold: '2025-08-23T13:45:00Z',
      unitCost: 35000,
      unitPrice: 65000,
      totalValue: 2925000, // 45 * 65000
      status: 'IN_STOCK',
      category: 'Chargers',
      supplier: 'Power Electronics',
      location: 'C2-D1',
    },
  ]);

  const [stockMovements, setStockMovements] = useState<StockMovement[]>([
    {
      id: '1',
      productId: 'prod-1',
      productName: 'iPhone 15 Pro Case - Clear',
      sku: 'IPH15-CASE-001',
      type: 'OUT',
      reason: 'SALE',
      quantity: 2,
      balanceBefore: 7,
      balanceAfter: 5,
      totalValue: 90000,
      reference: 'SALE-2025-0234',
      createdBy: 'John Clerk',
      createdAt: '2025-08-23T14:15:00Z',
    },
    {
      id: '2',
      productId: 'prod-3',
      productName: 'USB-C Fast Charger 65W',
      sku: 'USBC-CHAR-003',
      type: 'IN',
      reason: 'RESTOCK',
      quantity: 25,
      balanceBefore: 20,
      balanceAfter: 45,
      unitCost: 35000,
      totalValue: 875000,
      reference: 'PO-2025-0045',
      notes: 'Weekly restock from Power Electronics',
      createdBy: 'Store Manager',
      createdAt: '2025-08-22T16:00:00Z',
    },
    {
      id: '3',
      productId: 'prod-2',
      productName: 'Samsung Galaxy S24 Screen Protector',
      sku: 'SAM-SCREEN-002',
      type: 'OUT',
      reason: 'SALE',
      quantity: 1,
      balanceBefore: 1,
      balanceAfter: 0,
      totalValue: 15000,
      reference: 'SALE-2025-0233',
      createdBy: 'Jane Clerk',
      createdAt: '2025-08-23T12:30:00Z',
    },
  ]);

  // Filter items based on search and status
  const filteredInventoryItems = useMemo(() => {
    let filtered = inventoryItems;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.supplier.toLowerCase().includes(query)
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    return filtered;
  }, [inventoryItems, searchQuery, selectedStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>;
      case 'LOW_STOCK':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      case 'OUT_OF_STOCK':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'OVERSTOCK':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Overstock</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMovementIcon = (type: string, reason: string) => {
    if (type === 'IN') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (type === 'OUT') {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    } else {
      return <ArrowUpDown className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Load data on component mount
  useEffect(() => {
    // Simulate API loading
    const loadData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (err) {
        setError('Failed to load inventory data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Monitor stock levels, track movements, and manage reorders
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Value: {formatCurrency(stats.totalValue)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Out of stock: {stats.outOfStockItems}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">24h Inbound</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalInbound24h}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Items received
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">24h Outbound</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalOutbound24h}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Items sold
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Stock Overview</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="alerts">Reorder Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, SKU, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="OVERSTOCK">Overstock</option>
            </select>
          </div>

          {/* Inventory Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels ({filteredInventoryItems.length} items)</CardTitle>
              <CardDescription>Current inventory status and stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInventoryItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium">{item.productName}</h4>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.sku} • Category: {item.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Location: {item.location} • Supplier: {item.supplier}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm font-medium">Current Stock</p>
                        <p className="text-2xl font-bold">{item.currentStock}</p>
                        <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium">Value</p>
                        <p className="text-lg font-semibold">{formatCurrency(item.totalValue)}</p>
                        <p className="text-xs text-muted-foreground">
                          @{formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium">Status</p>
                        {getStatusBadge(item.status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          Reorder: {item.reorderLevel}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/products/${item.productId}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>Track all inventory ins and outs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getMovementIcon(movement.type, movement.reason)}
                      <div>
                        <h4 className="font-medium">{movement.productName}</h4>
                        <p className="text-sm text-muted-foreground">
                          SKU: {movement.sku} • {movement.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          By {movement.createdBy} • {formatDateTime(movement.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm font-medium">Quantity</p>
                        <p className={`text-lg font-bold ${movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium">Balance</p>
                        <p className="text-lg font-semibold">
                          {movement.balanceBefore} → {movement.balanceAfter}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium">Value</p>
                        <p className="text-lg font-semibold">{formatCurrency(movement.totalValue)}</p>
                        {movement.reference && (
                          <p className="text-xs text-muted-foreground">Ref: {movement.reference}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Reorder Alerts
              </CardTitle>
              <CardDescription>Products that need immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryItems
                  .filter(item => item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK')
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                      <div>
                        <h4 className="font-medium">{item.productName}</h4>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.sku} • Supplier: {item.supplier}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last restocked: {formatDateTime(item.lastRestocked)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-red-600">Current Stock</p>
                          <p className="text-2xl font-bold text-red-600">{item.currentStock}</p>
                          <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm font-medium">Suggested Order</p>
                          <p className="text-lg font-bold text-green-600">
                            {item.maxStock - item.currentStock}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cost: {formatCurrency((item.maxStock - item.currentStock) * item.unitCost)}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Create PO
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
