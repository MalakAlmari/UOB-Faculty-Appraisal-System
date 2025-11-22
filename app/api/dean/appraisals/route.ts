import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import type { Prisma, EvaluationStatus, UserRole } from '@prisma/client'
import { EvaluationStatus as EvalEnum, UserRole as RoleEnum } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    const role = session?.user?.role as UserRole | undefined
    if (!session?.user || !(role === RoleEnum.DEAN || role === RoleEnum.ADMIN)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleIdParam = searchParams.get('cycleId')
    const search = searchParams.get('search') || ''
    const statusParam = searchParams.get('status')

    const validStatuses = new Set<string>(Object.values(EvalEnum) as unknown as string[])
    const status: EvaluationStatus | undefined =
      statusParam && validStatuses.has(statusParam) ? (statusParam as EvaluationStatus) : undefined

const me = await prisma.user.findUnique({
  where: { id: Number(session.user.id) },
  include: { department: true, college: true },
})

const collegeId =
  me?.collegeId ??
  me?.college?.id ??
  me?.department?.collegeId

    const cycles = await prisma.appraisalCycle.findMany({
      orderBy: [{ academicYear: 'desc' }],
    })
    if (!collegeId) {
      return NextResponse.json({ appraisals: [], cycles })
    }

    const where: Prisma.AppraisalWhereInput = {
      faculty: {
        role: 'HOD',
        department: { collegeId: Number(collegeId) },
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      ...(cycleIdParam ? { cycleId: Number(cycleIdParam) } : {}),
      ...(status ? { status } : {}),
    }

    const appraisals = await prisma.appraisal.findMany({
      where,
      include: {
        faculty: { include: { department: true } },
        cycle: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ appraisals, cycles })
  } catch (error) {
    console.error('[DEAN_APPRAISALS_API]', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return new NextResponse(JSON.stringify({ message }), { status: 500 })
  }
}
