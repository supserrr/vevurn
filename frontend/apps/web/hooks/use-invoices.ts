import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type {
  Invoice,
  InvoiceFilters,
  InvoiceSummary,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  RecordPaymentRequest,
  CreateReminderRequest,
  InvoiceReminder,
  ApiResponse
} from '@/lib/types';

// ==========================================
// QUERY KEYS
// ==========================================
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: InvoiceFilters) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  summary: () => [...invoiceKeys.all, 'summary'] as const,
  overdue: () => [...invoiceKeys.all, 'overdue'] as const,
  reminders: (id: string) => [...invoiceKeys.detail(id), 'reminders'] as const,
};

// ==========================================
// API FUNCTIONS
// ==========================================
export const invoiceApi = {
  // Get invoices with filters
  getInvoices: async (filters: InvoiceFilters = {}) => {
    const { data } = await apiClient.get<ApiResponse<{
      invoices: Invoice[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>>('/invoices', { params: filters });
    return data.data!;
  },

  // Get invoice by ID
  getInvoice: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return data.data!;
  },

  // Create invoice
  createInvoice: async (invoiceData: CreateInvoiceRequest) => {
    const { data } = await apiClient.post<ApiResponse<Invoice>>('/invoices', invoiceData);
    return data.data!;
  },

  // Update invoice
  updateInvoice: async (id: string, updates: UpdateInvoiceRequest) => {
    const { data } = await apiClient.put<ApiResponse<Invoice>>(`/invoices/${id}`, updates);
    return data.data!;
  },

  // Delete invoice
  deleteInvoice: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/invoices/${id}`);
    return data;
  },

  // Send invoice email
  sendInvoiceEmail: async (id: string, options?: { recipientEmail?: string; subject?: string; message?: string }) => {
    const { data } = await apiClient.post<ApiResponse<{ sent: boolean }>>(`/invoices/${id}/send-email`, options);
    return data.data!;
  },

  // Send invoice SMS
  sendInvoiceSms: async (id: string, options?: { phoneNumber?: string; message?: string }) => {
    const { data } = await apiClient.post<ApiResponse<{ sent: boolean }>>(`/invoices/${id}/send-sms`, options);
    return data.data!;
  },

  // Record payment
  recordPayment: async (id: string, payment: RecordPaymentRequest) => {
    const { data } = await apiClient.post<ApiResponse<{ payment: any; invoice: Invoice }>>(`/invoices/${id}/payments`, payment);
    return data.data!;
  },

  // Get invoice summary
  getInvoiceSummary: async () => {
    const { data } = await apiClient.get<ApiResponse<InvoiceSummary>>('/invoices/summary');
    return data.data!;
  },

  // Get overdue invoices
  getOverdueInvoices: async () => {
    const { data } = await apiClient.get<ApiResponse<Invoice[]>>('/invoices/overdue');
    return data.data!;
  },

  // Create reminder
  createReminder: async (invoiceId: string, reminder: CreateReminderRequest) => {
    const { data } = await apiClient.post<ApiResponse<InvoiceReminder>>(`/invoices/${invoiceId}/reminders`, reminder);
    return data.data!;
  },

  // Get invoice reminders
  getInvoiceReminders: async (invoiceId: string) => {
    const { data } = await apiClient.get<ApiResponse<InvoiceReminder[]>>(`/invoices/${invoiceId}/reminders`);
    return data.data!;
  },

  // Bulk mark as paid
  bulkMarkPaid: async (invoiceIds: string[], paidDate?: string) => {
    const { data } = await apiClient.put<ApiResponse<{ count: number }>>('/invoices/bulk-mark-paid', {
      invoiceIds,
      paidDate
    });
    return data.data!;
  },

  // Convert sale to invoice
  convertSaleToInvoice: async (saleId: string, invoiceData: Omit<CreateInvoiceRequest, 'saleId'>) => {
    const { data } = await apiClient.post<ApiResponse<Invoice>>(`/sales/${saleId}/convert-to-invoice`, invoiceData);
    return data.data!;
  },
};

// ==========================================
// REACT QUERY HOOKS
// ==========================================

// Get invoices with filters
export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => invoiceApi.getInvoices(filters),
    staleTime: 30000, // 30 seconds
  });
}

// Get single invoice
export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoiceApi.getInvoice(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

// Get invoice summary
export function useInvoiceSummary() {
  return useQuery({
    queryKey: invoiceKeys.summary(),
    queryFn: invoiceApi.getInvoiceSummary,
    staleTime: 300000, // 5 minutes
  });
}

// Get overdue invoices
export function useOverdueInvoices() {
  return useQuery({
    queryKey: invoiceKeys.overdue(),
    queryFn: invoiceApi.getOverdueInvoices,
    staleTime: 300000, // 5 minutes
  });
}

// Get invoice reminders
export function useInvoiceReminders(invoiceId: string) {
  return useQuery({
    queryKey: invoiceKeys.reminders(invoiceId),
    queryFn: () => invoiceApi.getInvoiceReminders(invoiceId),
    enabled: !!invoiceId,
  });
}

// ==========================================
// MUTATION HOOKS
// ==========================================

// Create invoice
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoiceApi.createInvoice,
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() });
      toast.success(`Invoice ${invoice.invoiceNumber} created successfully!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });
}

// Update invoice
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateInvoiceRequest }) =>
      invoiceApi.updateInvoice(id, updates),
    onSuccess: (invoice, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() });
      toast.success('Invoice updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });
}

// Delete invoice
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoiceApi.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() });
      toast.success('Invoice deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });
}

// Send invoice email
export function useSendInvoiceEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, options }: { id: string; options?: any }) =>
      invoiceApi.sendInvoiceEmail(id, options),
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      toast.success('Invoice email sent successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to send email: ${error.message}`);
    },
  });
}

// Send invoice SMS
export function useSendInvoiceSms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, options }: { id: string; options?: any }) =>
      invoiceApi.sendInvoiceSms(id, options),
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      toast.success('Invoice SMS sent successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to send SMS: ${error.message}`);
    },
  });
}

// Record payment
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payment }: { id: string; payment: RecordPaymentRequest }) =>
      invoiceApi.recordPayment(id, payment),
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() });
      toast.success('Payment recorded successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}

// Create reminder
export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, reminder }: { invoiceId: string; reminder: CreateReminderRequest }) =>
      invoiceApi.createReminder(invoiceId, reminder),
    onSuccess: (result, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.reminders(invoiceId) });
      toast.success('Reminder scheduled successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to create reminder: ${error.message}`);
    },
  });
}

// Bulk mark as paid
export function useBulkMarkPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceIds, paidDate }: { invoiceIds: string[]; paidDate?: string }) =>
      invoiceApi.bulkMarkPaid(invoiceIds, paidDate),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() });
      toast.success(`${result.count} invoices marked as paid!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to mark invoices as paid: ${error.message}`);
    },
  });
}
