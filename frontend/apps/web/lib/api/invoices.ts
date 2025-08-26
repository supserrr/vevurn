/**
 * Invoice API Integration
 * Handles all invoice-related API calls with proper error handling and TypeScript types
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
interface InvoiceFilters {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateInvoiceRequest {
  saleId?: string;
  customerId?: string;
  dueDate: string;
  paymentTerms: string;
  notes?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface UpdateInvoiceRequest {
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface RecordPaymentRequest {
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  notes?: string;
}

interface SendEmailRequest {
  to?: string;
  subject?: string;
  message?: string;
}

interface SendSmsRequest {
  to?: string;
  message?: string;
}

// API Client Functions
export const invoiceApi = {
  // Get all invoices with filtering and pagination
  getInvoices: async (filters: InvoiceFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/invoices?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }

    return response.json();
  },

  // Get single invoice by ID
  getInvoice: async (id: string) => {
    const response = await fetch(`/api/invoices/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch invoice');
    }

    return response.json();
  },

  // Create new invoice
  createInvoice: async (data: CreateInvoiceRequest) => {
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create invoice');
    }

    return response.json();
  },

  // Update existing invoice
  updateInvoice: async (id: string, data: UpdateInvoiceRequest) => {
    const response = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update invoice');
    }

    return response.json();
  },

  // Delete invoice
  deleteInvoice: async (id: string) => {
    const response = await fetch(`/api/invoices/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete invoice');
    }

    return response.json();
  },

  // Record payment for invoice
  recordPayment: async (id: string, data: RecordPaymentRequest) => {
    const response = await fetch(`/api/invoices/${id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to record payment');
    }

    return response.json();
  },

  // Send invoice via email
  sendEmail: async (id: string, data: SendEmailRequest = {}) => {
    const response = await fetch(`/api/invoices/${id}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return response.json();
  },

  // Send invoice via SMS
  sendSms: async (id: string, data: SendSmsRequest = {}) => {
    const response = await fetch(`/api/invoices/${id}/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to send SMS');
    }

    return response.json();
  },

  // Mark invoice as paid
  markAsPaid: async (id: string) => {
    const response = await fetch(`/api/invoices/${id}/mark-paid`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to mark invoice as paid');
    }

    return response.json();
  },

  // Get invoice statistics
  getStats: async () => {
    const response = await fetch('/api/invoices/stats', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch invoice statistics');
    }

    return response.json();
  },

  // Bulk operations
  bulkAction: async (action: string, invoiceIds: string[], data: any = {}) => {
    const response = await fetch(`/api/invoices/bulk/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ invoiceIds, ...data }),
    });

    if (!response.ok) {
      throw new Error(`Failed to ${action} invoices`);
    }

    return response.json();
  },

  // Export invoices
  exportInvoices: async (format: 'pdf' | 'excel' | 'csv', filters: InvoiceFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/invoices/export/${format}?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to export invoices');
    }

    // Return blob for download
    return response.blob();
  },

  // Get payment history for invoice
  getPaymentHistory: async (id: string) => {
    const response = await fetch(`/api/invoices/${id}/payments`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment history');
    }

    return response.json();
  },

  // Get invoice reminders
  getReminders: async (id: string) => {
    const response = await fetch(`/api/invoices/${id}/reminders`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reminders');
    }

    return response.json();
  },

  // Create invoice reminder
  createReminder: async (id: string, data: any) => {
    const response = await fetch(`/api/invoices/${id}/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create reminder');
    }

    return response.json();
  },

  // Delete invoice reminder
  deleteReminder: async (invoiceId: string, reminderId: string) => {
    const response = await fetch(`/api/invoices/${invoiceId}/reminders/${reminderId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete reminder');
    }

    return response.json();
  },
};

// React Query Hooks
export const useInvoices = {
  // Get invoices list
  useInvoicesList: (filters: InvoiceFilters = {}) =>
    useQuery({
      queryKey: ['invoices', filters],
      queryFn: () => invoiceApi.getInvoices(filters),
    }),

  // Get single invoice
  useInvoice: (id: string) =>
    useQuery({
      queryKey: ['invoice', id],
      queryFn: () => invoiceApi.getInvoice(id),
      enabled: !!id,
    }),

  // Get invoice statistics
  useInvoiceStats: () =>
    useQuery({
      queryKey: ['invoice-stats'],
      queryFn: () => invoiceApi.getStats(),
    }),

  // Get payment history
  usePaymentHistory: (invoiceId: string) =>
    useQuery({
      queryKey: ['invoice-payments', invoiceId],
      queryFn: () => invoiceApi.getPaymentHistory(invoiceId),
      enabled: !!invoiceId,
    }),

  // Get reminders
  useReminders: (invoiceId: string) =>
    useQuery({
      queryKey: ['invoice-reminders', invoiceId],
      queryFn: () => invoiceApi.getReminders(invoiceId),
      enabled: !!invoiceId,
    }),

  // Create invoice mutation
  useCreateInvoice: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: invoiceApi.createInvoice,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      },
    });
  },

  // Update invoice mutation
  useUpdateInvoice: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceRequest }) =>
        invoiceApi.updateInvoice(id, data),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: ['invoice', id] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      },
    });
  },

  // Delete invoice mutation
  useDeleteInvoice: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: invoiceApi.deleteInvoice,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      },
    });
  },

  // Record payment mutation
  useRecordPayment: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: RecordPaymentRequest }) =>
        invoiceApi.recordPayment(id, data),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: ['invoice', id] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-payments', id] });
      },
    });
  },

  // Send email mutation
  useSendEmail: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data?: SendEmailRequest }) =>
        invoiceApi.sendEmail(id, data),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      },
    });
  },

  // Send SMS mutation
  useSendSms: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data?: SendSmsRequest }) =>
        invoiceApi.sendSms(id, data),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      },
    });
  },

  // Mark as paid mutation
  useMarkAsPaid: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: invoiceApi.markAsPaid,
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey: ['invoice', id] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      },
    });
  },

  // Bulk action mutation
  useBulkAction: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ action, invoiceIds, data }: { action: string; invoiceIds: string[]; data?: any }) =>
        invoiceApi.bulkAction(action, invoiceIds, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      },
    });
  },

  // Create reminder mutation
  useCreateReminder: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: any }) =>
        invoiceApi.createReminder(id, data),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: ['invoice-reminders', id] });
      },
    });
  },

  // Delete reminder mutation
  useDeleteReminder: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ invoiceId, reminderId }: { invoiceId: string; reminderId: string }) =>
        invoiceApi.deleteReminder(invoiceId, reminderId),
      onSuccess: (_, { invoiceId }) => {
        queryClient.invalidateQueries({ queryKey: ['invoice-reminders', invoiceId] });
      },
    });
  },
};

// Export individual functions for direct use
export {
  type InvoiceFilters,
  type CreateInvoiceRequest,
  type UpdateInvoiceRequest,
  type RecordPaymentRequest,
  type SendEmailRequest,
  type SendSmsRequest,
};
