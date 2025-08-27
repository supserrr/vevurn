'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, User, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

const cashierSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().optional()
});

type CashierFormData = z.infer<typeof cashierSchema>;

interface CreateCashierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCashierModal({ open, onOpenChange, onSuccess }: CreateCashierModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CashierFormData>({
    resolver: zodResolver(cashierSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: ''
    }
  });

  const onSubmit = async (data: CashierFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/create-cashier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success('Cashier account created and email sent with login credentials');
        onSuccess();
        form.reset();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create cashier account');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Cashier</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Enter cashier's full name"
                className="pl-10"
              />
            </div>
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="Enter cashier's email"
                className="pl-10"
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phoneNumber"
                {...form.register('phoneNumber')}
                placeholder="Enter phone number (optional)"
                className="pl-10"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              📧 The cashier will receive an email with their login credentials and must change their password on first login.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Cashier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
