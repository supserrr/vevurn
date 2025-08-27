import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class DemoDataController {
  /**
   * Get demo products
   */
  async getProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const products = [
        {
          id: '1',
          name: 'iPhone 15 Pro Clear Case',
          description: 'Crystal clear protective case for iPhone 15 Pro',
          sku: 'CASE-IPH15P-CLR',
          barcode: '1234567890001',
          category: { id: '1', name: 'Phone Cases' },
          costPrice: 8000,
          wholesalePrice: 12000,
          retailPrice: 18000,
          minPrice: 10000,
          stockQuantity: 50,
          minStockLevel: 10,
          brand: 'Apple',
          model: 'iPhone 15 Pro',
          color: 'Clear',
          status: 'ACTIVE',
          createdAt: '2025-08-27T10:00:00Z',
          updatedAt: '2025-08-27T10:00:00Z'
        },
        {
          id: '2',
          name: 'Samsung Galaxy S24 Screen Protector',
          description: 'Tempered glass screen protector for Galaxy S24',
          sku: 'SCRN-SAM24-TMP',
          barcode: '1234567890002',
          category: { id: '2', name: 'Screen Protectors' },
          costPrice: 3000,
          wholesalePrice: 4500,
          retailPrice: 7000,
          minPrice: 4000,
          stockQuantity: 5,
          minStockLevel: 20,
          brand: 'Samsung',
          model: 'Galaxy S24',
          status: 'ACTIVE',
          createdAt: '2025-08-27T10:00:00Z',
          updatedAt: '2025-08-27T10:00:00Z'
        },
        {
          id: '3',
          name: 'USB-C Fast Charger 25W',
          description: '25W USB-C fast charging adapter',
          sku: 'CHRG-USBC-25W',
          barcode: '1234567890003',
          category: { id: '3', name: 'Chargers' },
          costPrice: 12000,
          wholesalePrice: 18000,
          retailPrice: 25000,
          minPrice: 15000,
          stockQuantity: 30,
          minStockLevel: 5,
          brand: 'Generic',
          status: 'ACTIVE',
          createdAt: '2025-08-27T10:00:00Z',
          updatedAt: '2025-08-27T10:00:00Z'
        },
        {
          id: '4',
          name: 'Wireless Earbuds Pro',
          description: 'Premium wireless earbuds with noise cancellation',
          sku: 'HPHON-WRLSS-PRO',
          barcode: '1234567890004',
          category: { id: '4', name: 'Headphones' },
          costPrice: 35000,
          wholesalePrice: 50000,
          retailPrice: 75000,
          minPrice: 45000,
          stockQuantity: 3,
          minStockLevel: 5,
          brand: 'Generic',
          color: 'White',
          status: 'ACTIVE',
          createdAt: '2025-08-27T10:00:00Z',
          updatedAt: '2025-08-27T10:00:00Z'
        },
        {
          id: '5',
          name: '10000mAh Power Bank',
          description: 'Portable power bank with 10000mAh capacity',
          sku: 'PWRBNK-10K-BLK',
          barcode: '1234567890005',
          category: { id: '5', name: 'Power Banks' },
          costPrice: 18000,
          wholesalePrice: 25000,
          retailPrice: 35000,
          minPrice: 22000,
          stockQuantity: 35,
          minStockLevel: 8,
          brand: 'Generic',
          color: 'Black',
          status: 'ACTIVE',
          createdAt: '2025-08-27T10:00:00Z',
          updatedAt: '2025-08-27T10:00:00Z'
        }
      ];

      res.json(ApiResponse.success('Products retrieved successfully', { products, total: products.length }));
    } catch (error) {
      logger.error('Error fetching demo products:', error);
      next(error);
    }
  }

  /**
   * Get demo customers
   */
  async getCustomers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customers = [
        {
          id: '1',
          firstName: 'Jean Baptiste',
          lastName: 'Uwimana',
          email: 'jean.uwimana@gmail.com',
          phone: '+250788111111',
          address: 'Kimisagara, Nyarugenge, Kigali',
          customerType: 'REGULAR',
          isActive: true,
          createdAt: '2025-08-27T10:00:00Z',
          updatedAt: '2025-08-27T10:00:00Z'
        },
        {
          id: '2',
          firstName: 'Marie Claire',
          lastName: 'Mukamana',
          email: 'marie.mukamana@yahoo.com',
          phone: '+250788222222',
          address: 'Remera, Gasabo, Kigali',
          customerType: 'WHOLESALE',
          isActive: true,
          createdAt: '2025-08-27T10:00:00Z',
          updatedAt: '2025-08-27T10:00:00Z'
        },
        {
          id: '3',
          firstName: 'Tech Solutions Ltd',
          email: 'info@techsolutions.rw',
          phone: '+250788333333',
          address: 'Nyarutarama, Gasabo, Kigali',
          companyName: 'Tech Solutions Ltd',
          taxNumber: 'TIN123456789',
          customerType: 'BUSINESS',
          isActive: true,
          createdAt: '2025-08-27T10:00:00Z',
          updatedAt: '2025-08-27T10:00:00Z'
        }
      ];

      res.json(ApiResponse.success('Customers retrieved successfully', { customers, total: customers.length }));
    } catch (error) {
      logger.error('Error fetching demo customers:', error);
      next(error);
    }
  }

  /**
   * Get demo invoices
   */
  async getInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoices = [
        {
          id: '1',
          invoiceNumber: 'INV-20250827-0001',
          customer: {
            firstName: 'Tech Solutions Ltd',
            lastName: '',
            email: 'info@techsolutions.rw',
            phone: '+250788333333'
          },
          subtotal: 90000,
          taxAmount: 16200,
          discountAmount: 5000,
          totalAmount: 101200,
          amountPaid: 0,
          status: 'SENT',
          dueDate: '2025-09-26T00:00:00Z',
          createdAt: '2025-08-27T10:00:00Z'
        },
        {
          id: '2',
          invoiceNumber: 'INV-20250827-0002',
          customer: {
            firstName: 'Marie Claire',
            lastName: 'Mukamana',
            email: 'marie.mukamana@yahoo.com',
            phone: '+250788222222'
          },
          subtotal: 25000,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: 25000,
          amountPaid: 25000,
          status: 'PAID',
          dueDate: '2025-09-26T00:00:00Z',
          createdAt: '2025-08-27T09:00:00Z'
        }
      ];

      res.json(ApiResponse.success('Invoices retrieved successfully', { invoices, total: invoices.length }));
    } catch (error) {
      logger.error('Error fetching demo invoices:', error);
      next(error);
    }
  }

  /**
   * Get demo categories
   */
  async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = [
        { id: '1', name: 'Phone Cases', description: 'Protective cases for smartphones', color: '#3B82F6' },
        { id: '2', name: 'Screen Protectors', description: 'Screen protection films and glass', color: '#10B981' },
        { id: '3', name: 'Chargers', description: 'Charging cables and adapters', color: '#F59E0B' },
        { id: '4', name: 'Headphones', description: 'Audio accessories and headphones', color: '#8B5CF6' },
        { id: '5', name: 'Power Banks', description: 'Portable charging devices', color: '#EF4444' }
      ];

      res.json(ApiResponse.success('Categories retrieved successfully', { categories, total: categories.length }));
    } catch (error) {
      logger.error('Error fetching demo categories:', error);
      next(error);
    }
  }
}

export const demoDataController = new DemoDataController();
