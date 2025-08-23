import { Request, Response, NextFunction } from 'express';
import { CustomersService, CreateCustomerData, UpdateCustomerData, CustomerFilters } from '../services/customers.service';
import { Decimal } from '@prisma/client/runtime/library';

export class CustomersController {
  private customersService: CustomersService;

  constructor() {
    this.customersService = new CustomersService();
  }

  // GET /api/customers
  getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        search,
        city,
        preferredPaymentMethod,
        tags,
        minTotalSpent,
        maxTotalSpent,
        isActive,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const filters: CustomerFilters = {
        search: search as string,
        city: city as string,
        preferredPaymentMethod: preferredPaymentMethod as any,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        minTotalSpent: minTotalSpent ? new Decimal(minTotalSpent as string) : undefined,
        maxTotalSpent: maxTotalSpent ? new Decimal(maxTotalSpent as string) : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : true,
      };

      const pagination = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        sortBy: sortBy as string || 'createdAt',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await this.customersService.getAllCustomers(filters, pagination);

      res.json({
        success: true,
        data: result.customers,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/customers/:id
  getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const customer = await this.customersService.getCustomerById(id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/customers
  createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerData: CreateCustomerData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
        gender: req.body.gender,
        preferredPaymentMethod: req.body.preferredPaymentMethod,
        notes: req.body.notes,
        tags: req.body.tags || [],
      };

      const customer = await this.customersService.createCustomer(customerData);

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully',
      });
    } catch (error: any) {
      if (error.message && error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  };

  // PUT /api/customers/:id
  updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData: UpdateCustomerData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
        gender: req.body.gender,
        preferredPaymentMethod: req.body.preferredPaymentMethod,
        notes: req.body.notes,
        tags: req.body.tags,
        isActive: req.body.isActive,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof UpdateCustomerData] === undefined) {
          delete updateData[key as keyof UpdateCustomerData];
        }
      });

      const customer = await this.customersService.updateCustomer(id, updateData);

      res.json({
        success: true,
        data: customer,
        message: 'Customer updated successfully',
      });
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message && error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  };

  // DELETE /api/customers/:id
  deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await this.customersService.deleteCustomer(id);

      res.json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message && error.message.includes('Cannot delete customer')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  };

  // GET /api/customers/search?q=query
  searchCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const customers = await this.customersService.searchCustomers(q);

      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/customers/:id/stats
  getCustomerStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const stats = await this.customersService.getCustomerStats(id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  };

  // PUT /api/customers/:id/metrics
  updateCustomerMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await this.customersService.updateCustomerMetrics(id);

      res.json({
        success: true,
        message: 'Customer metrics updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/customers/top?limit=10
  getTopCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : 10;

      const customers = await this.customersService.getTopCustomers(limitNum);

      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/customers/:id/activate
  activateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const customer = await this.customersService.updateCustomer(id, { isActive: true });

      res.json({
        success: true,
        data: customer,
        message: 'Customer activated successfully',
      });
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  };

  // PUT /api/customers/:id/deactivate
  deactivateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const customer = await this.customersService.updateCustomer(id, { isActive: false });

      res.json({
        success: true,
        data: customer,
        message: 'Customer deactivated successfully',
      });
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  };
}
