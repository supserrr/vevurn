import { auth } from "../../../../../lib/auth"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to get the actual values
    const { id: userId } = await params

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

    const body = await request.json()

    // Validate allowed fields
    const allowedFields = ['role', 'isActive', 'maxDiscountAllowed', 'canSellBelowMin']
    const updateData: any = {}

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
      }
    })

    return Response.json(updatedUser)
  } catch (error: any) {
    console.error('Error updating user:', error)
    if (error?.code === 'P2025') {
      return Response.json({ error: "User not found" }, { status: 404 })
    }
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
