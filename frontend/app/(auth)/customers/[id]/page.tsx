'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Gift,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  Receipt,
  Star,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Enhanced Customer interface
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type: 'RETAIL' | 'WHOLESALE';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  totalPurchases: number;
  totalOrders: number;
  averageOrderValue: number;
  lastPurchase?: string;
  dateJoined: string;
  notes?: string;
  loyaltyPoints: number;
  creditLimit?: number;
  outstandingBalance: number;
  preferredPaymentMethod?: string;
}

// Purchase history interface
interface PurchaseHistory {
  id: string;
  date: string;
  total: number;
  items: number;
  paymentMethod: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'REFUNDED';
}

// Mock customer data
const mockCustomer: Customer = {
  id: '2',
  name: 'Jane Smith',
  phone: '+250788234567',
  email: 'jane@company.com',
  address: 'Kigali, Gasabo District, KG 123 St',
  type: 'WHOLESALE',
  status: 'ACTIVE',
  totalPurchases: 1200000,
  totalOrders: 45,
  averageOrderValue: 26667,
  lastPurchase: '2024-01-10',
  dateJoined: '2023-06-20',
  notes: 'VIP customer, prefers bulk orders. Contact for monthly inventory planning.',
  loyaltyPoints: 1200,
  creditLimit: 500000,
  outstandingBalance: 85000,
  preferredPaymentMethod: 'Bank Transfer',
};

// Mock purchase history
const mockPurchaseHistory: PurchaseHistory[] = [
  {
    id: 'PUR-001',
    date: '2024-01-10T14:30:00Z',
    total: 45000,
    items: 3,
    paymentMethod: 'Bank Transfer',
    status: 'COMPLETED',
  },
  {
    id: 'PUR-002',
    date: '2024-01-08T10:15:00Z',
    total: 32000,
    items: 2,
    paymentMethod: 'MTN Mobile Money',
    status: 'COMPLETED',
  },
  {
    id: 'PUR-003',
    date: '2024-01-05T16:45:00Z',
    total: 78000,
    items: 5,
    paymentMethod: 'Bank Transfer',
    status: 'COMPLETED',
  },
  {
    id: 'PUR-004',
    date: '2024-01-03T11:20:00Z',
    total: 25000,
    items: 1,
    paymentMethod: 'Cash',
    status: 'COMPLETED',
  },
  {
    id: 'PUR-005',
    date: '2023-12-28T09:30:00Z',
    total: 156000,
    items: 8,
    paymentMethod: 'Bank Transfer',
    status: 'COMPLETED',
  },
];

export default function CustomerDetailsPage() {
  const [customer, setCustomer] = useState<Customer>(mockCustomer);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>(mockPurchaseHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const loadCustomer = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch customer by ID from API
        // const response = await ApiClient.request(`/customers/${params.id}`);
        // setCustomer(response.data.customer);
        // setPurchaseHistory(response.data.purchaseHistory);
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 500));
        setCustomer(mockCustomer);
        setPurchaseHistory(mockPurchaseHistory);
      } catch (error: any) {
        console.error('Failed to load customer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      // In real app, call API to delete customer
      console.log('Deleting customer:', params.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to customers list
      router.push('/customers');
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeVariant = (status: Customer['status']) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'INACTIVE': return 'secondary';
      case 'BLOCKED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPurchaseStatusBadgeVariant = (status: PurchaseHistory['status']) => {
    switch (status) {
      case 'COMPLETED': return 'default';
      case 'PENDING': return 'secondary';
      case 'CANCELLED': return 'destructive';
      case 'REFUNDED': return 'outline';
      default: return 'secondary';
    }
  };

  // Calculate metrics
  const recentPurchases = purchaseHistory.slice(0, 5);
  const totalSpentThisMonth = purchaseHistory
    .filter(p => new Date(p.date).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + p.total, 0);
  
  const creditUtilization = customer.creditLimit 
    ? (customer.outstandingBalance / customer.creditLimit) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Link>
          </Button>
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2"></div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-24 bg-muted animate-pulse rounded-lg"></div>
          </div>
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
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">
              {customer.type} Customer • Joined {new Date(customer.dateJoined).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/customers/${customer.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customer Information</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={customer.type === 'WHOLESALE' ? 'default' : 'outline'}>
                    {customer.type}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(customer.status)}>
                    {customer.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined: {new Date(customer.dateJoined).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {customer.preferredPaymentMethod && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>Prefers: {customer.preferredPaymentMethod}</span>
                    </div>
                  )}
                  {customer.lastPurchase && (
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span>Last purchase: {new Date(customer.lastPurchase).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                    <span>Loyalty points: {customer.loyaltyPoints}</span>
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-muted-foreground">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Purchase Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Spent:</span>
                    <span className="font-semibold text-lg">{formatCurrency(customer.totalPurchases)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Orders:</span>
                    <span className="font-medium">{customer.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Order:</span>
                    <span className="font-medium">{formatCurrency(customer.averageOrderValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">This Month:</span>
                    <span className="font-medium text-green-600">{formatCurrency(totalSpentThisMonth)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {customer.type === 'WHOLESALE' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Credit Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Credit Limit:</span>
                      <span className="font-medium">{formatCurrency(customer.creditLimit || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outstanding:</span>
                      <span className={`font-semibold ${
                        customer.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(customer.outstandingBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available Credit:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency((customer.creditLimit || 0) - customer.outstandingBalance)}
                      </span>
                    </div>
                  </div>

                  {customer.creditLimit && (
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Credit Utilization</span>
                        <span>{creditUtilization.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            creditUtilization > 80 ? 'bg-red-500' : 
                            creditUtilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Recent Purchase History
              </CardTitle>
              <CardDescription>Last 5 transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{purchase.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(purchase.date).toLocaleDateString()} • {purchase.items} items
                        </p>
                        <p className="text-xs text-muted-foreground">{purchase.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(purchase.total)}</p>
                      <Badge variant={getPurchaseStatusBadgeVariant(purchase.status)} className="text-xs">
                        {purchase.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center">
                <Button variant="outline">
                  View All Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link href={`/pos?customer=${customer.id}`}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  New Sale
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/customers/${customer.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Call Customer
              </Button>
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </CardContent>
          </Card>

          {/* Customer Rating */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-6 w-6 ${
                        customer.totalPurchases > 1000000 && star <= 5 ? 'text-yellow-400 fill-current' :
                        customer.totalPurchases > 500000 && star <= 4 ? 'text-yellow-400 fill-current' :
                        customer.totalPurchases > 200000 && star <= 3 ? 'text-yellow-400 fill-current' :
                        customer.totalPurchases > 50000 && star <= 2 ? 'text-yellow-400 fill-current' :
                        star <= 1 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {customer.totalPurchases > 1000000 ? 'VIP Customer' :
                   customer.totalPurchases > 500000 ? 'Premium Customer' :
                   customer.totalPurchases > 200000 ? 'Valued Customer' :
                   customer.totalPurchases > 50000 ? 'Regular Customer' : 'New Customer'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Based on purchase history
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {customer.outstandingBalance > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Customer has an outstanding balance of {formatCurrency(customer.outstandingBalance)}
              </AlertDescription>
            </Alert>
          )}

          {customer.status === 'INACTIVE' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Customer is marked as inactive. Last purchase was {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'unknown'}.
              </AlertDescription>
            </Alert>
          )}

          {customer.type === 'WHOLESALE' && creditUtilization > 80 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                High credit utilization ({creditUtilization.toFixed(1)}%). Consider reviewing credit terms.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
