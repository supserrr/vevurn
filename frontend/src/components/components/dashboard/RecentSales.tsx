'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

interface Sale {
  id: string
  receiptNumber: string
  customerName?: string
  totalAmount: number
  currency: string
  paymentStatus: string
  createdAt: string
  itemCount: number
}

export function RecentSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data - replace with actual API call
    const fetchRecentSales = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setSales([
          {
            id: '1',
            receiptNumber: 'VEV-001',
            customerName: 'John Mugisha',
            totalAmount: 25000,
            currency: 'RWF',
            paymentStatus: 'COMPLETED',
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            itemCount: 2
          },
          {
            id: '2',
            receiptNumber: 'VEV-002',
            customerName: 'Alice Uwimana',
            totalAmount: 15000,
            currency: 'RWF',
            paymentStatus: 'COMPLETED',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            itemCount: 1
          },
          {
            id: '3',
            receiptNumber: 'VEV-003',
            totalAmount: 45000,
            currency: 'RWF',
            paymentStatus: 'PENDING',
            createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            itemCount: 3
          },
          {
            id: '4',
            receiptNumber: 'VEV-004',
            customerName: 'David Nsengimana',
            totalAmount: 35000,
            currency: 'RWF',
            paymentStatus: 'COMPLETED',
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            itemCount: 2
          },
          {
            id: '5',
            receiptNumber: 'VEV-005',
            customerName: 'Grace Imanzi',
            totalAmount: 20000,
            currency: 'RWF',
            paymentStatus: 'COMPLETED',
            createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
            itemCount: 1
          }
        ])
      } catch (error) {
        console.error('Failed to fetch recent sales:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSales()
  }, [])

  const formatCurrency = (amount: number, currency: string = 'RWF') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sales.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No recent sales found
            </p>
          ) : (
            sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {sale.receiptNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {sale.customerName || 'Walk-in customer'}
                    </span>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">
                      {formatCurrency(sale.totalAmount, sale.currency)}
                    </span>
                    {getStatusBadge(sale.paymentStatus)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sale.itemCount} item{sale.itemCount !== 1 ? 's' : ''} • {formatTime(sale.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {sales.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <button className="text-sm text-primary hover:underline w-full text-center">
              View all sales →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
