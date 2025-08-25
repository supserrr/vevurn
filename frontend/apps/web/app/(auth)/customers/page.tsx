'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Phone,
  Mail,
  User,
  Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type: 'REGULAR' | 'WHOLESALE' | 'WALK_IN';
  totalPurchases?: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

async function fetchCustomers(): Promise<Customer[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const response = await fetch(`${baseUrl}/api/customers`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // If endpoint doesn't exist, return mock data
    if (response.status === 404) {
      return [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+250788123456',
          address: 'Kigali, Rwanda',
          type: 'REGULAR',
          totalPurchases: 5,
          lastPurchaseDate: '2024-08-20',
          createdAt: '2024-07-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@business.com',
          phone: '+250788654321',
          address: 'Kigali, Rwanda',
          type: 'WHOLESALE',
          totalPurchases: 12,
          lastPurchaseDate: '2024-08-22',
          createdAt: '2024-06-10T14:30:00Z'
        },
        {
          id: '3',
          name: 'Walk-in Customer',
          type: 'WALK_IN',
          totalPurchases: 1,
          lastPurchaseDate: '2024-08-25',
          createdAt: '2024-08-25T09:15:00Z'
        }
      ];
    }
    throw new Error('Failed to fetch customers');
  }

  const data = await response.json();
  return data.data || [];
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const filteredCustomers = customers.filter((customer: Customer) => {
    return customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.phone?.includes(searchTerm);
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'WHOLESALE':
        return 'bg-purple-100 text-purple-800';
      case 'REGULAR':
        return 'bg-green-100 text-green-800';
      case 'WALK_IN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        Error loading customers. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">{customers.length} customers in database</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search customers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer: Customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <Badge className={getCustomerTypeColor(customer.type)}>
                    {customer.type.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {customer.email}
                  </div>
                )}
                
                {customer.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {customer.phone}
                  </div>
                )}
                
                {customer.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    {customer.address}
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total Purchases</p>
                      <p className="font-semibold">{customer.totalPurchases || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Purchase</p>
                      <p className="font-semibold">
                        {customer.lastPurchaseDate ? formatDate(customer.lastPurchaseDate) : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3">
                  <span className="text-xs text-gray-500">
                    Joined {formatDate(customer.createdAt)}
                  </span>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Customer Modal Placeholder */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Customer</h3>
            <p className="text-gray-600 mb-4">Customer form will be implemented in the next phase.</p>
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  toast.success('Customer form coming soon!');
                  setShowAddForm(false);
                }}
                className="flex-1"
              >
                Got It
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
