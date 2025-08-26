'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Sale {
  id: string;
  saleNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  totalAmount: number;
  createdAt: string;
}

export function CreateInvoiceDialog({ open, onClose, onSuccess }: CreateInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [createMethod, setCreateMethod] = useState<'fromSale' | 'manual'>('fromSale');
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('NET_30');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
  ]);

  // Fetch unpaid sales for dropdown
  const { data: salesData } = useQuery({
    queryKey: ['sales', 'unpaid'],
    queryFn: async () => {
      const response = await fetch('/api/sales?status=COMPLETED&hasInvoice=false', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch sales');
      return response.json();
    },
    enabled: open && createMethod === 'fromSale',
  });

  // Fetch customers for manual invoice creation
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
    enabled: open && createMethod === 'manual',
  });

  const handleCreateInvoice = async () => {
    if (createMethod === 'fromSale' && !selectedSaleId) {
      toast.error('Please select a sale');
      return;
    }

    if (createMethod === 'manual' && !customerId) {
      toast.error('Please select a customer');
      return;
    }

    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }

    if (createMethod === 'manual' && items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast.error('Please fill in all item details');
      return;
    }

    setIsLoading(true);

    try {
      const invoiceData = createMethod === 'fromSale' 
        ? {
            saleId: selectedSaleId,
            dueDate,
            paymentTerms,
            notes
          }
        : {
            customerId,
            dueDate,
            paymentTerms,
            notes,
            items: items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            }))
          };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      const result = await response.json();
      toast.success('Invoice created successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to create invoice');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Get tomorrow's date as default due date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 30);
  const defaultDueDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Create an invoice from an existing sale or manually add items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Creation Method Selection */}
          <div className="space-y-2">
            <Label>Invoice Type</Label>
            <Select value={createMethod} onValueChange={(value: 'fromSale' | 'manual') => setCreateMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fromSale">Create from Sale</SelectItem>
                <SelectItem value="manual">Manual Invoice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create from Sale */}
          {createMethod === 'fromSale' && (
            <div className="space-y-2">
              <Label>Select Sale</Label>
              <Select value={selectedSaleId} onValueChange={setSelectedSaleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sale to create invoice from" />
                </SelectTrigger>
                <SelectContent>
                  {salesData?.data?.map((sale: Sale) => (
                    <SelectItem key={sale.id} value={sale.id}>
                      {sale.saleNumber} - {sale.customer.name} - {formatCurrency(sale.totalAmount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Manual Invoice */}
          {createMethod === 'manual' && (
            <>
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customersData?.data?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Invoice Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label className="text-xs">Description</Label>
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Total</Label>
                      <div className="h-9 px-3 border rounded-md bg-gray-50 flex items-center text-sm">
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

                {createMethod === 'manual' && (
                  <div className="flex justify-end pt-2 border-t">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total Amount</div>
                      <div className="text-xl font-bold">{formatCurrency(totalAmount)}</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate || defaultDueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Payment Terms */}
          <div className="space-y-2">
            <Label>Payment Terms</Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NET_15">Net 15 Days</SelectItem>
                <SelectItem value="NET_30">Net 30 Days</SelectItem>
                <SelectItem value="NET_60">Net 60 Days</SelectItem>
                <SelectItem value="NET_90">Net 90 Days</SelectItem>
                <SelectItem value="DUE_ON_RECEIPT">Due on Receipt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Additional notes or payment instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
