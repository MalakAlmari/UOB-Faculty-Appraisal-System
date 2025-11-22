import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole, EvaluationStatus } from "@prisma/client"

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

function generateCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row =>
    headers.map(header => {
      const value = row[header]
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value || ''
    }).join(',')
  )
  return [csvHeaders, ...csvRows].join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== UserRole.ADMIN) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const cycleId = searchParams.get('cycleId')
    const collegeId = searchParams.get('collegeId')
    const departmentId = searchParams.get('departmentId')
    const includeAttachments = searchParams.get('includeAttachments') === 'true'

    if (!type || !cycleId) {
      return NextResponse.json({ error: "Report type and cycle ID are required" }, { status: 400 })
    }

    const cycle = await prisma.appraisalCycle.findUnique({
      where: { id: parseInt(cycleId) },
      include: {
        appraisals: {
          include: {
            faculty: {
              include: {
                department: {
                  include: {
                    college: true
                  }
                }
              }
            },
            evaluations: true,
            _count: {
              select: {
                awards: true,
                courses: true,
                researchActivities: true,
                scientificActivities: true,
                universityServices: true,
                communityServices: true,
                evidences: true,
              }
            }
          }
        }
      }
    })

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 })
    }

    let reportData: any[] = []
    let headers: string[] = []
    let filename = `${type}_report_${cycle.academicYear}`

    if (type === 'by-college') {
      // Group by college
      const collegeGroups = new Map()

      cycle.appraisals.forEach(appraisal => {
        const collegeName = appraisal.faculty.department?.college.name || 'No College'
        if (!collegeGroups.has(collegeName)) {
          collegeGroups.set(collegeName, {
            collegeName,
            totalAppraisals: 0,
            completedAppraisals: 0,
            newAppraisals: 0,
            sentAppraisals: 0,
            returnedAppraisals: 0,
            averageScore: 0,
            topHOD: null,
            bottomHOD: null,
            hodScores: []
          })
        }

        const group = collegeGroups.get(collegeName)
        group.totalAppraisals++

        switch (appraisal.status) {
          case 'complete':
            group.completedAppraisals++
            break
          case 'new':
            group.newAppraisals++
            break
          case 'sent':
            group.sentAppraisals++
            break
          case 'returned':
            group.returnedAppraisals++
            break
        }

        if (appraisal.totalScore) {
          group.averageScore += appraisal.totalScore
          if (appraisal.faculty.role === 'HOD') {
            group.hodScores.push({
              name: appraisal.faculty.name,
              score: appraisal.totalScore
            })
          }
        }
      })

      // Calculate averages and find top/bottom HODs
      collegeGroups.forEach(group => {
        if (group.totalAppraisals > 0) {
          group.averageScore = group.averageScore / group.totalAppraisals
        }

        if (group.hodScores.length > 0) {
          group.hodScores.sort((a: any, b: any) => b.score - a.score)
          group.topHOD = group.hodScores[0]
          group.bottomHOD = group.hodScores[group.hodScores.length - 1]
        }

        delete group.hodScores // Remove detailed scores for main report
      })

      reportData = Array.from(collegeGroups.values())
      headers = ['collegeName', 'totalAppraisals', 'completedAppraisals', 'newAppraisals', 'sentAppraisals', 'returnedAppraisals', 'averageScore', 'topHOD', 'bottomHOD']

    } else if (type === 'by-department') {
      // Group by department
      const deptGroups = new Map()

      cycle.appraisals.forEach(appraisal => {
        const deptName = appraisal.faculty.department?.name || 'No Department'
        if (!deptGroups.has(deptName)) {
          deptGroups.set(deptName, {
            departmentName: deptName,
            collegeName: appraisal.faculty.department?.college.name || 'No College',
            totalAppraisals: 0,
            completedAppraisals: 0,
            newAppraisals: 0,
            sentAppraisals: 0,
            returnedAppraisals: 0,
            averageScore: 0,
            topInstructor: null,
            bottomInstructor: null,
            instructorScores: []
          })
        }

        const group = deptGroups.get(deptName)
        group.totalAppraisals++

        switch (appraisal.status) {
          case 'complete':
            group.completedAppraisals++
            break
          case 'new':
            group.newAppraisals++
            break
          case 'sent':
            group.sentAppraisals++
            break
          case 'returned':
            group.returnedAppraisals++
            break
        }

        if (appraisal.totalScore) {
          group.averageScore += appraisal.totalScore
          if (appraisal.faculty.role === 'INSTRUCTOR') {
            group.instructorScores.push({
              name: appraisal.faculty.name,
              score: appraisal.totalScore
            })
          }
        }
      })

      // Calculate averages and find top/bottom instructors
      deptGroups.forEach(group => {
        if (group.totalAppraisals > 0) {
          group.averageScore = group.averageScore / group.totalAppraisals
        }

        if (group.instructorScores.length > 0) {
          group.instructorScores.sort((a: any, b: any) => b.score - a.score)
          group.topInstructor = group.instructorScores[0]
          group.bottomInstructor = group.instructorScores[group.instructorScores.length - 1]
        }

        delete group.instructorScores // Remove detailed scores for main report
      })

      reportData = Array.from(deptGroups.values())
      headers = ['departmentName', 'collegeName', 'totalAppraisals', 'completedAppraisals', 'newAppraisals', 'sentAppraisals', 'returnedAppraisals', 'averageScore', 'topInstructor', 'bottomInstructor']

    } else if (type === 'users-roles') {
      // Users and roles report
      const users = await prisma.user.findMany({
        include: {
          department: {
            include: {
              college: true
            }
          },
          college: true,
          _count: {
            select: {
              appraisals: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' }
        ]
      })

      reportData = users.map(user => ({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        collegeName: user.role === 'DEAN' ? user.college?.name : user.department?.college.name || 'No College',
        departmentName: user.role !== 'DEAN' ? user.department?.name : 'N/A',
        totalAppraisals: user._count.appraisals,
        lastLogin: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'
      }))

      headers = ['name', 'email', 'role', 'status', 'collegeName', 'departmentName', 'totalAppraisals', 'lastLogin']
    }

    // Generate CSV
    const csvContent = generateCSV(reportData, headers)

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    })

  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}