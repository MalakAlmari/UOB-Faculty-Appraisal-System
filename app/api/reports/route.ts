import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") // appraisals, achievements, performance, faculty
    const format = searchParams.get("format") || "csv" // json, csv
    const academicYear = searchParams.get("academicYear")
    const userId = searchParams.get("userId")
    const department = searchParams.get("department")
    const collegeId = searchParams.get("collegeId")

    let data: any = {}

    switch (reportType) {
      case "appraisals":
        data = await generateAppraisalsReport(session, academicYear, userId, department, collegeId)
        break
      case "achievements":
        data = await generateAchievementsReport(session, academicYear, userId, department, collegeId)
        break
      case "performance":
        data = await generatePerformanceReport(session, academicYear, userId, department, collegeId)
        break
      case "faculty":
        data = await generateFacultyReport(session, academicYear, department, collegeId)
        break
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    if (format === "csv") {
      const csv = convertToCSV(data)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${reportType}-report.csv"`,
        },
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateAppraisalsReport(session: any, academicYear?: string | null, userId?: string | null, department?: string | null, collegeId?: string | null) {
  const whereClause: any = {}

  // Role-based filtering using proper relationships
  if (session.user.role === UserRole.INSTRUCTOR) {
    whereClause.facultyId = parseInt(session.user.id)
  } else if (session.user.role === UserRole.HOD) {
    // HOD can see appraisals from their department
    const hod = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { department: true }
    })
    if (hod?.department) {
      whereClause.faculty = {
        departmentId: hod.department.id
      }
    }
  } else if (session.user.role === UserRole.DEAN) {
    // DEAN can see appraisals from their college
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { department: { select: { collegeId: true } } }
    })
    const targetCollegeId = collegeId ? parseInt(collegeId) : (user?.department?.collegeId || 0)
    whereClause.faculty = {
      department: {
        collegeId: targetCollegeId
      }
    }
    
    // Filter by specific department if provided
    if (department && department !== 'all') {
      whereClause.faculty.department.name = department
    }
  }

  if (academicYear) whereClause.cycle = { academicYear }
  if (userId) whereClause.facultyId = parseInt(userId)

  const appraisals = await prisma.appraisal.findMany({
    where: whereClause,
    include: {
      faculty: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: {
            select: {
              id: true,
              name: true,
              college: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
      },
      cycle: {
        select: {
          academicYear: true,
          startDate: true,
          endDate: true,
        }
      },
      evaluations: true,
      awards: true,
      courses: true,
      researchActivities: true,
      scientificActivities: true,
      universityServices: true,
      communityServices: true,
    },
    orderBy: { cycle: { academicYear: "desc" } },
  })

  return {
    title: "Appraisals Report",
    generatedAt: new Date().toISOString(),
    totalRecords: appraisals.length,
    data: appraisals,
  }
}

