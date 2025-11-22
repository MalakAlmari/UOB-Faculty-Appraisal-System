import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cycles = await prisma.appraisalCycle.findMany({
      orderBy: {
        startDate: "desc"
      }
    })

    return NextResponse.json(cycles)
  } catch (error) {
    console.error("Error fetching appraisal cycles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}