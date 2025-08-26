'use client';

import { useState } from 'react';
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
import { formatCurrency } from '@/lib/utils';

interface PaymentRecordFormProps {
  invoiceId: string;
  remainingAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentRecordForm({ 
  invoiceId, 
  remainingAmount, 
  onClose, 
  onSuccess 
}: PaymentRecordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState<string>(remainingAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0] || ''
  );
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = async () => {
    const paymentAmount = parseFloat(amount);
    
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (paymentAmount > remainingAmount) {
      toast.error('Payment amount cannot exceed remaining balance');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (!paymentDate) {
      toast.error('Please select a payment date');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: paymentAmount,
          paymentMethod,
          paymentDate,
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      toast.success('Payment recorded successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  const isFullPayment = parseFloat(amount) === remainingAmount;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for this invoice. Remaining balance: {formatCurrency(remainingAmount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Amount */}
          <div className="space-y-2">
            <Label>Payment Amount *</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                min="0"
                max={remainingAmount}
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setAmount(remainingAmount.toString())}
              >
                Full Amount
              </Button>
            </div>
            {parseFloat(amount) > 0 && (
              <p className="text-sm text-gray-600">
                {isFullPayment ? 'This will mark the invoice as fully paid' : 
                 `Remaining after payment: ${formatCurrency(remainingAmount - parseFloat(amount))}`}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CHECK">Check</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label>Reference Number (Optional)</Label>
            <Input
              placeholder="Transaction reference, check number, etc."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Additional payment details..."
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
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
