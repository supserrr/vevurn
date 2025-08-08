import { auth } from "../../../../lib/auth"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return Response.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        maxDiscountAllowed: true,
        canSellBelowMin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return Response.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
