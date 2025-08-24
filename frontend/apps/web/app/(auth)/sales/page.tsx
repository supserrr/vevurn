'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { Sale } from '@/types';
import { Eye, Download, Search, Calendar, DollarSign, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await api.sales.getAll();
      if (response.success && response.data) {
        setSales(response.data);
      } else {
        toast.error('Failed to load sales');
      }
    } catch (error) {
      console.error('Failed to load sales:', error);
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.saleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.cashier?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalSales = () => {
    return filteredSales.reduce((total, sale) => total + sale.totalAmount, 0);
  };

  const getPaymentMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'default';
      case 'MOMO_MTN':
      case 'MOMO_AIRTEL':
        return 'secondary';
      case 'CARD':
        return 'outline';
      case 'BANK_TRANSFER':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      case 'REFUNDED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading sales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
          <p className="text-gray-600">View and manage all sales transactions</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Sales
        </Button>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">
                  {getTotalSales().toLocaleString()} RWF
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{filteredSales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Average Sale</p>
                <p className="text-2xl font-bold">
                  {filteredSales.length > 0 ? (getTotalSales() / filteredSales.length).toLocaleString() : 0} RWF
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Cash Sales</p>
                <p className="text-2xl font-bold">
                  {filteredSales.filter(s => s.paymentMethod === 'CASH').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search sales by number, customer, or cashier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredSales.map(sale => (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold text-lg">
                      Sale #{sale.saleNumber || sale.id.slice(0, 8).toUpperCase()}
                    </h3>
                    <Badge variant={getPaymentMethodBadgeColor(sale.paymentMethod)}>
                      {sale.paymentMethod.replace('_', ' ')}
                    </Badge>
                    <Badge variant={getPaymentStatusBadgeColor(sale.paymentStatus)}>
                      {sale.paymentStatus}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Date & Time:</p>
                      <p className="font-medium">
                        {format(new Date(sale.createdAt), 'PPP p')}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Customer:</p>
                      <p className="font-medium">
                        {sale.customer?.name || 'Walk-in Customer'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Cashier:</p>
                      <p className="font-medium">
                        {sale.cashier ? `${sale.cashier.firstName} ${sale.cashier.lastName}` : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Subtotal:</p>
                      <p className="font-medium">{sale.subtotal.toLocaleString()} RWF</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Tax (18%):</p>
                      <p className="font-medium">{sale.taxAmount.toLocaleString()} RWF</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Discount:</p>
                      <p className="font-medium text-red-600">
                        -{sale.discountAmount.toLocaleString()} RWF
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Items:</p>
                      <p className="font-medium">
                        {sale.items?.length || 0} item(s)
                      </p>
                    </div>
                  </div>
                  
                  {sale.notes && (
                    <div>
                      <p className="text-gray-600 text-sm">Notes:</p>
                      <p className="text-sm italic">{sale.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="text-right space-y-2 ml-6">
                  <div className="text-3xl font-bold text-green-600">
                    {sale.totalAmount.toLocaleString()} RWF
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSales.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 
              'Try adjusting your search criteria' : 
              'No sales have been recorded yet'
            }
          </p>
          {!searchTerm && (
            <Button className="bg-green-600 hover:bg-green-700">
              Start Selling
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
