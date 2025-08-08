import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check without database for now
    const stats = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      service: 'vevurn-pos',
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      memory: process.memoryUsage(),
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
