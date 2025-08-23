import { Metadata } from "next"
import { notFound } from "next/navigation"
import { InvoiceDetail } from "@/components/invoices/invoice-detail"

export const metadata: Metadata = {
  title: "Invoice Detail",
  description: "View and manage invoice details",
}

interface InvoiceDetailPageProps {
  params: {
    id: string
  }
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <InvoiceDetail invoiceId={params.id} />
    </div>
  )
}
