// prisma/seed.ts
import { PrismaClient, Prisma, UserRole, Semester, EvaluationRole, EvaluationStatus, RatingBand } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// ---------- Helpers ----------
const PWD = "Passw0rd!" 
async function hash(p: string) { return bcrypt.hash(p, 10) }

function tqPoints(avg: number): { band: RatingBand, pts: 30|24|18|12|6 } {
  if (avg >= 90) return { band: "HIGHLY_EXCEEDS", pts: 30 }
  if (avg >= 80) return { band: "EXCEEDS", pts: 24 }
  if (avg >= 60) return { band: "FULLY_MEETS", pts: 18 }
  if (avg >= 50) return { band: "PARTIALLY_MEETS", pts: 12 }
  return { band: "NEEDS_IMPROVEMENT", pts: 6 }
}
function servicePts(count: number): number {
  return Math.min(count * 4, 20)
}
function sumSafe(...vals: Array<number | null | undefined>) {
  return vals.reduce((a: number, b) => a + (b ?? 0), 0)
}

// ---------- Main ----------
async function main() {
  console.log("🌱 Seeding...")

  // 1) Colleges & Departments
  const coe = await prisma.college.upsert({
    where: { code: "COE" },
    update: {},
    create: { name: "College of Engineering", code: "COE" },
  })
  const cob = await prisma.college.upsert({
    where: { code: "COB" },
    update: {},
    create: { name: "College of Business", code: "COB" },
  })

  const cs = await prisma.department.create({
    data: { name: "Computer Science", code: "CS", collegeId: coe.id },
  })
  const ee = await prisma.department.create({
    data: { name: "Electrical Engineering", code: "EE", collegeId: coe.id },
  })
  const mkt = await prisma.department.create({
    data: { name: "Marketing", code: "MKT", collegeId: cob.id },
  })

  // 2) Users (ADMIN, DEAN, HODs, Faculty)
  const pwd = await hash(PWD)

  const admin = await prisma.user.upsert({
    where: { email: "admin@uob.edu" },
    update: {},
    create: {
      email: "admin@uob.edu",
      name: "System Admin",
      role: "ADMIN",
      passwordHash: pwd,
      status: "ACTIVE",
      image: null,
    },
  })

  const deanEng = await prisma.user.upsert({
    where: { email: "dean-eng@uob.edu" },
    update: {},
    create: {
      email: "dean-eng@uob.edu",
      name: "Dean (Engineering)",
      role: "DEAN",
      departmentId: cs.id,
      passwordHash: pwd,
      status: "ACTIVE",
      image: null,
    },
  })

  const hodCS = await prisma.user.upsert({
    where: { email: "hod-cs@uob.edu" },
    update: {},
    create: {
      email: "hod-cs@uob.edu",
      name: "Head of CS",
      role: "HOD",
      departmentId: cs.id,
      passwordHash: pwd,
      status: "ACTIVE",
      image: null,
    },
  })

  const hodEE = await prisma.user.upsert({
    where: { email: "hod-ee@uob.edu" },
    update: {},
    create: {
      email: "hod-ee@uob.edu",
      name: "Head of EE",
      role: "HOD",
      departmentId: ee.id,
      passwordHash: pwd,
      status: "ACTIVE",
      image: null,
    },
  })

  const fAlice = await prisma.user.upsert({
    where: { email: "alice@uob.edu" },
    update: {},
    create: {
      email: "alice@uob.edu",
      name: "Alice (Faculty)",
      role: "INSTRUCTOR",
      departmentId: cs.id,
      passwordHash: pwd,
      status: "ACTIVE",
      image: null,
    },
  })

  const fBob = await prisma.user.upsert({
    where: { email: "bob@uob.edu" },
    update: {},
    create: {
      email: "bob@uob.edu",
      name: "Bob (Faculty)",
      role: "INSTRUCTOR",
      departmentId: cs.id,
      passwordHash: pwd,
      status: "ACTIVE",
      image: null,
    },
  })

  const fEve = await prisma.user.upsert({
    where: { email: "eve@uob.edu" },
    update: {},
    create: {
      email: "eve@uob.edu",
      name: "Eve (Faculty)",
      role: "INSTRUCTOR",
      departmentId: ee.id,
      passwordHash: pwd,
      status: "ACTIVE",
      image: null,
    },
  })

  // اربط HOD كحقل على القسم (اختياري)
  await prisma.department.update({ where: { id: cs.id }, data: { hodUserId: hodCS.id } })
  await prisma.department.update({ where: { id: ee.id }, data: { hodUserId: hodEE.id } })

  // 3) Appraisal Cycles
  const fall = await prisma.appraisalCycle.upsert({
    where: { academicYear: "2024/2025" },
    update: { isActive: true },
    create: {
      academicYear: "2024/2025",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2025-01-31"),
      isActive: true,
    },
  })

  const spring = await prisma.appraisalCycle.upsert({
    where: { academicYear: "2024/2025-SPRING" },
    update: {},
    create: {
      academicYear: "2024/2025-SPRING",
      startDate: new Date("2025-02-15"),
      endDate: new Date("2025-06-30"),
      isActive: false,
    },
  })

  // 4) Appraisals
  // - لأعضاء هيئة التدريس (HOD سيقيمهم)
  const appAlice = await prisma.appraisal.create({
    data: {
      facultyId: fAlice.id,
      cycleId: fall.id,
      status: "new",
      submittedAt: new Date("2025-01-10"),
    },
  })
  const appBob = await prisma.appraisal.create({
    data: {
      facultyId: fBob.id,
      cycleId: fall.id,
      status: "new",
      submittedAt: new Date("2025-01-12"),
    },
  })
  const appEve = await prisma.appraisal.create({
    data: {
      facultyId: fEve.id,
      cycleId: fall.id,
      status: "new",
      submittedAt: new Date("2025-01-08"),
    },
  })

  // - Appraisal لـ HOD نفسه (سيقيّمه الـ Dean)
  const appHodCS = await prisma.appraisal.create({
    data: {
      facultyId: hodCS.id,
      cycleId: fall.id,
      status: "new",
      submittedAt: new Date("2025-01-15"),
    },
  })

  // 5) Achievements (Awards/Courses/Research/Scientific/Services)
  async function seedAchievements(appraisalId: number, deptCode: string) {
    // Awards
    await prisma.award.createMany({
      data: [
        {
          appraisalId,
          name: "Best Paper Award",
          area: "Research",
          organization: "IEEE",
          dateObtained: new Date("2024-12-05"),
          attachment: "https://example.com/awards/best-paper.pdf",
          fileUrl: "https://example.com/awards/best-paper.pdf",
        },
        {
          appraisalId,
          name: "Teaching Excellence",
          area: "Teaching",
          organization: "University Council",
          dateObtained: new Date("2024-11-10"),
          attachment: "https://example.com/awards/teaching-excellence.pdf",
          fileUrl: "https://example.com/awards/teaching-excellence.pdf",
        },
      ],
    })

    // Courses (studentsEvalAvg يؤثر على جودة التدريس)
    await prisma.courseTaught.createMany({
      data: [
        {
          appraisalId,
          academicYear: "2024/2025",
          semester: "FALL",
          courseCode: `${deptCode}101`,
          section: "A",
          courseTitle: "Intro Course",
          credit: 3,
          studentsCount: 45,
          studentsEvalAvg: 88,
        },
        {
          appraisalId,
          academicYear: "2024/2025",
          semester: "FALL",
          courseCode: `${deptCode}205`,
          section: "B",
          courseTitle: "Advanced Topics",
          credit: 3,
          studentsCount: 38,
          studentsEvalAvg: 92,
        },
      ],
    })

    // Research
    await prisma.researchActivity.createMany({
      data: [
        {
          appraisalId,
          title: "Published Paper on AI",
          type: "JOURNAL",
          kind: "PUBLISHED",
          journalOrPublisher: "Elsevier",
          participation: "MAIN_AUTHOR",
          publicationDate: new Date("2024-10-01"),
          attachment: "https://example.com/research/ai-paper.pdf",
          fileUrl: "https://example.com/research/ai-paper.pdf",
        },
        {
          appraisalId,
          title: "Accepted Paper on Systems",
          type: "CONFERENCE",
          kind: "ACCEPTED",
          journalOrPublisher: "Springer",
          participation: "CO_AUTHOR",
          publicationDate: new Date("2024-12-20"),
          attachment: "https://example.com/research/systems-paper.pdf",
          fileUrl: "https://example.com/research/systems-paper.pdf",
        },
        {
          appraisalId,
          title: "Refereed Article Review",
          type: "OTHER",
          kind: "REFEREED_PAPER",
          journalOrPublisher: "ACM",
          participation: "REFEREE",
          refereeDecisionDate: new Date("2024-11-30"),
          attachment: "https://example.com/research/review-article.pdf",
          fileUrl: "https://example.com/research/review-article.pdf",
        },
      ],
    })

    // Scientific Activities
    await prisma.scientificActivity.createMany({
      data: [
        {
          appraisalId,
          title: "International Conference on Computing",
          type: "CONFERENCE",
          date: new Date("2024-10-20"),
          participation: "PRESENTER",
          organizingAuth: "IEEE",
          venue: "Dubai",
          attachment: "https://example.com/scientific/conference-presentation.pdf",
          fileUrl: "https://example.com/scientific/conference-presentation.pdf",
        },
        {
          appraisalId,
          title: "Department Workshop",
          type: "WORKSHOP",
          date: new Date("2024-12-01"),
          participation: "COORDINATOR",
          organizingAuth: "CS Dept",
          venue: "Campus",
          attachment: "https://example.com/scientific/workshop-materials.pdf",
          fileUrl: "https://example.com/scientific/workshop-materials.pdf",
        },
      ],
    })

    // University Service
    await prisma.universityService.createMany({
      data: [
        {
          appraisalId,
          committeeOrTask: "Curriculum Committee",
          authority: "Faculty Senate",
          participation: "Member",
          dateFrom: new Date("2024-09-10"),
          dateTo: new Date("2025-01-15"),
          attachment: "https://example.com/services/curriculum-meeting-minutes.pdf",
          fileUrl: "https://example.com/services/curriculum-meeting-minutes.pdf",
        },
        {
          appraisalId,
          committeeOrTask: "Quality Assurance",
          authority: "QA Office",
          participation: "Participant",
          dateFrom: new Date("2024-09-05"),
          dateTo: new Date("2024-12-15"),
          attachment: "https://example.com/services/qa-report.pdf",
          fileUrl: "https://example.com/services/qa-report.pdf",
        },
      ],
    })

    // Community Service
    await prisma.communityService.createMany({
      data: [
        {
          appraisalId,
          committeeOrTask: "STEM Outreach",
          authority: "Local School",
          participation: "Speaker",
          dateFrom: new Date("2024-11-01"),
          dateTo: new Date("2024-11-01"),
          attachment: "https://example.com/community/stem-outreach-photos.pdf",
          fileUrl: "https://example.com/community/stem-outreach-photos.pdf",
        },
        {
          appraisalId,
          committeeOrTask: "Open Day Volunteer",
          authority: "City Council",
          participation: "Volunteer",
          dateFrom: new Date("2024-12-08"),
          dateTo: new Date("2024-12-08"),
          attachment: "https://example.com/community/open-day-certificate.pdf",
          fileUrl: "https://example.com/community/open-day-certificate.pdf",
        },
        {
          appraisalId,
          committeeOrTask: "Community Coding Bootcamp",
          authority: "Non-profit",
          participation: "Instructor",
          dateFrom: new Date("2025-01-02"),
          dateTo: new Date("2025-01-05"),
          attachment: "https://example.com/community/bootcamp-materials.pdf",
          fileUrl: "https://example.com/community/bootcamp-materials.pdf",
        },
      ],
    })
  }

  await seedAchievements(appAlice.id, "CS")
  await seedAchievements(appBob.id, "CS")
  await seedAchievements(appEve.id, "EE")
  await seedAchievements(appHodCS.id, "CS")

  // 6) Compute & Create Evaluations (HOD evaluates faculty; Dean evaluates HOD)
  async function finalizeEvaluation(appraisalId: number, role: EvaluationRole) {
    // Compute Teaching Quality avg
    const courses = await prisma.courseTaught.findMany({
      where: { appraisalId, studentsEvalAvg: { not: null } },
      select: { studentsEvalAvg: true },
    })
    const vals = courses.map(c => Number(c.studentsEvalAvg)).filter(Number.isFinite)
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    const tq = tqPoints(avg)

    // Count services
    const univCount = await prisma.universityService.count({ where: { appraisalId } })
    const commCount = await prisma.communityService.count({ where: { appraisalId } })

    // Rough research heuristic: based on number + types
    const research = await prisma.researchActivity.findMany({ where: { appraisalId } })
    // مثال بسيط: PUBLISHED=10، ACCEPTED=8، REFEREED_PAPER=4 (limited to 30)
    const rPtsCalc = Math.min(
      research.reduce((acc, r) => {
        if (r.kind === "PUBLISHED") return acc + 10
        if (r.kind === "ACCEPTED") return acc + 8
        if (r.kind === "REFEREED_PAPER") return acc + 4
        if (r.kind === "FUNDED_PROJECT") return acc + 10
        if (r.kind === "REGISTERED_PATENT") return acc + 10
        return acc + 2 // others
      }, 0),
      30
    )

    const uPts = servicePts(univCount)
    const cPts = servicePts(commCount)
    const total = sumSafe(rPtsCalc, uPts, cPts, tq.pts)

    // Upsert evaluation
    const evaluation = await prisma.evaluation.upsert({
      where: { appraisalId_role: { appraisalId, role } },
      update: {
        startedAt: new Date("2025-01-20"),
        submittedAt: new Date("2025-01-25"),
        researchPts: rPtsCalc,
        universityServicePts: uPts,
        communityServicePts: cPts,
        teachingQualityPts: tq.pts,
        totalScore: total,
        rubric: {
          research: { items: research.length, points: rPtsCalc },
          universityService: { count: univCount, each: 4, points: uPts },
          communityService: { count: commCount, each: 4, points: cPts },
          teachingQuality: { avg: Number(avg.toFixed(2)), band: tq.band, points: tq.pts },
        } as any,
      },
      create: {
        appraisalId,
        role,
        startedAt: new Date("2025-01-20"),
        submittedAt: new Date("2025-01-25"),
        researchPts: rPtsCalc,
        universityServicePts: uPts,
        communityServicePts: cPts,
        teachingQualityPts: tq.pts,
        totalScore: total,
        rubric: {
          research: { items: research.length, points: rPtsCalc },
          universityService: { count: univCount, each: 4, points: uPts },
          communityService: { count: commCount, each: 4, points: cPts },
          teachingQuality: { avg: Number(avg.toFixed(2)), band: tq.band, points: tq.pts },
        } as any,
      },
    })

    // Behavior ratings (optional example)
    await prisma.behaviorRating.createMany({
      data: [
        { evaluationId: evaluation.id, capacity: "Institutional Commitment", band: "EXCEEDS", points: 16 },
        { evaluationId: evaluation.id, capacity: "Collaboration", band: "FULLY_MEETS", points: 12 },
        { evaluationId: evaluation.id, capacity: "Professionalism", band: "EXCEEDS", points: 16 },
        { evaluationId: evaluation.id, capacity: "Client Service", band: "HIGHLY_EXCEEDS", points: 20 },
      ],
      skipDuplicates: true,
    })

    // Update Appraisal aggregates
    await prisma.appraisal.update({
      where: { id: appraisalId },
      data: {
        researchScore: rPtsCalc,
        universityServiceScore: uPts,
        communityServiceScore: cPts,
        teachingQualityScore: tq.pts,
        totalScore: total,
      },
    })
    return evaluation
  }

  // HOD → Faculty (department CS)
  const eAlice = await finalizeEvaluation(appAlice.id, "HOD")
  const eBob   = await finalizeEvaluation(appBob.id, "HOD")
  // Dean → HOD (hodCS appraisal)
  const eHodCS = await finalizeEvaluation(appHodCS.id, "DEAN")

  // حالات سير العمل متنوعة:
  // - Alice: sent (بانتظار موافقة/تظلّم)
  await prisma.appraisal.update({
    where: { id: appAlice.id },
    data: { status: "sent", hodReviewedAt: new Date("2025-01-25") },
  })
  // - Bob: complete (وافق)
  await prisma.appraisal.update({
    where: { id: appBob.id },
    data: { status: "complete", hodReviewedAt: new Date("2025-01-26") },
  })
  await prisma.signature.create({
    data: {
      appraisalId: appBob.id,
      signerId: fBob.id,
      signerRole: "INSTRUCTOR",
      signedAt: new Date("2025-01-27"),
      note: "Approved by faculty",
    },
  })
  // - Eve: returned (تظلّم)
  await prisma.appraisal.update({
    where: { id: appEve.id },
    data: { status: "returned", hodReviewedAt: new Date("2025-01-24") },
  })
  await prisma.appeal.create({
    data: {
      appraisalId: appEve.id,
      byUserId: fEve.id,
      message: "I believe my research items were undercounted.",
      createdAt: new Date("2025-01-28"),
    },
  })
  // - HOD CS appraisal: sent من الـDean
  await prisma.appraisal.update({
    where: { id: appHodCS.id },
    data: { status: "sent", deanReviewedAt: new Date("2025-01-26") },
  })

  console.log("✅ Seed done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
