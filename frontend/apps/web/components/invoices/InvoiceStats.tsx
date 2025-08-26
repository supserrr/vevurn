'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface InvoiceStatsData {
  totalInvoices: number;
  draftInvoices: number;
  sentInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  averagePaymentTime: number; // in days
  paymentRate: number; // percentage
  growthRate: number; // percentage compared to previous period
}

interface InvoiceStatsProps {
  stats: InvoiceStatsData;
}

export function InvoiceStats({ stats }: InvoiceStatsProps) {
  const outstandingAmount = stats.totalAmount - stats.paidAmount;
  const collectionRate = stats.totalAmount > 0 ? (stats.paidAmount / stats.totalAmount) * 100 : 0;

  const statCards = [
    {
      title: 'Total Invoices',
      value: formatNumber(stats.totalInvoices),
      icon: FileText,
      description: 'All time invoices',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Outstanding',
      value: formatCurrency(outstandingAmount),
      icon: Clock,
      description: `${stats.sentInvoices + stats.overdueInvoices} pending invoices`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Paid This Month',
      value: formatCurrency(stats.paidAmount),
      icon: CheckCircle,
      description: `${stats.paidInvoices} invoices paid`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: stats.growthRate
    },
    {
      title: 'Overdue',
      value: formatCurrency(stats.overdueAmount),
      icon: AlertTriangle,
      description: `${stats.overdueInvoices} overdue invoices`,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Collection Rate',
      value: `${collectionRate.toFixed(1)}%`,
      icon: DollarSign,
      description: 'Invoice payment success rate',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Avg. Payment Time',
      value: `${stats.averagePaymentTime} days`,
      icon: TrendingUp,
      description: 'Average time to payment',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`${stat.bgColor} ${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.trend !== undefined && (
                  <div className={`flex items-center ${
                    stat.trend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm font-medium">
                      {Math.abs(stat.trend).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
