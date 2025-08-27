import PaymentReminderEmail from "../PaymentReminderEmail";

export function paymentReminderDueToday() {
  return (
    <PaymentReminderEmail
      recipientName="John Doe"
      invoice={{
        invoiceNumber: "INV-2024-001",
        dueDate: new Date().toISOString(),
        amountDue: 45000
      }}
      daysOverdue={0}
    />
  );
}

export function paymentReminderOverdue() {
  return (
    <PaymentReminderEmail
      recipientName="Jane Smith"
      invoice={{
        invoiceNumber: "INV-2024-002",
        dueDate: "2024-01-01",
        amountDue: 125000
      }}
      daysOverdue={15}
    />
  );
}

export function paymentReminderSeverlyOverdue() {
  return (
    <PaymentReminderEmail
      recipientName="Alex Johnson"
      invoice={{
        invoiceNumber: "INV-2023-456",
        dueDate: "2023-12-01",
        amountDue: 75000
      }}
      daysOverdue={45}
    />
  );
}
