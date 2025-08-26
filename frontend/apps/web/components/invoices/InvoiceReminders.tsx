'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2, Mail, MessageSquare } from 'lucide-react';

interface InvoiceRemindersProps {
  invoiceId: string;
  onClose: () => void;
}

interface Reminder {
  id: string;
  type: 'EMAIL' | 'SMS';
  scheduledDate: string;
  status: 'SCHEDULED' | 'SENT' | 'FAILED';
  message?: string;
  sentAt?: string;
}

export function InvoiceReminders({ invoiceId, onClose }: InvoiceRemindersProps) {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reminderType, setReminderType] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');

  // Fetch existing reminders
  const { data: remindersData, isLoading } = useQuery({
    queryKey: ['invoice-reminders', invoiceId],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}/reminders`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }

      return response.json();
    },
  });

  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: async (reminderData: any) => {
      const response = await fetch(`/api/invoices/${invoiceId}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create reminder');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Reminder scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice-reminders', invoiceId] });
      setShowCreateForm(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to schedule reminder');
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      const response = await fetch(`/api/invoices/${invoiceId}/reminders/${reminderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete reminder');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Reminder deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice-reminders', invoiceId] });
    },
    onError: () => {
      toast.error('Failed to delete reminder');
    },
  });

  const resetForm = () => {
    setReminderType('EMAIL');
    setScheduledDate('');
    setCustomMessage('');
  };

  const handleCreateReminder = () => {
    if (!scheduledDate) {
      toast.error('Please select a date for the reminder');
      return;
    }

    const now = new Date();
    const reminderDate = new Date(scheduledDate);

    if (reminderDate <= now) {
      toast.error('Reminder date must be in the future');
      return;
    }

    createReminderMutation.mutate({
      type: reminderType,
      scheduledDate,
      message: customMessage || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'SENT':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'EMAIL' ? (
      <Mail className="w-4 h-4" />
    ) : (
      <MessageSquare className="w-4 h-4" />
    );
  };

  // Get tomorrow's date as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Reminders</DialogTitle>
          <DialogDescription>
            Schedule and manage payment reminders for this invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Reminders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Scheduled Reminders</h3>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : remindersData?.data?.length > 0 ? (
              <div className="space-y-3">
                {remindersData.data.map((reminder: Reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(reminder.type)}
                        <span className="font-medium">{reminder.type}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Scheduled for {formatDate(reminder.scheduledDate)}
                        </p>
                        {reminder.sentAt && (
                          <p className="text-xs text-gray-500">
                            Sent on {formatDate(reminder.sentAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(reminder.status)}
                      {reminder.status === 'SCHEDULED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReminderMutation.mutate(reminder.id)}
                          disabled={deleteReminderMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No reminders scheduled yet</p>
                <p className="text-sm">Click "Add Reminder" to schedule your first reminder</p>
              </div>
            )}
          </div>

          {/* Create Reminder Form */}
          {showCreateForm && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Schedule New Reminder</h3>
              <div className="space-y-4">
                {/* Reminder Type */}
                <div className="space-y-2">
                  <Label>Reminder Type *</Label>
                  <Select value={reminderType} onValueChange={(value: 'EMAIL' | 'SMS') => setReminderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email Reminder</SelectItem>
                      <SelectItem value="SMS">SMS Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Scheduled Date */}
                <div className="space-y-2">
                  <Label>Send Date *</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={minDate}
                  />
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <Label>Custom Message (Optional)</Label>
                  <Textarea
                    placeholder="Add a custom message to the reminder (optional)"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    If left empty, a default reminder message will be used
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateReminder}
                    disabled={createReminderMutation.isPending}
                  >
                    {createReminderMutation.isPending ? 'Scheduling...' : 'Schedule Reminder'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
