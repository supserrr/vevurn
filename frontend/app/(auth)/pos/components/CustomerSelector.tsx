'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  User,
  Plus,
  Search,
  UserCheck,
  UserX
} from 'lucide-react';
import { usePOSStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import type { Customer } from '../../../../../shared/src/types';

interface CustomerSelectorProps {
  className?: string;
}

export default function CustomerSelector({ className }: CustomerSelectorProps) {
  const { currentCustomer, setCurrentCustomer } = usePOSStore();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  
  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<Customer[]>('/api/customers');
        
        if (response.success && response.data) {
          setCustomers(response.data);
        }
      } catch (err) {
        console.error('Error loading customers:', err);
      } finally {
        setLoading(false);
      }
    };

    if (showCustomerDialog) {
      loadCustomers();
    }
  }, [showCustomerDialog]);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const selectCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setShowCustomerDialog(false);
    setSearchQuery('');
  };

  const removeCustomer = () => {
    setCurrentCustomer(null);
  };

  const createCustomer = async () => {
    try {
      if (!newCustomer.name.trim()) return;
      
      const response = await apiClient.post<Customer>('/api/customers', newCustomer);
      
      if (response.success && response.data) {
        setCurrentCustomer(response.data);
        setCustomers(prev => [response.data, ...prev]);
        setNewCustomer({ name: '', email: '', phone: '', address: '' });
        setShowAddCustomerDialog(false);
      }
    } catch (err) {
      console.error('Error creating customer:', err);
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Customer
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          {currentCustomer ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{currentCustomer.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeCustomer}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>
              
              {currentCustomer.email && (
                <div className="text-sm text-muted-foreground">
                  Email: {currentCustomer.email}
                </div>
              )}
              
              {currentCustomer.phone && (
                <div className="text-sm text-muted-foreground">
                  Phone: {currentCustomer.phone}
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                Loyalty Points: {currentCustomer.loyaltyPoints || 0}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No customer selected (Guest sale)
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomerDialog(true)}
                  className="flex-1"
                >
                  <Search className="h-4 w-4 mr-1" />
                  Select
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCustomerDialog(true)}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading customers...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No customers found' : 'No customers available'}
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <Card
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => selectCustomer(customer)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{customer.name}</h4>
                          {customer.email && (
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                          )}
                          {customer.phone && (
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {customer.loyaltyPoints || 0} pts
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomerDialog} onOpenChange={setShowAddCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                placeholder="customer@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="0781234567"
              />
            </div>
            
            <div>
              <Label htmlFor="customerAddress">Address</Label>
              <Input
                id="customerAddress"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Customer address"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddCustomerDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={createCustomer}
                disabled={!newCustomer.name.trim()}
                className="flex-1"
              >
                Create Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
