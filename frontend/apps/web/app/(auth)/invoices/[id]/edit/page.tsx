'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { toast } from 'react-hot-toast';

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const invoiceId = params.id as string;

  // Fetch invoice data
  const { data: invoiceData, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }

      return response.json();
    },
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
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
    onSuccess: () => {
      toast.success('Invoice updated successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      router.push(`/invoices/${invoiceId}` as any);
    },
    onError: () => {
      toast.error('Failed to update invoice');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !invoiceData?.data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Invoice not found</p>
          <p className="text-gray-600">The invoice you're trying to edit doesn't exist</p>
          <button 
            onClick={() => router.push('/invoices' as any)} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    await updateInvoiceMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    router.push(`/invoices/${invoiceId}` as any);
  };

  return (
    <InvoiceForm
      invoice={invoiceData.data}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={updateInvoiceMutation.isPending}
      mode="edit"
    />
  );
}
