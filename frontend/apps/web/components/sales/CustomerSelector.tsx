'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  UserPlus, 
  User, 
  Phone,
  Mail,
  Loader2,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'REGULAR' | 'WHOLESALE' | 'WALK_IN';
  totalPurchases?: number;
  createdAt: string;
}

interface CustomerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer | null) => void;
  selectedCustomer?: Customer | null;
}

interface NewCustomerData {
  name: string;
  email?: string;
  phone?: string;
  type: 'REGULAR' | 'WHOLESALE';
}

async function fetchCustomers(search: string = '') {
  const url = new URL('/api/customers', window.location.origin);
  if (search) url.searchParams.set('search', search);
  url.searchParams.set('limit', '50');

  const response = await fetch(url.toString(), {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }

  return response.json();
}

async function createCustomer(data: NewCustomerData) {
  const response = await fetch('/api/customers', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create customer');
  }

  return response.json();
}

export default function CustomerSelector({
  isOpen,
  onClose,
  onSelect,
  selectedCustomer
}: CustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState<NewCustomerData>({
    name: '',
    email: '',
    phone: '',
    type: 'REGULAR',
  });

  const queryClient = useQueryClient();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setShowNewCustomerForm(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        type: 'REGULAR',
      });
    }
  }, [isOpen]);

  const {
    data: customersData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: () => fetchCustomers(searchTerm),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      toast.success('Customer created successfully!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSelect(data);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });

  const customers = customersData?.customers || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSelectCustomer = (customer: Customer | null) => {
    onSelect(customer);
    onClose();
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCustomer.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    // Basic validation
    if (newCustomer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (newCustomer.phone && !/^[0-9+\-\s()]+$/.test(newCustomer.phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    createCustomerMutation.mutate({
      name: newCustomer.name.trim(),
      email: newCustomer.email?.trim() || undefined,
      phone: newCustomer.phone?.trim() || undefined,
      type: newCustomer.type,
    });
  };

  const filteredCustomers = customers.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Select Customer
          </DialogTitle>
        </DialogHeader>

        {!showNewCustomerForm ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Quick Options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                variant="outline"
                onClick={() => handleSelectCustomer(null)}
                className="h-12 flex items-center justify-center"
              >
                <User className="w-4 h-4 mr-2" />
                Walk-in Customer
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewCustomerForm(true)}
                className="h-12 flex items-center justify-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                New Customer
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading customers...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  Failed to load customers. Please try again.
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCustomers.map((customer: Customer) => (
                    <Card
                      key={customer.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedCustomer?.id === customer.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium">{customer.name}</h3>
                              <Badge 
                                variant={customer.type === 'WHOLESALE' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {customer.type === 'WHOLESALE' ? 'Wholesale' : 'Regular'}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              {customer.email && (
                                <div className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {customer.email}
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.totalPurchases !== undefined && (
                                <div className="text-gray-500">
                                  Total purchases: {formatCurrency(customer.totalPurchases)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {selectedCustomer?.id === customer.id && (
                            <Check className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* New Customer Form */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add New Customer</h3>
              <Button
                variant="ghost"
                onClick={() => setShowNewCustomerForm(false)}
                size="sm"
              >
                Back to Search
              </Button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="customerName">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerEmail">Email (Optional)</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="customer@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerPhone">Phone (Optional)</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="078xxxxxxx"
                    />
                  </div>
                </div>

                <div>
                  <Label>Customer Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { value: 'REGULAR', label: 'Regular Customer', description: 'Standard retail pricing' },
                      { value: 'WHOLESALE', label: 'Wholesale Customer', description: 'Wholesale pricing' },
                    ].map((type) => (
                      <Card
                        key={type.value}
                        className={`cursor-pointer transition-colors ${
                          newCustomer.type === type.value 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setNewCustomer(prev => ({ ...prev, type: type.value as 'REGULAR' | 'WHOLESALE' }))}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              newCustomer.type === type.value 
                                ? 'bg-blue-500 border-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {newCustomer.type === type.value && (
                                <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCustomerForm(false)}
                  disabled={createCustomerMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCustomerMutation.isPending || !newCustomer.name.trim()}
                  className="flex-1"
                >
                  {createCustomerMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Customer
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Current Selection Display */}
        {selectedCustomer && !showNewCustomerForm && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Selected: {selectedCustomer.name}</div>
                <div className="text-sm text-gray-500">
                  {selectedCustomer.type === 'WHOLESALE' ? 'Wholesale pricing will be applied' : 'Regular pricing will be applied'}
                </div>
              </div>
              <Button onClick={() => handleSelectCustomer(selectedCustomer)} size="sm">
                Confirm Selection
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
