'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Customer } from '@/lib/types';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // API call would go here
      // Mock data for now
      setCustomers([
        {
          id: '1',
          firstName: 'John',
          lastName: 'Uwimana',
          email: 'john.uwimana@email.com',
          phone: '+250781234567',
          address: 'Kigali, Rwanda',
          loyaltyPoints: 150,
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-08-01'),
        },
        {
          id: '2',
          firstName: 'Marie',
          lastName: 'Mukamana',
          email: 'marie.mukamana@email.com',
          phone: '+250782345678',
          address: 'Butare, Rwanda',
          loyaltyPoints: 320,
          isActive: true,
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date('2024-07-30'),
        },
        {
          id: '3',
          firstName: 'Paul',
          lastName: 'Nkurunziza',
          phone: '+250783456789',
          address: 'Musanze, Rwanda',
          loyaltyPoints: 75,
          isActive: true,
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-08-05'),
        },
      ]);
    } catch (error) {
      toast.error('Failed to fetch customers');
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchValue = searchTerm.toLowerCase();
    return (
      customer.firstName.toLowerCase().includes(searchValue) ||
      customer.lastName.toLowerCase().includes(searchValue) ||
      customer.email?.toLowerCase().includes(searchValue) ||
      customer.phone?.includes(searchValue)
    );
  });

  const getCustomerInitials = (customer: Customer) => {
    return `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();
  };

  const getLoyaltyLevel = (points: number) => {
    if (points >= 500) return { label: 'Gold', variant: 'default' as const, color: 'bg-yellow-500' };
    if (points >= 200) return { label: 'Silver', variant: 'secondary' as const, color: 'bg-gray-400' };
    return { label: 'Bronze', variant: 'outline' as const, color: 'bg-orange-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your customer database and loyalty program
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search customers by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-sm text-gray-500">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {customers.filter(c => c.isActive).length}
            </div>
            <p className="text-sm text-gray-500">Active Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {customers.reduce((sum, c) => sum + c.loyaltyPoints, 0)}
            </div>
            <p className="text-sm text-gray-500">Total Loyalty Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {customers.filter(c => c.loyaltyPoints >= 200).length}
            </div>
            <p className="text-sm text-gray-500">VIP Customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Loyalty Points</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const loyaltyLevel = getLoyaltyLevel(customer.loyaltyPoints);
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback>{getCustomerInitials(customer)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Customer since {customer.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{customer.address || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{customer.loyaltyPoints}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={loyaltyLevel.variant}>
                          <div className={`w-2 h-2 rounded-full ${loyaltyLevel.color} mr-1`} />
                          {loyaltyLevel.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
