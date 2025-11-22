-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'DEAN', 'HOD', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."Semester" AS ENUM ('FALL', 'SPRING', 'SUMMER');

-- CreateEnum
CREATE TYPE "public"."EvaluationStatus" AS ENUM ('new', 'sent', 'complete', 'returned');

-- CreateEnum
CREATE TYPE "public"."EvaluationRole" AS ENUM ('HOD', 'DEAN');

-- CreateEnum
CREATE TYPE "public"."Pillar" AS ENUM ('RESEARCH', 'UNIVERSITY_SERVICE', 'COMMUNITY_SERVICE', 'TEACHING_QUALITY');

-- CreateEnum
CREATE TYPE "public"."RatingBand" AS ENUM ('HIGHLY_EXCEEDS', 'EXCEEDS', 'FULLY_MEETS', 'PARTIALLY_MEETS', 'NEEDS_IMPROVEMENT');

-- CreateEnum
CREATE TYPE "public"."ResearchKind" AS ENUM ('ACCEPTED', 'PUBLISHED', 'IN_PROCESS', 'ARBITRATION', 'THESIS_SUPERVISION', 'FUNDED_PROJECT', 'CONTRACTUAL_RESEARCH', 'REGISTERED_PATENT', 'REFEREED_PAPER', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ResearchActivityType" AS ENUM ('JOURNAL', 'CONFERENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ScientificType" AS ENUM ('CONFERENCE', 'SEMINAR', 'WORKSHOP', 'TRAINING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ScientificParticipation" AS ENUM ('MODERATOR', 'COORDINATOR', 'PRESENTER', 'PARTICIPANT', 'PAPER', 'OTHER');

-- CreateTable
CREATE TABLE "public"."College" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "collegeId" INTEGER NOT NULL,
    "hodUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'INSTRUCTOR',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "passwordHash" TEXT,
    "departmentId" INTEGER,
    "collegeId" INTEGER,
    "idNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "academicRank" TEXT,
    "nationality" TEXT,
    "generalSpecialization" TEXT,
    "specificSpecialization" TEXT,
    "dateOfEmployment" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AppraisalCycle" (
    "id" SERIAL NOT NULL,
    "academicYear" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppraisalCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appraisal" (
    "id" SERIAL NOT NULL,
    "facultyId" INTEGER NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "status" "public"."EvaluationStatus" NOT NULL DEFAULT 'new',
    "researchScore" DOUBLE PRECISION,
    "universityServiceScore" DOUBLE PRECISION,
    "communityServiceScore" DOUBLE PRECISION,
    "teachingQualityScore" DOUBLE PRECISION,
    "totalScore" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3),
    "hodReviewedAt" TIMESTAMP(3),
    "deanReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evaluation" (
    "id" SERIAL NOT NULL,
    "appraisalId" INTEGER NOT NULL,
    "role" "public"."EvaluationRole" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "researchPts" DOUBLE PRECISION,
    "researchBand" "public"."RatingBand",
    "researchExplanation" TEXT,
    "universityServicePts" DOUBLE PRECISION,
    "universityServiceBand" "public"."RatingBand",
    "universityServiceExplanation" TEXT,
    "communityServicePts" DOUBLE PRECISION,
    "communityServiceBand" "public"."RatingBand",
    "communityServiceExplanation" TEXT,
    "teachingQualityPts" DOUBLE PRECISION,
    "teachingQualityBand" "public"."RatingBand",
    "teachingQualityExplanation" TEXT,
    "capabilitiesPts" DOUBLE PRECISION,
    "capabilitiesBand" "public"."RatingBand",
    "capabilitiesExplanation" TEXT,
    "totalScore" DOUBLE PRECISION,
    "rubric" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BehaviorRating" (
    "id" SERIAL NOT NULL,
    "evaluationId" INTEGER NOT NULL,
    "capacity" TEXT NOT NULL,
    "band" "public"."RatingBand" NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "BehaviorRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Award" (
    "id" SERIAL NOT NULL,
    "appraisalId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT,
    "organization" TEXT,
    "dateObtained" TIMESTAMP(3),
    "attachment" TEXT,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseTaught" (
    "id" SERIAL NOT NULL,
    "appraisalId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" "public"."Semester" NOT NULL,
    "courseCode" TEXT,
    "section" TEXT,
    "courseTitle" TEXT NOT NULL,
    "credit" DOUBLE PRECISION,
    "studentsCount" INTEGER,
    "studentsEvalAvg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseTaught_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResearchActivity" (
    "id" SERIAL NOT NULL,
    "appraisalId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "public"."ResearchActivityType" NOT NULL,
    "kind" "public"."ResearchKind" NOT NULL,
    "journalOrPublisher" TEXT,
    "participation" TEXT,
    "publicationDate" TIMESTAMP(3),
    "refereedArticleRef" TEXT,
    "refereeDecisionDate" TIMESTAMP(3),
    "attachment" TEXT,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScientificActivity" (
    "id" SERIAL NOT NULL,
    "appraisalId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "public"."ScientificType" NOT NULL,
    "date" TIMESTAMP(3),
    "participation" "public"."ScientificParticipation",
    "organizingAuth" TEXT,
    "venue" TEXT,
    "attachment" TEXT,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScientificActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UniversityService" (
    "id" SERIAL NOT NULL,
    "appraisalId" INTEGER NOT NULL,
    "committeeOrTask" TEXT NOT NULL,
    "authority" TEXT,
    "participation" TEXT,
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "attachment" TEXT,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversityService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommunityService" (
    "id" SERIAL NOT NULL,
    "appraisalId" INTEGER NOT NULL,
    "committeeOrTask" TEXT NOT NULL,
    "authority" TEXT,
    "participation" TEXT,
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "attachment" TEXT,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evidence" (
    "id" SERIAL NOT NULL,
    "appraisalId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "fileKey" TEXT,
    "points" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appeal" (
    "id" SERIAL NOT NULL,
    "appraisalId" INTEGER NOT NULL,
    "byUserId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Signature" (
    "id" SERIAL NOT NULL,
    "appraisalId" INTEGER NOT NULL,
    "signerId" INTEGER,
    "signerRole" "public"."UserRole" NOT NULL,
    "signedAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradingConfig" (
    "id" SERIAL NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "cycleId" INTEGER,
    "researchWeight" INTEGER NOT NULL DEFAULT 30,
    "universityServiceWeight" INTEGER NOT NULL DEFAULT 20,
    "communityServiceWeight" INTEGER NOT NULL DEFAULT 20,
    "teachingQualityWeight" INTEGER NOT NULL DEFAULT 30,
    "servicePointsPerItem" INTEGER NOT NULL DEFAULT 4,
    "serviceMaxPoints" INTEGER NOT NULL DEFAULT 20,
    "teachingBands" JSONB NOT NULL,
    "researchMap" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "College_name_key" ON "public"."College"("name");

-- CreateIndex
CREATE UNIQUE INDEX "College_code_key" ON "public"."College"("code");

-- CreateIndex
CREATE INDEX "Department_collegeId_idx" ON "public"."Department"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_departmentId_idx" ON "public"."User"("role", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AppraisalCycle_academicYear_key" ON "public"."AppraisalCycle"("academicYear");

-- CreateIndex
CREATE INDEX "by_faculty_cycle" ON "public"."Appraisal"("facultyId", "cycleId");

-- CreateIndex
CREATE INDEX "Appraisal_status_idx" ON "public"."Appraisal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_appraisalId_role_key" ON "public"."Evaluation"("appraisalId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "BehaviorRating_evaluationId_capacity_key" ON "public"."BehaviorRating"("evaluationId", "capacity");

-- CreateIndex
CREATE INDEX "Award_appraisalId_idx" ON "public"."Award"("appraisalId");

-- CreateIndex
CREATE INDEX "CourseTaught_appraisalId_semester_idx" ON "public"."CourseTaught"("appraisalId", "semester");

-- CreateIndex
CREATE INDEX "ResearchActivity_appraisalId_kind_idx" ON "public"."ResearchActivity"("appraisalId", "kind");

-- CreateIndex
CREATE INDEX "ScientificActivity_appraisalId_type_idx" ON "public"."ScientificActivity"("appraisalId", "type");

-- CreateIndex
CREATE INDEX "UniversityService_appraisalId_dateFrom_dateTo_idx" ON "public"."UniversityService"("appraisalId", "dateFrom", "dateTo");

-- CreateIndex
CREATE INDEX "CommunityService_appraisalId_dateFrom_dateTo_idx" ON "public"."CommunityService"("appraisalId", "dateFrom", "dateTo");

-- AddForeignKey
ALTER TABLE "public"."Department" ADD CONSTRAINT "Department_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "public"."College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "public"."College"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appraisal" ADD CONSTRAINT "Appraisal_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appraisal" ADD CONSTRAINT "Appraisal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "public"."AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evaluation" ADD CONSTRAINT "Evaluation_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "public"."Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BehaviorRating" ADD CONSTRAINT "BehaviorRating_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "public"."Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Award" ADD CONSTRAINT "Award_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "public"."Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseTaught" ADD CONSTRAINT "CourseTaught_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "public"."Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResearchActivity" ADD CONSTRAINT "ResearchActivity_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "public"."Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScientificActivity" ADD CONSTRAINT "ScientificActivity_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "public"."Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UniversityService" ADD CONSTRAINT "UniversityService_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "public"."Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityService" ADD CONSTRAINT "CommunityService_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "public"."Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "public"."Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appeal" ADD CONSTRAINT "Appeal_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "public"."Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Signature" ADD CONSTRAINT "Signature_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "public"."Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradingConfig" ADD CONSTRAINT "GradingConfig_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "public"."AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
