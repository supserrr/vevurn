import { Metadata } from "next"
import { Suspense } from "react"
import { CreateInvoiceForm } from "@/components/invoices/create-invoice-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Create Invoice",
  description: "Create a new invoice from sale",
}

interface CreateInvoicePageProps {
  searchParams: {
    saleId?: string
  }
}

export default function CreateInvoicePage({ searchParams }: CreateInvoicePageProps) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
          <p className="text-muted-foreground">
            Generate a professional invoice from your completed sale
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>
            Configure invoice settings and communication preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <CreateInvoiceForm saleId={searchParams.saleId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
