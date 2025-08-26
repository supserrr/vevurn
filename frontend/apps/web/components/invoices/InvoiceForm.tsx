'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Validation schema
const invoiceSchema = z.object({
  dueDate: z.string().min(1, 'Due date is required'),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
  })).min(1, 'At least one item is required'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceFormProps {
  invoice?: any; // Existing invoice data for editing
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export function InvoiceForm({ 
  invoice, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = 'create'
}: InvoiceFormProps) {
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      dueDate: '',
      paymentTerms: 'NET_30',
      notes: '',
      items: []
    },
  });

  // Initialize form with existing invoice data
  useEffect(() => {
    if (invoice && mode === 'edit') {
      setValue('dueDate', invoice.dueDate?.split('T')[0] || '');
      setValue('paymentTerms', invoice.paymentTerms || 'NET_30');
      setValue('notes', invoice.notes || '');
      
      if (invoice.items && invoice.items.length > 0) {
        const formattedItems = invoice.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice || (item.quantity * item.unitPrice)
        }));
        setItems(formattedItems);
      }
    }
  }, [invoice, mode, setValue]);

  // Update form items when items state changes
  useEffect(() => {
    const formItems = items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
    setValue('items', formItems);
  }, [items, setValue]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    const item = newItems[index];
    
    if (!item) return;
    
    if (field === 'description') {
      item.description = value as string;
    } else if (field === 'quantity') {
      item.quantity = value as number;
      item.totalPrice = item.quantity * item.unitPrice;
    } else if (field === 'unitPrice') {
      item.unitPrice = value as number;
      item.totalPrice = item.quantity * item.unitPrice;
    }
    
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const onFormSubmit = async (data: InvoiceFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error('Failed to save invoice');
    }
  };

  // Get tomorrow's date as minimum due date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'create' ? 'Create Invoice' : 'Edit Invoice'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register('dueDate')}
                  min={minDate}
                  className={errors.dueDate ? 'border-red-500' : ''}
                />
                {errors.dueDate && (
                  <p className="text-sm text-red-600">{errors.dueDate.message}</p>
                )}
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms *</Label>
                <Select
                  value={watch('paymentTerms')}
                  onValueChange={(value) => setValue('paymentTerms', value)}
                >
                  <SelectTrigger className={errors.paymentTerms ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NET_15">Net 15 Days</SelectItem>
                    <SelectItem value="NET_30">Net 30 Days</SelectItem>
                    <SelectItem value="NET_60">Net 60 Days</SelectItem>
                    <SelectItem value="NET_90">Net 90 Days</SelectItem>
                    <SelectItem value="DUE_ON_RECEIPT">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentTerms && (
                  <p className="text-sm text-red-600">{errors.paymentTerms.message}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes or payment instructions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Invoice Items
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 border rounded-lg">
                <div className="col-span-5">
                  <Label className="text-sm">Description *</Label>
                  <Input
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className={!item.description && errors.items?.[index]?.description ? 'border-red-500' : ''}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm">Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm">Unit Price *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm">Total</Label>
                  <div className="h-9 px-3 border rounded-md bg-gray-50 flex items-center text-sm font-medium">
                    {formatCurrency(item.totalPrice)}
                  </div>
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {errors.items && (
              <p className="text-sm text-red-600">
                {errors.items.message || 'Please ensure all items have valid descriptions, quantities, and prices'}
              </p>
            )}

            {/* Total */}
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Invoice' : 'Update Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}
