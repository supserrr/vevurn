'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Download,
  Upload,
  UserPlus,
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

// Mock customers with enhanced data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+250788123456',
    email: 'john@example.com',
    address: 'Kigali, Nyarugenge District',
    type: 'RETAIL',
    status: 'ACTIVE',
    totalPurchases: 450000,
    totalOrders: 23,
    averageOrderValue: 19565,
    lastPurchase: '2024-01-15',
    dateJoined: '2023-08-15',
    loyaltyPoints: 450,
    outstandingBalance: 0,
    preferredPaymentMethod: 'MTN Mobile Money',
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '+250788234567',
    email: 'jane@company.com',
    address: 'Kigali, Gasabo District',
    type: 'WHOLESALE',
    status: 'ACTIVE',
    totalPurchases: 1200000,
    totalOrders: 45,
    averageOrderValue: 26667,
    lastPurchase: '2024-01-10',
    dateJoined: '2023-06-20',
    loyaltyPoints: 1200,
    creditLimit: 500000,
    outstandingBalance: 85000,
    preferredPaymentMethod: 'Bank Transfer',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    phone: '+250788345678',
    type: 'RETAIL',
    address: 'Kigali, Kicukiro District',
    status: 'ACTIVE',
    totalPurchases: 89000,
    totalOrders: 8,
    averageOrderValue: 11125,
    lastPurchase: '2024-01-08',
    dateJoined: '2023-12-10',
    loyaltyPoints: 89,
    outstandingBalance: 0,
    preferredPaymentMethod: 'Cash',
  },
  {
    id: '4',
    name: 'Alice Brown',
    phone: '+250788456789',
    email: 'alice@techcorp.com',
    address: 'Kigali, Nyarugenge District',
    type: 'WHOLESALE',
    status: 'ACTIVE',
    totalPurchases: 2100000,
    totalOrders: 67,
    averageOrderValue: 31343,
    lastPurchase: '2024-01-12',
    dateJoined: '2023-03-15',
    loyaltyPoints: 2100,
    creditLimit: 1000000,
    outstandingBalance: 150000,
    preferredPaymentMethod: 'MTN Mobile Money',
  },
  {
    id: '5',
    name: 'Mike Johnson',
    phone: '+250788567890',
    email: 'mike@gmail.com',
    type: 'RETAIL',
    status: 'INACTIVE',
    totalPurchases: 25000,
    totalOrders: 3,
    averageOrderValue: 8333,
    lastPurchase: '2023-11-20',
    dateJoined: '2023-11-01',
    loyaltyPoints: 25,
    outstandingBalance: 0,
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(customer => customer.type === selectedType);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(customer => customer.status === selectedStatus);
    }

    return filtered;
  }, [customers, searchTerm, selectedType, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedStatus]);

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      // In real app, call API to delete customer
      console.log('Deleting customer:', customerId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from state
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
    }
  };

  // Calculate summary stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalPurchases, 0);
  const averageOrderValue = customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / customers.length;

  const getStatusBadgeVariant = (status: Customer['status']) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'INACTIVE': return 'secondary';
      case 'BLOCKED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTypeBadgeVariant = (type: Customer['type']) => {
    return type === 'WHOLESALE' ? 'default' : 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage customer relationships and profiles
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button asChild>
            <Link href="/customers/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold">{activeCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers by name, phone, email, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">All Types</option>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
          <CardDescription>
            Manage your customer database and relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentCustomers.map((customer) => (
                <div key={customer.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        <Badge variant={getTypeBadgeVariant(customer.type)}>
                          {customer.type}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(customer.status)}>
                          {customer.status}
                        </Badge>
                        {customer.outstandingBalance > 0 && (
                          <Badge variant="destructive">
                            Outstanding: {formatCurrency(customer.outstandingBalance)}
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {customer.email}
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {customer.address}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Joined: {new Date(customer.dateJoined).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Total: {formatCurrency(customer.totalPurchases)}
                        </div>
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          {customer.totalOrders} orders • Avg: {formatCurrency(customer.averageOrderValue)}
                        </div>
                      </div>

                      {customer.lastPurchase && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Last purchase: {new Date(customer.lastPurchase).toLocaleDateString()}
                          {customer.loyaltyPoints > 0 && (
                            <span className="ml-4">Loyalty points: {customer.loyaltyPoints}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/customers/${customer.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/customers/${customer.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(customer.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of{' '}
                {filteredCustomers.length} customers
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
