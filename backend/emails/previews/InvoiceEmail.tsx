import InvoiceEmail from "../InvoiceEmail";

export function invoiceEmail() {
  return (
    <InvoiceEmail
      recipientName="John Doe"
      invoice={{
        invoiceNumber: "INV-2024-001",
        issueDate: "2024-01-15",
        dueDate: "2024-02-15",
        totalAmount: 45000,
        amountDue: 45000,
        status: "Pending"
      }}
    />
  );
}

export function paidInvoiceEmail() {
  return (
    <InvoiceEmail
      recipientName="Jane Smith"
      invoice={{
        invoiceNumber: "INV-2024-002",
        issueDate: "2024-01-10",
        dueDate: "2024-02-10",
        totalAmount: 125000,
        amountDue: 0,
        status: "Paid"
      }}
    />
  );
}

export function overdueInvoiceEmail() {
  return (
    <InvoiceEmail
      recipientName="Alex Johnson"
      invoice={{
        invoiceNumber: "INV-2023-456",
        issueDate: "2023-12-01",
        dueDate: "2024-01-01",
        totalAmount: 75000,
        amountDue: 75000,
        status: "Overdue"
      }}
    />
  );
}