async function generateAchievementsReport(session: any, academicYear?: string | null, userId?: string | null, department?: string | null, collegeId?: string | null) {
  // Build the base where clause for appraisals first
  const appraisalWhereClause: any = {}

  // Role-based filtering using proper relationships
  if (session.user.role === UserRole.INSTRUCTOR) {
    appraisalWhereClause.facultyId = parseInt(session.user.id)
  } else if (session.user.role === UserRole.HOD) {
    // HOD can see achievements from their department
    const hod = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { department: true }
    })
    if (hod?.department) {
      appraisalWhereClause.faculty = {
        departmentId: hod.department.id
      }
    }
  } else if (session.user.role === UserRole.DEAN) {
    // DEAN can see achievements from their college
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { department: { select: { collegeId: true } } }
    })
    const targetCollegeId = collegeId ? parseInt(collegeId) : (user?.department?.collegeId || 0)
    appraisalWhereClause.faculty = {
      department: {
        collegeId: targetCollegeId
      }
    }
    
    // Filter by specific department if provided
    if (department && department !== 'all') {
      appraisalWhereClause.faculty.department.name = department
    }
  }

  if (academicYear) {
    appraisalWhereClause.cycle = { academicYear }
  }
  if (userId) {
    appraisalWhereClause.facultyId = parseInt(userId)
  }

  // Get achievements from multiple models using the correct relationship
  const [awards, researchActivities, scientificActivities, universityServices, communityServices] = await Promise.all([
    prisma.award.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
                department: {
                  select: {
                    name: true,
                    college: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.researchActivity.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
                department: {
                  select: {
                    name: true,
                    college: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.scientificActivity.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
                department: {
                  select: {
                    name: true,
                    college: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.universityService.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
                department: {
                  select: {
                    name: true,
                    college: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.communityService.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
                department: {
                  select: {
                    name: true,
                    college: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Combine all achievements
  const allAchievements: any[] = [
    ...awards.map((a: any) => ({ ...a, type: 'Award', category: 'Awards' })),
    ...researchActivities.map((a: any) => ({ ...a, type: 'Research', category: a.kind })),
    ...scientificActivities.map((a: any) => ({ ...a, type: 'Scientific', category: a.type })),
    ...universityServices.map((a: any) => ({ ...a, type: 'University Service', category: 'Service' })),
    ...communityServices.map((a: any) => ({ ...a, type: 'Community Service', category: 'Service' })),
  ]

  const summary = {
    totalAchievements: allAchievements.length,
    totalAwards: awards.length,
    totalResearch: researchActivities.length,
    totalScientific: scientificActivities.length,
    totalUniversityServices: universityServices.length,
    totalCommunityServices: communityServices.length,
    categorySummary: allAchievements.reduce((acc: any, achievement) => {
      acc[achievement.category] = (acc[achievement.category] || 0) + 1
      return acc
    }, {}),
  }

  return {
    title: "Achievements Report",
    generatedAt: new Date().toISOString(),
    summary,
    data: allAchievements,
  }
}

async function generatePerformanceReport(session: any, academicYear?: string | null, userId?: string | null, department?: string | null, collegeId?: string | null) {
  // Build the base where clause for appraisals first
  const appraisalWhereClause: any = {}

  // Role-based filtering using proper relationships
  if (session.user.role === UserRole.INSTRUCTOR) {
    appraisalWhereClause.facultyId = parseInt(session.user.id)
  } else if (session.user.role === UserRole.HOD) {
    // HOD can see appraisals from their department
    const hod = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { department: true }
    })
    if (hod?.department) {
      appraisalWhereClause.faculty = {
        departmentId: hod.department.id
      }
    }
  } else if (session.user.role === UserRole.DEAN) {
    // DEAN can see appraisals from their college
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { department: { select: { collegeId: true } } }
    })
    const targetCollegeId = collegeId ? parseInt(collegeId) : (user?.department?.collegeId || 0)
    appraisalWhereClause.faculty = {
      department: {
        collegeId: targetCollegeId
      }
    }
    
    // Filter by specific department if provided
    if (department && department !== 'all') {
      appraisalWhereClause.faculty.department.name = department
    }
  }

  if (academicYear) appraisalWhereClause.cycle = { academicYear }
  if (userId) appraisalWhereClause.facultyId = parseInt(userId)

  const [appraisals, awards, researchActivities, scientificActivities, universityServices, communityServices] = await Promise.all([
    prisma.appraisal.findMany({
      where: appraisalWhereClause,
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                name: true,
                college: {
                  select: { name: true }
                }
              }
            }
          },
        },
        cycle: {
          select: {
            academicYear: true,
          }
        },
        evaluations: true,
      },
    }),
    prisma.award.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            facultyId: true,
          }
        }
      },
    }),
    prisma.researchActivity.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            facultyId: true,
          }
        }
      },
    }),
    prisma.scientificActivity.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            facultyId: true,
          }
        }
      },
    }),
    prisma.universityService.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            facultyId: true,
          }
        }
      },
    }),
    prisma.communityService.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            facultyId: true,
          }
        }
      },
    }),
  ])

  // Combine all achievements and group by faculty
  const allAchievements: any[] = [
    ...awards.map((a: any) => ({ ...a, type: 'Award' })),
    ...researchActivities.map((a: any) => ({ ...a, type: 'Research' })),
    ...scientificActivities.map((a: any) => ({ ...a, type: 'Scientific' })),
    ...universityServices.map((a: any) => ({ ...a, type: 'University Service' })),
    ...communityServices.map((a: any) => ({ ...a, type: 'Community Service' })),
  ]

  const achievementsByFaculty = allAchievements.reduce((acc: any, achievement) => {
    const facultyId = achievement.appraisal.facultyId
    if (!acc[facultyId]) {
      acc[facultyId] = []
    }
    acc[facultyId].push(achievement)
    return acc
  }, {})

  const performanceData = appraisals.map((appraisal) => {
    const userAchievements = achievementsByFaculty[appraisal.facultyId] || []
    return {
      faculty: appraisal.faculty,
      cycle: appraisal.cycle,
      appraisal: {
        status: appraisal.status,
        totalScore: appraisal.totalScore,
        evaluations: appraisal.evaluations,
      },
      achievements: {
        total: userAchievements.length,
        awards: userAchievements.filter((a: any) => a.type === 'Award').length,
        research: userAchievements.filter((a: any) => a.type === 'Research').length,
        scientific: userAchievements.filter((a: any) => a.type === 'Scientific').length,
        universityServices: userAchievements.filter((a: any) => a.type === 'University Service').length,
        communityServices: userAchievements.filter((a: any) => a.type === 'Community Service').length,
      },
    }
  })

  return {
    title: "Performance Report",
    generatedAt: new Date().toISOString(),
    totalRecords: performanceData.length,
    data: performanceData,
  }
}

