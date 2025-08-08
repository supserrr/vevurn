'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

interface LowStockItem {
  id: string
  name: string
  sku: string
  currentStock: number
  minStock: number
  category: string
}

export function LowStockAlerts() {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data - replace with actual API call
    const fetchLowStockItems = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 600))
        
        setLowStockItems([
          {
            id: '1',
            name: 'iPhone 14 Case - Black',
            sku: 'CASE-IP14-BLK',
            currentStock: 3,
            minStock: 10,
            category: 'Phone Cases'
          },
          {
            id: '2',
            name: 'USB-C 20W Fast Charger',
            sku: 'CHG-USBC-20W',
            currentStock: 2,
            minStock: 5,
            category: 'Chargers'
          },
          {
            id: '3',
            name: 'Samsung Galaxy S23 Screen Protector',
            sku: 'GLASS-SGS23',
            currentStock: 5,
            minStock: 15,
            category: 'Screen Protectors'
          },
          {
            id: '4',
            name: 'Lightning Cable 1m',
            sku: 'CBL-LIGHT-1M',
            currentStock: 1,
            minStock: 8,
            category: 'Cables'
          },
          {
            id: '5',
            name: 'Phone Stand Universal',
            sku: 'ACC-STAND-UNIV',
            currentStock: 0,
            minStock: 5,
            category: 'Accessories'
          }
        ])
      } catch (error) {
        console.error('Failed to fetch low stock items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLowStockItems()
  }, [])

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-600' }
    } else if (current <= min * 0.3) {
      return { label: 'Critical', variant: 'destructive' as const, color: 'text-red-600' }
    } else if (current <= min * 0.6) {
      return { label: 'Very Low', variant: 'outline' as const, color: 'text-orange-600' }
    } else {
      return { label: 'Low', variant: 'outline' as const, color: 'text-yellow-600' }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Low Stock Alerts</span>
            <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="space-y-1">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 rounded w-20"></div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 bg-gray-300 rounded w-16"></div>
                  <div className="h-3 bg-gray-300 rounded w-12"></div>
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
        <CardTitle className="flex items-center space-x-2">
          <span>Low Stock Alerts</span>
          {lowStockItems.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {lowStockItems.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lowStockItems.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-green-600 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                All products are well stocked!
              </p>
            </div>
          ) : (
            lowStockItems.map((item) => {
              const status = getStockStatus(item.currentStock, item.minStock)
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{item.name}</span>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.sku} • {item.category}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className={`font-semibold text-sm ${status.color}`}>
                      {item.currentStock} / {item.minStock}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      stock
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {lowStockItems.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <button className="text-sm text-primary hover:underline w-full text-center">
              View inventory →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
