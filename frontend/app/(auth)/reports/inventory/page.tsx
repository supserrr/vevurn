'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  Eye,
  Plus,
  Minus,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Inventory report interfaces
interface InventoryReportData {
  summary: {
    totalProducts: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    averageTurnover: number;
    totalCategories: number;
    lastUpdated: string;
  };
  stockLevels: {
    productId: string;
    productName: string;
    category: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    unitCost: number;
    unitPrice: number;
    totalValue: number;
    status: 'GOOD' | 'LOW' | 'OUT' | 'EXCESS';
    lastRestock: string;
    supplier: string;
  }[];
  categoryAnalysis: {
    category: string;
    totalProducts: number;
    totalValue: number;
    averageStock: number;
    lowStockCount: number;
    outOfStockCount: number;
    turnoverRate: number;
  }[];
  fastMovingProducts: {
    productId: string;
    productName: string;
    category: string;
    soldLastMonth: number;
    currentStock: number;
    daysOfStock: number;
    turnoverRate: number;
  }[];
  slowMovingProducts: {
    productId: string;
    productName: string;
    category: string;
    soldLastMonth: number;
    currentStock: number;
    daysOfStock: number;
    lastSale: string;
    totalValue: number;
  }[];
  stockMovements: {
    id: string;
    productName: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    reason: string;
    date: string;
    user: string;
  }[];
  restockAlerts: {
    productId: string;
    productName: string;
    currentStock: number;
    minStock: number;
    suggestedOrder: number;
    supplier: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
}

// Mock inventory report data
const mockInventoryData: InventoryReportData = {
  summary: {
    totalProducts: 248,
    totalValue: 28450000,
    lowStockItems: 23,
    outOfStockItems: 5,
    averageTurnover: 4.2,
    totalCategories: 5,
    lastUpdated: '2024-01-16T10:30:00Z',
  },
  stockLevels: [
    {
      productId: 'PRD-001',
      productName: 'iPhone 15 Pro Case Premium',
      category: 'Phone Cases',
      currentStock: 45,
      minStock: 20,
      maxStock: 100,
      unitCost: 9000,
      unitPrice: 15000,
      totalValue: 675000,
      status: 'GOOD',
      lastRestock: '2024-01-10',
      supplier: 'TechSupply Co.',
    },
    {
      productId: 'PRD-002',
      productName: 'Samsung Galaxy Screen Protector',
      category: 'Screen Protectors',
      currentStock: 15,
      minStock: 25,
      maxStock: 80,
      unitCost: 5600,
      unitPrice: 8000,
      totalValue: 120000,
      status: 'LOW',
      lastRestock: '2024-01-05',
      supplier: 'ProtectPro Ltd.',
    },
    {
      productId: 'PRD-003',
      productName: 'USB-C Cable Premium 2m',
      category: 'Chargers & Cables',
      currentStock: 0,
      minStock: 15,
      maxStock: 60,
      unitCost: 7000,
      unitPrice: 8000,
      totalValue: 0,
      status: 'OUT',
      lastRestock: '2023-12-28',
      supplier: 'CableTech Inc.',
    },
    {
      productId: 'PRD-004',
      productName: 'Wireless Charger Stand',
      category: 'Chargers & Cables',
      currentStock: 78,
      minStock: 10,
      maxStock: 50,
      unitCost: 10500,
      unitPrice: 15000,
      totalValue: 1170000,
      status: 'EXCESS',
      lastRestock: '2024-01-12',
      supplier: 'PowerTech Solutions',
    },
    {
      productId: 'PRD-005',
      productName: 'Car Phone Mount Magnetic',
      category: 'Phone Mounts',
      currentStock: 8,
      minStock: 12,
      maxStock: 40,
      unitCost: 6300,
      unitPrice: 9000,
      totalValue: 72000,
      status: 'LOW',
      lastRestock: '2024-01-08',
      supplier: 'AutoAccess Ltd.',
    },
  ],
  categoryAnalysis: [
    {
      category: 'Phone Cases',
      totalProducts: 89,
      totalValue: 12850000,
      averageStock: 34.5,
      lowStockCount: 8,
      outOfStockCount: 2,
      turnoverRate: 5.2,
    },
    {
      category: 'Screen Protectors',
      totalProducts: 67,
      totalValue: 6780000,
      averageStock: 28.1,
      lowStockCount: 12,
      outOfStockCount: 1,
      turnoverRate: 4.8,
    },
    {
      category: 'Chargers & Cables',
      totalProducts: 45,
      totalValue: 5640000,
      averageStock: 22.3,
      lowStockCount: 2,
      outOfStockCount: 2,
      turnoverRate: 3.9,
    },
    {
      category: 'Phone Mounts',
      totalProducts: 32,
      totalValue: 2180000,
      averageStock: 18.7,
      lowStockCount: 1,
      outOfStockCount: 0,
      turnoverRate: 3.2,
    },
    {
      category: 'Headphones',
      totalProducts: 15,
      totalValue: 1000000,
      averageStock: 15.2,
      lowStockCount: 0,
      outOfStockCount: 0,
      turnoverRate: 2.8,
    },
  ],
  fastMovingProducts: [
    {
      productId: 'PRD-001',
      productName: 'iPhone 15 Pro Case Premium',
      category: 'Phone Cases',
      soldLastMonth: 245,
      currentStock: 45,
      daysOfStock: 5.5,
      turnoverRate: 5.4,
    },
    {
      productId: 'PRD-002',
      productName: 'Samsung Galaxy Screen Protector',
      category: 'Screen Protectors',
      soldLastMonth: 198,
      currentStock: 15,
      daysOfStock: 2.3,
      turnoverRate: 13.2,
    },
    {
      productId: 'PRD-004',
      productName: 'Wireless Charger Stand',
      category: 'Chargers & Cables',
      soldLastMonth: 134,
      currentStock: 78,
      daysOfStock: 17.5,
      turnoverRate: 1.7,
    },
  ],
  slowMovingProducts: [
    {
      productId: 'PRD-020',
      productName: 'Vintage Phone Stand Wood',
      category: 'Phone Mounts',
      soldLastMonth: 2,
      currentStock: 45,
      daysOfStock: 675,
      lastSale: '2023-12-15',
      totalValue: 315000,
    },
    {
      productId: 'PRD-021',
      productName: 'Retro Wired Headphones',
      category: 'Headphones',
      soldLastMonth: 1,
      currentStock: 32,
      daysOfStock: 960,
      lastSale: '2023-11-28',
      totalValue: 224000,
    },
  ],
  stockMovements: [
    {
      id: 'MOV-001',
      productName: 'iPhone 15 Pro Case Premium',
      type: 'IN',
      quantity: 50,
      reason: 'Purchase Order #PO-2024-001',
      date: '2024-01-15T09:30:00Z',
      user: 'Alice Mukamana',
    },
    {
      id: 'MOV-002',
      productName: 'Samsung Galaxy Screen Protector',
      type: 'OUT',
      quantity: -25,
      reason: 'Sale #TXN-456',
      date: '2024-01-15T14:20:00Z',
      user: 'Jean Baptiste',
    },
    {
      id: 'MOV-003',
      productName: 'Wireless Charger Stand',
      type: 'ADJUSTMENT',
      quantity: -3,
      reason: 'Damaged items write-off',
      date: '2024-01-14T16:45:00Z',
      user: 'Grace Uwimana',
    },
  ],
  restockAlerts: [
    {
      productId: 'PRD-002',
      productName: 'Samsung Galaxy Screen Protector',
      currentStock: 15,
      minStock: 25,
      suggestedOrder: 50,
      supplier: 'ProtectPro Ltd.',
      priority: 'HIGH',
    },
    {
      productId: 'PRD-003',
      productName: 'USB-C Cable Premium 2m',
      currentStock: 0,
      minStock: 15,
      suggestedOrder: 40,
      supplier: 'CableTech Inc.',
      priority: 'HIGH',
    },
    {
      productId: 'PRD-005',
      productName: 'Car Phone Mount Magnetic',
      currentStock: 8,
      minStock: 12,
      suggestedOrder: 30,
      supplier: 'AutoAccess Ltd.',
      priority: 'MEDIUM',
    },
  ],
};

export default function InventoryReportPage() {
  const [inventoryData, setInventoryData] = useState<InventoryReportData>(mockInventoryData);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const loadInventoryData = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch inventory report data from API
        // const response = await ApiClient.request('/reports/inventory');
        // setInventoryData(response.data);
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        setInventoryData(mockInventoryData);
      } catch (error: any) {
        console.error('Failed to load inventory report:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInventoryData();
  }, []);