async function generateFacultyReport(session: any, academicYear?: string | null, department?: string | null, collegeId?: string | null) {
  // For deans, try to get collegeId from parameter first, then session
  let targetCollegeId: number | null = null
  if (session.user.role === UserRole.DEAN) {
    targetCollegeId = collegeId ? parseInt(collegeId) : null
    if (!targetCollegeId) {
      // If no collegeId provided, try to get from user's department
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { department: { select: { collegeId: true } } }
      })
      targetCollegeId = user?.department?.collegeId || null
    }
  }

  let whereClause: any = {}

  // Role-based filtering
  if (session.user.role === UserRole.INSTRUCTOR) {
    whereClause.id = parseInt(session.user.id)
  } else if (session.user.role === UserRole.HOD) {
    // For HOD, get their department
    const hod = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { department: true }
    })
    if (hod?.department) {
      whereClause.departmentId = hod.department.id
    }
  } else if (session.user.role === UserRole.DEAN) {
    if (targetCollegeId) {
      whereClause = {
        department: {
          collegeId: targetCollegeId
        }
      }
    }
  }

  // Filter by specific department if provided
  if (department && department !== 'all') {
    if (session.user.role === UserRole.INSTRUCTOR) {
      return {
        title: "Faculty Overview Report",
        generatedAt: new Date().toISOString(),
        totalRecords: 0,
        data: [],
        error: "Instructors cannot filter by department"
      }
    }
    if (whereClause.department) {
      whereClause.department = { ...whereClause.department, name: department }
    } else {
      whereClause.department = { name: department }
    }
  }

  const faculty = await prisma.user.findMany({
    where: {
      ...whereClause,
      role: { in: [UserRole.INSTRUCTOR, UserRole.HOD] }
    },
    include: {
      department: {
        include: { college: { select: { name: true } } }
      },
      appraisals: {
        where: academicYear ? { cycle: { academicYear } } : {},
        include: {
          cycle: true,
          awards: true,
          courses: true,
          researchActivities: true,
          scientificActivities: true,
          universityServices: true,
          communityServices: true,
          evaluations: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  const facultyOverview = faculty.map((f) => {
    const appraisals = f.appraisals
    const totalAppraisals = appraisals.length
    const totalAwards = appraisals.reduce((sum, app) => sum + app.awards.length, 0)
    const totalResearch = appraisals.reduce((sum, app) => sum + app.researchActivities.length, 0)
    const totalCourses = appraisals.reduce((sum, app) => sum + app.courses.length, 0)
    const totalServices = appraisals.reduce((sum, app) => sum + app.universityServices.length + app.communityServices.length, 0)
    const avgScore = appraisals.length > 0
      ? appraisals.reduce((sum, app) => sum + (app.totalScore || 0), 0) / appraisals.length
      : 0

    return {
      name: f.name,
      email: f.email,
      role: f.role,
      department: f.department?.name || 'N/A',
      college: f.department?.college?.name || 'N/A',
      totalAppraisals,
      totalAchievements: totalAwards + totalResearch + totalCourses + totalServices,
      totalAwards,
      totalResearch,
      totalCourses,
      totalServices,
      averageScore: Math.round(avgScore * 100) / 100,
      lastAppraisal: appraisals.length > 0 ? appraisals[0].cycle.academicYear : 'N/A'
    }
  })

  return {
    title: "Faculty Overview Report",
    generatedAt: new Date().toISOString(),
    totalRecords: facultyOverview.length,
    data: facultyOverview,
  }
}

function convertToCSV(data: any): string {
  if (!data.data || data.data.length === 0) {
    return "No data available"
  }

  const headers = Object.keys(data.data[0])
  const csvContent = [
    headers.join(","),
    ...data.data.map((row: any) =>
      headers
        .map((header) => {
          const value = row[header]
          if (typeof value === "object" && value !== null) {
            return JSON.stringify(value).replace(/"/g, '""')
          }
          return `"${String(value).replace(/"/g, '""')}"`
        })
        .join(","),
    ),
  ].join("\n")

  return csvContent
}
