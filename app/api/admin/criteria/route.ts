import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function GET() {
  try {
    const criteria = await prisma.evaluationCriteria.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(criteria)
  } catch (error) {
    console.error("Error fetching criteria:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, weight, maxPoints } = await request.json()

    if (!name || !weight || !maxPoints) {
      return NextResponse.json({ error: "Name, weight, and maxPoints are required" }, { status: 400 })
    }

    const criteria = await prisma.evaluationCriteria.create({
      data: { name, description, weight, maxPoints },
    })

    return NextResponse.json(criteria, { status: 201 })
  } catch (error) {
    console.error("Error creating criteria:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
