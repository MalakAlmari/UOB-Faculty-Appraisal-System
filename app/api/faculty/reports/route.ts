import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import jsPDF from 'jspdf'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get("cycleId")
    const format = searchParams.get("format") || "json" // json, pdf

    if (!cycleId) {
      return NextResponse.json({ error: "Cycle ID is required" }, { status: 400 })
    }

    // Get the current user ID
    const userId = session.user.id

    // Fetch appraisal data for the current user and cycle
    const appraisal = await prisma.appraisal.findFirst({
      where: {
        facultyId: parseInt(userId),
        cycleId: parseInt(cycleId),
      },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            academicRank: true,
            department: {
              select: {
                name: true,
                college: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        cycle: {
          select: {
            academicYear: true,
            startDate: true,
            endDate: true,
          },
        },
        awards: {
          orderBy: { dateObtained: "desc" },
        },
        courses: {
          orderBy: { createdAt: "desc" },
        },
        researchActivities: {
          orderBy: { publicationDate: "desc" },
        },
        scientificActivities: {
          orderBy: { date: "desc" },
        },
        universityServices: {
          orderBy: { dateFrom: "desc" },
        },
        communityServices: {
          orderBy: { dateFrom: "desc" },
        },
        evaluations: {
          include: {
            behaviorRatings: true,
          },
        },
      },
    })

    if (!appraisal) {
      return NextResponse.json({ error: "Appraisal not found for this cycle" }, { status: 404 })
    }

    // Calculate totals
    const totalAchievements =
      appraisal.awards.length +
      appraisal.courses.length +
      appraisal.researchActivities.length +
      appraisal.scientificActivities.length +
      appraisal.universityServices.length +
      appraisal.communityServices.length

    const reportData = {
      title: "Faculty Appraisal Report",
      generatedAt: new Date().toISOString(),
      faculty: appraisal.faculty,
      cycle: appraisal.cycle,
      appraisal: {
        id: appraisal.id,
        status: appraisal.status,
        totalScore: appraisal.totalScore,
        submittedAt: appraisal.submittedAt,
        createdAt: appraisal.createdAt,
        updatedAt: appraisal.updatedAt,
      },
      achievements: {
        total: totalAchievements,
        awards: appraisal.awards,
        courses: appraisal.courses,
        research: appraisal.researchActivities,
        scientific: appraisal.scientificActivities,
        universityServices: appraisal.universityServices,
        communityServices: appraisal.communityServices,
      },
      evaluations: appraisal.evaluations,
    }

    if (format === "pdf") {
      // Generate PDF using jsPDF
      const pdf = new jsPDF()

      // Set font
      pdf.setFont("helvetica")

      // Title
      pdf.setFontSize(20)
      pdf.text(reportData.title, 20, 30)

      // Generated date
      pdf.setFontSize(12)
      pdf.text(`Generated: ${new Date(reportData.generatedAt).toLocaleDateString()}`, 20, 45)

      // Faculty information
      pdf.setFontSize(16)
      pdf.text("Faculty Information", 20, 65)

      pdf.setFontSize(12)
      let yPos = 80
      pdf.text(`Name: ${reportData.faculty.name}`, 20, yPos)
      yPos += 10
      pdf.text(`Email: ${reportData.faculty.email}`, 20, yPos)
      yPos += 10
      pdf.text(`Department: ${reportData.faculty.department?.name || 'N/A'}`, 20, yPos)
      yPos += 10
      pdf.text(`College: ${reportData.faculty.department?.college?.name || 'N/A'}`, 20, yPos)
      yPos += 10
      pdf.text(`Academic Rank: ${reportData.faculty.academicRank || 'N/A'}`, 20, yPos)
      yPos += 15

      // Cycle information
      pdf.setFontSize(16)
      pdf.text("Appraisal Cycle", 20, yPos)
      yPos += 15

      pdf.setFontSize(12)
      pdf.text(`Academic Year: ${reportData.cycle.academicYear}`, 20, yPos)
      yPos += 10
      pdf.text(`Start Date: ${new Date(reportData.cycle.startDate).toLocaleDateString()}`, 20, yPos)
      yPos += 10
      pdf.text(`End Date: ${new Date(reportData.cycle.endDate).toLocaleDateString()}`, 20, yPos)
      yPos += 15

      // Appraisal information
      pdf.setFontSize(16)
      pdf.text("Appraisal Results", 20, yPos)
      yPos += 15

      pdf.setFontSize(12)
      pdf.text(`Status: ${reportData.appraisal.status}`, 20, yPos)
      yPos += 10
      pdf.text(`Total Score: ${reportData.appraisal.totalScore || 'Pending'}%`, 20, yPos)
      yPos += 10
      pdf.text(`Submitted: ${reportData.appraisal.submittedAt ? new Date(reportData.appraisal.submittedAt).toLocaleDateString() : 'Not submitted'}`, 20, yPos)
      yPos += 15

      // Achievements summary
      pdf.setFontSize(16)
      pdf.text("Achievements Summary", 20, yPos)
      yPos += 15

      pdf.setFontSize(12)
      pdf.text(`Total Achievements: ${reportData.achievements.total}`, 20, yPos)
      yPos += 10

      const achievementTypes = [
        { name: 'Awards', count: reportData.achievements.awards.length },
        { name: 'Courses', count: reportData.achievements.courses.length },
        { name: 'Research Activities', count: reportData.achievements.research.length },
        { name: 'Scientific Activities', count: reportData.achievements.scientific.length },
        { name: 'University Services', count: reportData.achievements.universityServices.length },
        { name: 'Community Services', count: reportData.achievements.communityServices.length },
      ]

      achievementTypes.forEach(type => {
        if (type.count > 0) {
          pdf.text(`${type.name}: ${type.count}`, 20, yPos)
          yPos += 8
        }
      })

      // Check if we need a new page
      if (yPos > 250) {
        pdf.addPage()
        yPos = 30
      }

      // Evaluations section
      if (reportData.evaluations && reportData.evaluations.length > 0) {
        pdf.setFontSize(16)
        pdf.text("Evaluation Details", 20, yPos)
        yPos += 15

        reportData.evaluations.forEach((evaluation: any, index: number) => {
          pdf.setFontSize(12)
          pdf.text(`${evaluation.role} Evaluation`, 20, yPos)
          yPos += 10

          // Calculate performance total
          const perfTotal = (evaluation.researchPts || 0) +
                           (evaluation.universityServicePts || 0) +
                           (evaluation.communityServicePts || 0) +
                           (evaluation.teachingQualityPts || 0)

          // Calculate capabilities total from rubric if available
          let capTotal = evaluation.capabilitiesPts || 0
          if (evaluation.rubric?.capabilities?.selections) {
            const capabilities = evaluation.role === 'DEAN'
              ? ['institutionalCommitment', 'customerService', 'leadingIndividuals', 'leadingChange', 'strategicVision']
              : ['institutionalCommitment', 'collaborationTeamwork', 'professionalism', 'clientService', 'achievingResults']

            const capPoints: Record<string, number> = {
              HIGH: 20, EXCEEDS: 16, MEETS: 12, PARTIAL: 8, NEEDS: 4
            }

            const capScores = capabilities.map(cap => {
              const band = evaluation.rubric.capabilities.selections[cap]
              return band ? capPoints[band] || 0 : 0
            })
            capTotal = capScores.reduce((sum, score) => sum + score, 0)
          }

          const overallTotal = perfTotal + capTotal

          // Performance scores
          pdf.text(`Research: ${evaluation.researchPts || 0}/30`, 30, yPos)
          yPos += 8
          pdf.text(`University Service: ${evaluation.universityServicePts || 0}/20`, 30, yPos)
          yPos += 8
          pdf.text(`Community Service: ${evaluation.communityServicePts || 0}/20`, 30, yPos)
          yPos += 8
          pdf.text(`Teaching Quality: ${evaluation.teachingQualityPts || 0}/30`, 30, yPos)
          yPos += 8
          pdf.text(`Performance Total: ${perfTotal}/100`, 30, yPos)
          yPos += 10

          // Capabilities scores
          if (evaluation.rubric?.capabilities?.selections) {
            const capabilities = evaluation.role === 'DEAN'
              ? ['institutionalCommitment', 'customerService', 'leadingIndividuals', 'leadingChange', 'strategicVision']
              : ['institutionalCommitment', 'collaborationTeamwork', 'professionalism', 'clientService', 'achievingResults']

            const capPoints: Record<string, number> = {
              HIGH: 20, EXCEEDS: 16, MEETS: 12, PARTIAL: 8, NEEDS: 4
            }

            capabilities.forEach(cap => {
              const band = evaluation.rubric.capabilities.selections[cap]
              const score = band ? capPoints[band] : 0
              const capName = cap.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
              pdf.text(`${capName}: ${score}/20`, 30, yPos)
              yPos += 8
            })
          }

          pdf.text(`Capabilities Total: ${capTotal}/100`, 30, yPos)
          yPos += 8
          pdf.text(`Overall Total: ${overallTotal}/200`, 30, yPos)
          yPos += 15

          // Check if we need a new page
          if (yPos > 250) {
            pdf.addPage()
            yPos = 30
          }
        })
      }

      // Convert PDF to buffer and return as response
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="appraisal-report-${reportData.cycle.academicYear}.pdf"`,
        },
      })
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error generating faculty report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}