  const exportReport = () => {
    // In real app, call API to generate and download report
    console.log('Exporting inventory report...');
    
    // Simulate file download
    const csvContent = `Product,Category,Current Stock,Min Stock,Status,Value
${inventoryData.stockLevels.map(item => 
  `${item.productName},${item.category},${item.currentStock},${item.minStock},${item.status},${item.totalValue}`
).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'inventory-report.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'GOOD': return 'default';
      case 'LOW': return 'secondary';
      case 'OUT': return 'destructive';
      case 'EXCESS': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GOOD': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'LOW': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'OUT': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'EXCESS': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'secondary';
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN': return <Plus className="h-4 w-4 text-green-600" />;
      case 'OUT': return <Minus className="h-4 w-4 text-red-600" />;
      case 'ADJUSTMENT': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const filteredStockLevels = inventoryData.stockLevels.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Link>
          </Button>
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2"></div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Inventory Report</h1>
            <p className="text-muted-foreground">
              Stock levels, turnover analysis, and inventory management insights
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{inventoryData.summary.totalProducts}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {inventoryData.summary.totalCategories} categories
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
                <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold">{formatCurrency(inventoryData.summary.totalValue)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Current stock value
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-yellow-600">{inventoryData.summary.lowStockItems}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Require attention
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
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{inventoryData.summary.outOfStockItems}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Need immediate restock
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restock Alerts */}
      {inventoryData.restockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Restock Alerts
            </CardTitle>
            <CardDescription>Products that need immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryData.restockAlerts.map((alert) => (
                <div key={alert.productId} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">{alert.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        Current: {alert.currentStock} | Min: {alert.minStock} | Supplier: {alert.supplier}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">Order: {alert.suggestedOrder} units</p>
                      <Badge variant={getPriorityBadgeVariant(alert.priority)}>
                        {alert.priority} Priority
                      </Badge>
                    </div>
                    <Button size="sm">
                      Order Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="all">All Status</option>
          <option value="GOOD">Good Stock</option>
          <option value="LOW">Low Stock</option>
          <option value="OUT">Out of Stock</option>
          <option value="EXCESS">Excess Stock</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="all">All Categories</option>
          <option value="Phone Cases">Phone Cases</option>
          <option value="Screen Protectors">Screen Protectors</option>
          <option value="Chargers & Cables">Chargers & Cables</option>
          <option value="Phone Mounts">Phone Mounts</option>
          <option value="Headphones">Headphones</option>
        </select>
      </div>

      {/* Stock Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>Current inventory status for all products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredStockLevels.map((item) => (
              <div key={item.productId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category} • Supplier: {item.supplier}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last restock: {new Date(item.lastRestock).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current</p>
                    <p className={`font-semibold ${
                      item.status === 'OUT' ? 'text-red-600' :
                      item.status === 'LOW' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {item.currentStock}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Min</p>
                    <p className="font-medium">{item.minStock}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="font-semibold">{formatCurrency(item.totalValue)}</p>
                  </div>
                  
                  <Badge variant={getStatusBadgeVariant(item.status)}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Category Analysis</CardTitle>
            <CardDescription>Inventory breakdown by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryData.categoryAnalysis.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{category.category}</span>
                      <p className="text-sm text-muted-foreground">
                        {category.totalProducts} products • Turnover: {category.turnoverRate}x
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatCurrency(category.totalValue)}</span>
                      <p className="text-sm text-muted-foreground">
                        Avg stock: {Math.round(category.averageStock)}
                      </p>
                    </div>
                  </div>
                  
                  {(category.lowStockCount > 0 || category.outOfStockCount > 0) && (
                    <div className="flex gap-4 text-sm">
                      {category.lowStockCount > 0 && (
                        <span className="text-yellow-600">
                          {category.lowStockCount} low stock
                        </span>
                      )}
                      {category.outOfStockCount > 0 && (
                        <span className="text-red-600">
                          {category.outOfStockCount} out of stock
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fast Moving Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Fast Moving Products
            </CardTitle>
            <CardDescription>High turnover products requiring frequent restock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryData.fastMovingProducts.map((product) => (
                <div key={product.productId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category} • Sold: {product.soldLastMonth}/month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {product.daysOfStock.toFixed(1)} days stock
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Current: {product.currentStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slow Moving Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Slow Moving Products
          </CardTitle>
          <CardDescription>Products with low turnover that may need attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inventoryData.slowMovingProducts.map((product) => (
              <div key={product.productId} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">{product.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category} • Last sale: {new Date(product.lastSale).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(product.totalValue)}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.currentStock} units • {product.daysOfStock} days stock
                  </p>
                  <p className="text-xs text-yellow-600">
                    Only {product.soldLastMonth} sold last month
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Stock Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Stock Movements
          </CardTitle>
          <CardDescription>Latest inventory transactions and adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inventoryData.stockMovements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getMovementIcon(movement.type)}
                  <div>
                    <p className="font-medium">{movement.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {movement.reason} • By {movement.user}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(movement.date).toLocaleDateString()} at{' '}
                      {new Date(movement.date).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    movement.type === 'IN' ? 'text-green-600' :
                    movement.type === 'OUT' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {movement.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
