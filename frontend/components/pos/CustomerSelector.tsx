'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Plus,
  User,
  Phone,
  Mail,
  X,
  Check,
} from 'lucide-react';
import { Customer } from '@/types/pos';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onClose: () => void;
}

// Mock customers
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+250788123456',
    email: 'john@example.com',
    type: 'RETAIL',
    totalPurchases: 450000,
    lastPurchase: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '+250788234567',
    email: 'jane@example.com',
    type: 'WHOLESALE',
    totalPurchases: 1200000,
    lastPurchase: '2024-01-10',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    phone: '+250788345678',
    type: 'RETAIL',
    totalPurchases: 89000,
    lastPurchase: '2024-01-08',
  },
  {
    id: '4',
    name: 'Alice Brown',
    phone: '+250788456789',
    email: 'alice@company.com',
    type: 'WHOLESALE',
    totalPurchases: 2100000,
    lastPurchase: '2024-01-12',
  },
];

export default function CustomerSelector({ selectedCustomer, onCustomerSelect, onClose }: CustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'RETAIL' as 'RETAIL' | 'WHOLESALE',
  });

  // Filter customers
  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert('Name and phone are required');
      return;
    }

    const customer: Customer = {
      id: Date.now().toString(),
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || undefined,
      type: newCustomer.type,
      totalPurchases: 0,
    };

    // In real app, save to database
    console.log('Creating customer:', customer);
    
    onCustomerSelect(customer);
    onClose();
  };

  const selectWalkInCustomer = () => {
    onCustomerSelect(null); // null represents walk-in customer
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Customer</CardTitle>
              <CardDescription>
                Choose a customer or create a new one
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="p-4 border-b space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={selectWalkInCustomer}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-2" />
                Walk-in Customer
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Customer
              </Button>
            </div>
          </div>

          {/* New Customer Form */}
          {showNewCustomerForm && (
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-semibold mb-3">Create New Customer</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newName">Name *</Label>
                  <Input
                    id="newName"
                    placeholder="Customer name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPhone">Phone *</Label>
                  <Input
                    id="newPhone"
                    placeholder="+250788123456"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="customer@example.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newType">Customer Type</Label>
                  <select
                    id="newType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newCustomer.type}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, type: e.target.value as 'RETAIL' | 'WHOLESALE' }))}
                  >
                    <option value="RETAIL">Retail Customer</option>
                    <option value="WHOLESALE">Wholesale Customer</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleCreateCustomer} disabled={!newCustomer.name || !newCustomer.phone}>
                  <Check className="h-4 w-4 mr-2" />
                  Create & Select
                </Button>
                <Button variant="outline" onClick={() => setShowNewCustomerForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Customer List */}
          <div className="max-h-96 overflow-auto">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No customers found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or create a new customer
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedCustomer?.id === customer.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => {
                      onCustomerSelect(customer);
                      onClose();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{customer.name}</h3>
                          <Badge variant={customer.type === 'WHOLESALE' ? 'default' : 'secondary'}>
                            {customer.type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>Total Purchases: {new Intl.NumberFormat('rw-RW', {
                            style: 'currency',
                            currency: 'RWF',
                            minimumFractionDigits: 0,
                          }).format(customer.totalPurchases)}</span>
                          {customer.lastPurchase && (
                            <span>Last Purchase: {new Date(customer.lastPurchase).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      
                      {selectedCustomer?.id === customer.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
