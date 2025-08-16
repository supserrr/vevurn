'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  User,
  CreditCard,
  Gift,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Customer interface
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

// Form data interface
interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'RETAIL' | 'WHOLESALE';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  notes: string;
  creditLimit: string;
  preferredPaymentMethod: string;
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

export default function EditCustomerPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'RETAIL',
    status: 'ACTIVE',
    notes: '',
    creditLimit: '',
    preferredPaymentMethod: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const loadCustomer = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch customer by ID from API
        // const response = await ApiClient.request(`/customers/${params.id}`);
        // const customerData = response.data;
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 500));
        const customerData = mockCustomer;
        
        setCustomer(customerData);
        setFormData({
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || '',
          address: customerData.address || '',
          type: customerData.type,
          status: customerData.status,
          notes: customerData.notes || '',
          creditLimit: customerData.creditLimit ? customerData.creditLimit.toString() : '',
          preferredPaymentMethod: customerData.preferredPaymentMethod || '',
        });
      } catch (error: any) {
        console.error('Failed to load customer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [params.id]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+250[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid Rwandan phone number (+250XXXXXXXXX)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.type === 'WHOLESALE' && formData.creditLimit) {
      const creditLimit = parseFloat(formData.creditLimit);
      if (isNaN(creditLimit) || creditLimit < 0) {
        newErrors.creditLimit = 'Credit limit must be a valid positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // In real app, call API to update customer
      console.log('Updating customer:', params.id, formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveSuccess(true);
      
      // Redirect back to customer details after a short delay
      setTimeout(() => {
        router.push(`/customers/${params.id}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Failed to update customer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2"></div>
          </div>
        </div>
        <div className="max-w-2xl">
          <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Customer not found. Please check the customer ID and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (saveSuccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Link>
          </Button>
        </div>
        <div className="max-w-2xl">
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              Customer updated successfully! Redirecting to customer details...
            </AlertDescription>
          </Alert>
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
            <Link href={`/customers/${customer.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customer
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Customer</h1>
            <p className="text-muted-foreground">
              Update {customer.name}'s information
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter customer name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+250788123456"
                    className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="customer@email.com"
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Kigali, Rwanda"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Type */}
              <div className="space-y-2">
                <Label>Customer Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="RETAIL"
                      checked={formData.type === 'RETAIL'}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="radio"
                    />
                    <span>Retail Customer</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="WHOLESALE"
                      checked={formData.type === 'WHOLESALE'}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="radio"
                    />
                    <span>Wholesale Customer</span>
                  </label>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="ACTIVE"
                      checked={formData.status === 'ACTIVE'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="radio"
                    />
                    <Badge variant="default">Active</Badge>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="INACTIVE"
                      checked={formData.status === 'INACTIVE'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="radio"
                    />
                    <Badge variant="secondary">Inactive</Badge>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="BLOCKED"
                      checked={formData.status === 'BLOCKED'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="radio"
                    />
                    <Badge variant="destructive">Blocked</Badge>
                  </label>
                </div>
              </div>

              {/* Preferred Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Preferred Payment Method</Label>
                <select
                  id="paymentMethod"
                  value={formData.preferredPaymentMethod}
                  onChange={(e) => handleInputChange('preferredPaymentMethod', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="">No preference</option>
                  <option value="Cash">Cash</option>
                  <option value="MTN Mobile Money">MTN Mobile Money</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Wholesale-specific settings */}
          {formData.type === 'WHOLESALE' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Wholesale Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Credit Limit */}
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit (RWF)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => handleInputChange('creditLimit', e.target.value)}
                    placeholder="500000"
                    min="0"
                    step="1000"
                    className={errors.creditLimit ? 'border-red-500' : ''}
                  />
                  {errors.creditLimit && (
                    <p className="text-sm text-red-500">{errors.creditLimit}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Current outstanding balance: {formatCurrency(customer.outstandingBalance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any notes about this customer..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Stats (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Customer Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Total Purchases</Label>
                  <div className="p-2 bg-muted rounded-md">
                    {formatCurrency(customer.totalPurchases)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total Orders</Label>
                  <div className="p-2 bg-muted rounded-md">
                    {customer.totalOrders}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Loyalty Points</Label>
                  <div className="p-2 bg-muted rounded-md">
                    {customer.loyaltyPoints} points
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Customer Since</Label>
                  <div className="p-2 bg-muted rounded-md">
                    {new Date(customer.dateJoined).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isSaving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              asChild
              className="flex-1"
            >
              <Link href={`/customers/${customer.id}`}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
