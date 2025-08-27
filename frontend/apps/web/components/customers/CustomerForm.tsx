'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

interface Customer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type: 'REGULAR' | 'WHOLESALE' | 'WALK_IN';
  notes?: string;
}

interface CustomerFormProps {
  customer?: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

async function saveCustomer(customer: Customer): Promise<Customer> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const url = customer.id 
    ? `${baseUrl}/api/customers/${customer.id}` 
    : `${baseUrl}/api/customers`;
  
  const response = await fetch(url, {
    method: customer.id ? 'PUT' : 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customer),
  });

  if (!response.ok) {
    throw new Error('Failed to save customer');
  }

  const result = await response.json();
  return result.data;
}

export default function CustomerForm({ customer, isOpen, onClose }: CustomerFormProps) {
  const [formData, setFormData] = useState<Customer>({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    type: customer?.type || 'REGULAR',
    notes: customer?.notes || '',
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: saveCustomer,
    onSuccess: () => {
      toast.success(customer ? 'Customer updated successfully!' : 'Customer created successfully!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save customer');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      type: 'REGULAR',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    const customerData = customer?.id 
      ? { ...formData, id: customer.id }
      : formData;

    saveMutation.mutate(customerData);
  };

  const handleChange = (field: keyof Customer, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter customer name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+250788123456"
            />
          </div>

          <div>
            <Label htmlFor="type">Customer Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => handleChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REGULAR">Regular Customer</SelectItem>
                <SelectItem value="WHOLESALE">Wholesale Customer</SelectItem>
                <SelectItem value="WALK_IN">Walk-in Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter customer address"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about customer"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : (customer ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
