import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Demo data for the POS system
    const demoData = {
      stats: {
        totalSales: 1250000, // RWF
        todayRevenue: 85000,  // RWF
        totalProducts: 342,
        lowStockItems: 12,
        totalCustomers: 156,
        activeLoans: 8
      },
      recentSales: [
        {
          id: '1',
          customerName: 'Jean Baptiste',
          amount: 25000,
          currency: 'RWF',
          items: 2,
          paymentMethod: 'MOBILE_MONEY',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          customerName: 'Marie Claire',
          amount: 15000,
          currency: 'RWF',
          items: 1,
          paymentMethod: 'CASH',
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: '3',
          customerName: 'David Nkurunziza',
          amount: 35000,
          currency: 'RWF',
          items: 3,
          paymentMethod: 'MOBILE_MONEY',
          timestamp: new Date(Date.now() - 600000).toISOString()
        }
      ],
      lowStockItems: [
        {
          id: '1',
          name: 'iPhone Lightning Cable',
          currentStock: 2,
          minStock: 10,
          price: 8000,
          currency: 'RWF'
        },
        {
          id: '2',
          name: 'Samsung Galaxy Case',
          currentStock: 1,
          minStock: 15,
          price: 12000,
          currency: 'RWF'
        },
        {
          id: '3',
          name: 'Universal Charger',
          currentStock: 3,
          minStock: 20,
          price: 15000,
          currency: 'RWF'
        }
      ]
    }

    return NextResponse.json({
      success: true,
      data: demoData,
      message: 'Vevurn POS System - Demo data loaded successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to load demo data',
      message: error.message
    }, { status: 500 })
  }
}
