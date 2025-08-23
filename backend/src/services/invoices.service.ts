import { PrismaClient, InvoiceStatus, ReminderType, PaymentMethod } from '@prisma/client';
import { logger } from '../utils/logger';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

// Invoice number generator
const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = Date.now().toString().slice(-8);
  
  return `INV-${year}-${timestamp}`;
};

export class InvoiceService {
  // ==========================================
  // BASIC CRUD OPERATIONS
  // ==========================================

  async createInvoice(data: {
    saleId: string;
    dueDate: string;
    paymentTerms?: string;
    notes?: string;
    sendEmail?: boolean;
    sendSms?: boolean;
  }) {
    try {
      // First, get the sale and validate it
      const sale = await prisma.sale.findUnique({
        where: { id: data.saleId },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      if (sale.isInvoiced) {
        throw new Error('Sale already has an invoice');
      }

      if (!sale.customer) {
        throw new Error('Sale must have a customer to create an invoice');
      }

      // Generate unique invoice number
      const invoiceNumber = generateInvoiceNumber();

      // Calculate consignment details if applicable
      const isConsignment = sale.items.some(item => item.isConsignment);
      let consignmentDue = null;

      if (isConsignment) {
        consignmentDue = sale.items
          .filter(item => item.isConsignment)
          .reduce((total, item) => {
            const rate = item.consignmentRate || 0;
            const commission = new Decimal(item.totalPrice).mul(rate).div(100);
            return total.add(commission);
          }, new Decimal(0));
      }

      // Create invoice in transaction
      const invoice = await prisma.$transaction(async (tx) => {
        const newInvoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            saleId: data.saleId,
            customerId: sale.customerId!,
            subtotal: sale.subtotal,
            taxAmount: sale.taxAmount,
            discountAmount: sale.discountAmount,
            totalAmount: sale.totalAmount,
            amountDue: sale.totalAmount,
            dueDate: new Date(data.dueDate),
            paymentTerms: data.paymentTerms,
            notes: data.notes,
            isConsignment,
            consignmentDue: consignmentDue?.toNumber(),
          },
          include: {
            sale: {
              include: {
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
            customer: true,
          },
        });

        // Mark sale as invoiced
        await tx.sale.update({
          where: { id: data.saleId },
          data: { isInvoiced: true },
        });

        return newInvoice;
      });

      logger.info(`Invoice created: ${invoiceNumber} for sale ${sale.saleNumber}`);

      // TODO: Send email/SMS if requested
      if (data.sendEmail) {
        // await this.sendInvoiceEmail(invoice.id);
      }
      if (data.sendSms) {
        // await this.sendInvoiceSms(invoice.id);
      }

      return invoice;
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  async getInvoices(filters: {
    page: number;
    limit: number;
    status?: InvoiceStatus[];
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    overdue?: boolean;
    search?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    try {
      const { page, limit, sortBy, sortOrder, ...filterOptions } = filters;
      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (filterOptions.status?.length) {
        where.status = { in: filterOptions.status };
      }

      if (filterOptions.customerId) {
        where.customerId = filterOptions.customerId;
      }

      if (filterOptions.dateFrom && filterOptions.dateTo) {
        where.issueDate = {
          gte: new Date(filterOptions.dateFrom),
          lte: new Date(filterOptions.dateTo),
        };
      }

      if (filterOptions.overdue) {
        where.dueDate = { lt: new Date() };
        where.status = { in: ['SENT', 'PARTIALLY_PAID'] };
      }

      if (filterOptions.search) {
        where.OR = [
          { invoiceNumber: { contains: filterOptions.search, mode: 'insensitive' } },
          { customer: { 
            OR: [
              { firstName: { contains: filterOptions.search, mode: 'insensitive' } },
              { lastName: { contains: filterOptions.search, mode: 'insensitive' } },
              { email: { contains: filterOptions.search, mode: 'insensitive' } },
            ]
          }},
        ];
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                companyName: true,
              },
            },
            sale: {
              select: {
                id: true,
                saleNumber: true,
                createdAt: true,
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit,
        }),
        prisma.invoice.count({ where }),
      ]);

      return {
        invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      throw error;
    }
  }

  async getInvoiceById(id: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: true,
          sale: {
            include: {
              items: {
                include: {
                  product: true,
                  productVariation: true,
                },
              },
              cashier: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          reminders: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice;
    } catch (error) {
      logger.error('Error fetching invoice:', error);
      throw error;
    }
  }

  async updateInvoice(id: string, data: {
    dueDate?: string;
    paymentTerms?: string;
    notes?: string;
    status?: InvoiceStatus;
  }) {
    try {
      const invoice = await prisma.invoice.update({
        where: { id },
        data: {
          ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
          ...(data.paymentTerms !== undefined && { paymentTerms: data.paymentTerms }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.status && { status: data.status }),
          updatedAt: new Date(),
        },
        include: {
          customer: true,
          sale: true,
        },
      });

      logger.info(`Invoice updated: ${invoice.invoiceNumber}`);
      return invoice;
    } catch (error) {
      logger.error('Error updating invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string) {
    try {
      // Check if invoice can be deleted
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        select: { status: true, saleId: true, amountPaid: true },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'PAID' || new Decimal(invoice.amountPaid).gt(0)) {
        throw new Error('Cannot delete invoice with payments');
      }

      await prisma.$transaction(async (tx) => {
        // Delete invoice and reminders (cascade)
        await tx.invoice.delete({ where: { id } });

        // Update sale to mark as not invoiced
        await tx.sale.update({
          where: { id: invoice.saleId },
          data: { isInvoiced: false },
        });
      });

      logger.info(`Invoice deleted: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // ==========================================
  // PAYMENT TRACKING
  // ==========================================

  async recordPayment(invoiceId: string, data: {
    amount: number;
    method: PaymentMethod;
    transactionId?: string;
    notes?: string;
  }) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: { totalAmount: true, amountPaid: true, status: true },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const newAmountPaid = new Decimal(invoice.amountPaid).add(data.amount);
      const totalAmount = new Decimal(invoice.totalAmount);

      if (newAmountPaid.gt(totalAmount)) {
        throw new Error('Payment amount exceeds invoice total');
      }

      // Determine new status
      let newStatus: InvoiceStatus = invoice.status;
      if (newAmountPaid.equals(totalAmount)) {
        newStatus = 'PAID';
      } else if (newAmountPaid.gt(0)) {
        newStatus = 'PARTIALLY_PAID';
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create payment record
        const payment = await tx.payment.create({
          data: {
            amount: data.amount,
            method: data.method,
            status: 'COMPLETED',
            transactionId: data.transactionId,
            notes: data.notes,
            processedAt: new Date(),
          },
        });

        // Update invoice
        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            amountPaid: newAmountPaid.toNumber(),
            amountDue: totalAmount.sub(newAmountPaid).toNumber(),
            status: newStatus,
            ...(newStatus === 'PAID' && { paidDate: new Date() }),
          },
          include: {
            customer: true,
            sale: true,
          },
        });

        return { payment, invoice: updatedInvoice };
      });

      logger.info(`Payment recorded for invoice ${invoiceId}: ${data.amount}`);
      return result;
    } catch (error) {
      logger.error('Error recording payment:', error);
      throw error;
    }
  }

  // ==========================================
  // REMINDERS
  // ==========================================

  async createReminder(invoiceId: string, data: {
    type: ReminderType;
    scheduledFor: string;
    message: string;
  }) {
    try {
      const reminder = await prisma.invoiceReminder.create({
        data: {
          invoiceId,
          type: data.type,
          scheduledFor: new Date(data.scheduledFor),
          message: data.message,
        },
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
        },
      });

      logger.info(`Reminder created for invoice ${invoiceId}`);
      return reminder;
    } catch (error) {
      logger.error('Error creating reminder:', error);
      throw error;
    }
  }

  async getInvoiceReminders(invoiceId: string) {
    try {
      const reminders = await prisma.invoiceReminder.findMany({
        where: { invoiceId },
        orderBy: { createdAt: 'desc' },
      });

      return reminders;
    } catch (error) {
      logger.error('Error fetching reminders:', error);
      throw error;
    }
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  async bulkCreateInvoices(data: {
    saleIds: string[];
    dueDate: string;
    paymentTerms?: string;
    sendEmail?: boolean;
  }) {
    try {
      const results = [];
      const errors = [];

      for (const saleId of data.saleIds) {
        try {
          const invoice = await this.createInvoice({
            saleId,
            dueDate: data.dueDate,
            paymentTerms: data.paymentTerms,
            sendEmail: data.sendEmail,
          });
          results.push(invoice);
        } catch (error) {
          errors.push({ saleId, error: (error as Error).message });
        }
      }

      logger.info(`Bulk invoice creation: ${results.length} success, ${errors.length} errors`);
      return { invoices: results, errors };
    } catch (error) {
      logger.error('Error in bulk invoice creation:', error);
      throw error;
    }
  }

  async bulkMarkPaid(data: {
    invoiceIds: string[];
    paidDate?: string;
  }) {
    try {
      const paidDate = data.paidDate ? new Date(data.paidDate) : new Date();

      const result = await prisma.$transaction(async (tx) => {
        // Update invoices where amount due equals total amount (fully unpaid)
        const invoicesToUpdate = await tx.invoice.findMany({
          where: {
            id: { in: data.invoiceIds },
            status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
          },
          select: { id: true, totalAmount: true },
        });

        const updatePromises = invoicesToUpdate.map(invoice =>
          tx.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'PAID',
              paidDate,
              amountPaid: invoice.totalAmount,
              amountDue: 0,
            },
          })
        );

        await Promise.all(updatePromises);
        return { count: invoicesToUpdate.length };
      });

      logger.info(`Bulk marked paid: ${result.count} invoices`);
      return result;
    } catch (error) {
      logger.error('Error in bulk mark paid:', error);
      throw error;
    }
  }

  // ==========================================
  // REPORTING & ANALYTICS
  // ==========================================

  async getInvoiceSummary() {
    try {
      const [statusCounts, amounts] = await Promise.all([
        prisma.invoice.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        prisma.invoice.aggregate({
          _sum: {
            totalAmount: true,
            amountPaid: true,
            amountDue: true,
          },
        }),
      ]);

      // Get overdue invoices
      const overdueAmount = await prisma.invoice.aggregate({
        where: {
          dueDate: { lt: new Date() },
          status: { in: ['SENT', 'PARTIALLY_PAID'] },
        },
        _sum: { amountDue: true },
      });

      // Format status counts
      const countByStatus = statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<InvoiceStatus, number>);

      return {
        totalOutstanding: amounts._sum.amountDue || 0,
        totalOverdue: overdueAmount._sum.amountDue || 0,
        countByStatus,
        totalAmount: amounts._sum.totalAmount || 0,
        paidAmount: amounts._sum.amountPaid || 0,
      };
    } catch (error) {
      logger.error('Error fetching invoice summary:', error);
      throw error;
    }
  }

  async getOverdueInvoices() {
    try {
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          dueDate: { lt: new Date() },
          status: { in: ['SENT', 'PARTIALLY_PAID'] },
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              companyName: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      return overdueInvoices;
    } catch (error) {
      logger.error('Error fetching overdue invoices:', error);
      throw error;
    }
  }

  async getPaymentForecast(dateFrom: string, dateTo: string) {
    try {
      const forecast = await prisma.invoice.findMany({
        where: {
          dueDate: {
            gte: new Date(dateFrom),
            lte: new Date(dateTo),
          },
          status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
        select: {
          dueDate: true,
          amountDue: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      return forecast;
    } catch (error) {
      logger.error('Error fetching payment forecast:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();
