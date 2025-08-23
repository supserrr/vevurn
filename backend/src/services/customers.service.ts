import { PrismaClient, Customer, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateCustomerData {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  dateOfBirth?: Date;
  gender?: string;
  preferredPaymentMethod?: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT';
  notes?: string;
  tags?: string[];
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  isActive?: boolean;
}

export interface CustomerFilters {
  search?: string;
  city?: string;
  preferredPaymentMethod?: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT';
  tags?: string[];
  minTotalSpent?: Decimal;
  maxTotalSpent?: Decimal;
  isActive?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CustomersService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAllCustomers(
    filters: CustomerFilters = {},
    pagination: PaginationOptions = {}
  ) {
    const {
      search,
      city,
      preferredPaymentMethod,
      tags,
      minTotalSpent,
      maxTotalSpent,
      isActive = true
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CustomerWhereInput = {
      isActive,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (preferredPaymentMethod) {
      where.preferredPaymentMethod = preferredPaymentMethod;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (minTotalSpent !== undefined || maxTotalSpent !== undefined) {
      where.totalSpent = {};
      if (minTotalSpent !== undefined) {
        where.totalSpent.gte = minTotalSpent;
      }
      if (maxTotalSpent !== undefined) {
        where.totalSpent.lte = maxTotalSpent;
      }
    }

    // Execute queries
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sales: {
            select: {
              id: true,
              saleNumber: true,
              totalAmount: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5, // Last 5 sales
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: {
        sales: {
          select: {
            id: true,
            saleNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 sales
        },
      },
    });
  }

  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    // Check for existing email or phone
    if (data.email) {
      const existingByEmail = await this.prisma.customer.findUnique({
        where: { email: data.email, deletedAt: null },
      });
      if (existingByEmail) {
        throw new Error('Customer with this email already exists');
      }
    }

    if (data.phone) {
      const existingByPhone = await this.prisma.customer.findUnique({
        where: { phone: data.phone, deletedAt: null },
      });
      if (existingByPhone) {
        throw new Error('Customer with this phone number already exists');
      }
    }

    return this.prisma.customer.create({
      data: {
        ...data,
        tags: data.tags || [],
      },
    });
  }

  async updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer> {
    // Check if customer exists
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Check for email/phone conflicts if updating
    if (data.email && data.email !== existingCustomer.email) {
      const existingByEmail = await this.prisma.customer.findUnique({
        where: { email: data.email, deletedAt: null },
      });
      if (existingByEmail && existingByEmail.id !== id) {
        throw new Error('Customer with this email already exists');
      }
    }

    if (data.phone && data.phone !== existingCustomer.phone) {
      const existingByPhone = await this.prisma.customer.findUnique({
        where: { phone: data.phone, deletedAt: null },
      });
      if (existingByPhone && existingByPhone.id !== id) {
        throw new Error('Customer with this phone number already exists');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    // Soft delete - check if customer exists and has no pending sales
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: {
        sales: {
          where: { status: 'DRAFT' },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer && customer.sales && customer.sales.length > 0) {
      throw new Error('Cannot delete customer with draft sales');
    }

    await this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async updateCustomerMetrics(customerId: string): Promise<void> {
    // Recalculate customer metrics from sales
    const sales = await this.prisma.sale.findMany({
      where: {
        customerId,
        status: 'COMPLETED',
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    const totalSpent = sales.reduce(
      (sum, sale) => sum.add(sale.totalAmount),
      new Decimal(0)
    );

    const totalPurchases = sales.length;
    const lastPurchaseAt = sales.length > 0 
      ? sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
      : null;

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpent,
        totalPurchases,
        lastPurchaseAt,
      },
    });
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      where: {
        AND: [
          { deletedAt: null },
          { isActive: true },
          {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: 10,
      orderBy: [
        { totalSpent: 'desc' },
        { lastPurchaseAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getCustomerStats(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId, deletedAt: null },
      include: {
        sales: {
          where: { status: 'COMPLETED' },
          select: {
            totalAmount: true,
            createdAt: true,
            items: {
              select: {
                quantity: true,
                product: {
                  select: {
                    name: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const sales = customer.sales;
    const totalSpent = sales.reduce(
      (sum: Decimal, sale: any) => sum.add(sale.totalAmount),
      new Decimal(0)
    );

    // Calculate monthly spending for last 12 months
    const monthlySpending = new Map<string, Decimal>();
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      monthlySpending.set(monthKey, new Decimal(0));
    }

    sales.forEach((sale: any) => {
      const monthKey = `${sale.createdAt.getFullYear()}-${String(sale.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlySpending.has(monthKey)) {
        monthlySpending.set(monthKey, monthlySpending.get(monthKey)!.add(sale.totalAmount));
      }
    });

    // Top categories
    const categoryStats = new Map<string, { count: number; total: Decimal }>();
    sales.forEach((sale: any) => {
      sale.items.forEach((item: any) => {
        const category = item.product.category?.name || 'Uncategorized';
        if (!categoryStats.has(category)) {
          categoryStats.set(category, { count: 0, total: new Decimal(0) });
        }
        const stats = categoryStats.get(category)!;
        stats.count += item.quantity;
      });
    });

    return {
      totalSpent,
      totalPurchases: sales.length,
      averageOrderValue: sales.length > 0 ? totalSpent.div(sales.length) : new Decimal(0),
      lastPurchaseAt: customer.lastPurchaseAt,
      monthlySpending: Array.from(monthlySpending.entries()).map(([month, amount]) => ({
        month,
        amount,
      })),
      topCategories: Array.from(categoryStats.entries())
        .map(([category, stats]) => ({ category, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }

  async getTopCustomers(limit: number = 10) {
    return this.prisma.customer.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      orderBy: [
        { totalSpent: 'desc' },
        { totalPurchases: 'desc' },
      ],
      take: limit,
      include: {
        sales: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}
