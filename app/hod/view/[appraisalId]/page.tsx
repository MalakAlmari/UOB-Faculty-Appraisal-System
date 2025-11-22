'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  Building2,
  GraduationCap,
  Calendar,
  Clock,
  Award,
  BookOpen,
  Microscope,
  Users,
  FileText,
  Download,
  Eye,
  Trophy,
  Briefcase,
  Heart
} from 'lucide-react'
import { format } from 'date-fns'

interface AppraisalDetails {
  id: number
  status: string
  totalScore: number | null
  submittedAt: string | null
  hodReviewedAt: string | null
  deanReviewedAt: string | null
  createdAt: string
  updatedAt: string
  faculty: {
    id: number
    name: string
    email: string
    role: string
    academicRank: string | null
    department: {
      name: string
      college: {
        name: string
      }
    }
  }
  cycle: {
    academicYear: string
    semester: string
  }
  evaluations: Array<{
    id: number
    role: string
    totalScore: number | null
    notes: string | null
    researchPts: number | null
    universityServicePts: number | null
    communityServicePts: number | null
    teachingQualityPts: number | null
    researchBand: string | null
    universityServiceBand: string | null
    communityServiceBand: string | null
    teachingQualityBand: string | null
    researchExplanation: string | null
    universityServiceExplanation: string | null
    communityServiceExplanation: string | null
    teachingQualityExplanation: string | null
  }>
  awards: Array<{
    id: number
    name: string
    area: string | null
    organization: string | null
    dateObtained: string | null
    fileUrl: string | null
  }>
  courses: Array<{
    id: number
    courseTitle: string
    courseCode: string | null
    section: string | null
    academicYear: string
    semester: string
    credit: number | null
    studentsCount: number | null
    studentsEvalAvg: number | null
  }>
  researchActivities: Array<{
    id: number
    title: string
    kind: string
    journalOrPublisher: string | null
    participation: string | null
    publicationDate: string | null
    fileUrl: string | null
  }>
  scientificActivities: Array<{
    id: number
    title: string
    type: string
    date: string | null
    participation: string | null
    organizingAuth: string | null
    venue: string | null
    fileUrl: string | null
  }>
  universityServices: Array<{
    id: number
    committeeOrTask: string
    authority: string | null
    participation: string | null
    dateFrom: string | null
    dateTo: string | null
    fileUrl: string | null
  }>
  communityServices: Array<{
    id: number
    committeeOrTask: string
    authority: string | null
    participation: string | null
    dateFrom: string | null
    dateTo: string | null
    fileUrl: string | null
  }>
}

export default function AppraisalDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<AppraisalDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAppraisalDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/appraisals/${params.appraisalId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch appraisal details')
        }
        const appraisalData = await response.json()
        setData(appraisalData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (params.appraisalId) {
      fetchAppraisalDetails()
    }
  }, [params.appraisalId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'sent': return 'bg-yellow-100 text-yellow-800'
      case 'complete': return 'bg-green-100 text-green-800'
      case 'returned': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBandColor = (band: string | null) => {
    if (!band) return 'bg-gray-100 text-gray-800'
    switch (band) {
      case 'HIGHLY_EXCEEDS': return 'bg-green-600 text-white'
      case 'EXCEEDS': return 'bg-green-500 text-white'
      case 'FULLY_MEETS': return 'bg-yellow-500 text-white'
      case 'PARTIALLY_MEETS': return 'bg-orange-500 text-white'
      case 'NEEDS_IMPROVEMENT': return 'bg-red-500 text-white'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Appraisal not found'}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Appraisals
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Appraisal Details
            </h1>
            <p className="text-gray-600 mt-1">
              View comprehensive appraisal information and achievements
            </p>
          </div>
          <Badge className={getStatusColor(data.status)}>
            {data.status.toUpperCase()}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Faculty Name</label>
                  <p className="text-lg font-semibold">{data.faculty.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-lg">{data.faculty.department.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">College</label>
                  <p className="text-lg">{data.faculty.department.college.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Academic Rank</label>
                  <p className="text-lg">{data.faculty.academicRank || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Academic Year</label>
                  <p className="text-lg">{data.cycle.academicYear}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Semester</label>
                  <p className="text-lg capitalize">{data.cycle.semester}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Status</label>
                  <Badge className={getStatusColor(data.status)}>
                    {data.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Score</label>
                  <p className="text-lg font-semibold">
                    {data.totalScore ? `${data.totalScore.toFixed(2)}%` : 'Not calculated'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-lg">{format(new Date(data.createdAt), 'PPP')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-lg">{format(new Date(data.updatedAt), 'PPP')}</p>
                </div>
                {data.submittedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted Date</label>
                    <p className="text-lg">{format(new Date(data.submittedAt), 'PPP')}</p>
                  </div>
                )}
                {data.hodReviewedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">HOD Review Date</label>
                    <p className="text-lg">{format(new Date(data.hodReviewedAt), 'PPP')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            {/* Awards */}
            {data.awards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Awards & Recognition ({data.awards.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.awards.map((award) => (
                    <div key={award.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{award.name}</h4>
                        {award.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={award.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              View File
                            </a>
                          </Button>
                        )}
                      </div>
                      {award.area && <p className="text-sm text-gray-600">Area: {award.area}</p>}
                      {award.organization && <p className="text-sm text-gray-600">Organization: {award.organization}</p>}
                      {award.dateObtained && (
                        <p className="text-sm text-gray-600">
                          Date: {format(new Date(award.dateObtained), 'PPP')}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Courses Taught */}
            {data.courses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Courses Taught ({data.courses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.courses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{course.courseTitle}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {course.courseCode && <p className="text-sm text-gray-600">Code: {course.courseCode}</p>}
                        {course.section && <p className="text-sm text-gray-600">Section: {course.section}</p>}
                        <p className="text-sm text-gray-600">Year: {course.academicYear}</p>
                        <p className="text-sm text-gray-600 capitalize">Semester: {course.semester}</p>
                        {course.credit && <p className="text-sm text-gray-600">Credits: {course.credit}</p>}
                        {course.studentsCount && <p className="text-sm text-gray-600">Students: {course.studentsCount}</p>}
                        {course.studentsEvalAvg && (
                          <p className="text-sm text-gray-600">Avg Evaluation: {course.studentsEvalAvg.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Research Activities */}
            {data.researchActivities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Microscope className="h-5 w-5" />
                    Research Activities ({data.researchActivities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.researchActivities.map((research) => (
                    <div key={research.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{research.title}</h4>
                        {research.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={research.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              View File
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <Badge variant="outline">{research.kind}</Badge>
                        {research.journalOrPublisher && (
                          <p className="text-sm text-gray-600">Published in: {research.journalOrPublisher}</p>
                        )}
                        {research.participation && (
                          <p className="text-sm text-gray-600">Participation: {research.participation}</p>
                        )}
                        {research.publicationDate && (
                          <p className="text-sm text-gray-600">
                            Date: {format(new Date(research.publicationDate), 'PPP')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Scientific Activities */}
            {data.scientificActivities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Scientific Activities ({data.scientificActivities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.scientificActivities.map((activity) => (
                    <div key={activity.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{activity.title}</h4>
                        {activity.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={activity.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              View File
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <Badge variant="outline">{activity.type}</Badge>
                        {activity.participation && (
                          <p className="text-sm text-gray-600">Participation: {activity.participation}</p>
                        )}
                        {activity.organizingAuth && (
                          <p className="text-sm text-gray-600">Organizer: {activity.organizingAuth}</p>
                        )}
                        {activity.venue && <p className="text-sm text-gray-600">Venue: {activity.venue}</p>}
                        {activity.date && (
                          <p className="text-sm text-gray-600">
                            Date: {format(new Date(activity.date), 'PPP')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* University Services */}
            {data.universityServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    University Services ({data.universityServices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.universityServices.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{service.committeeOrTask}</h4>
                        {service.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={service.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              View File
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {service.authority && <p className="text-sm text-gray-600">Authority: {service.authority}</p>}
                        {service.participation && (
                          <p className="text-sm text-gray-600">Participation: {service.participation}</p>
                        )}
                        {service.dateFrom && (
                          <p className="text-sm text-gray-600">
                            From: {format(new Date(service.dateFrom), 'PPP')}
                          </p>
                        )}
                        {service.dateTo && (
                          <p className="text-sm text-gray-600">
                            To: {format(new Date(service.dateTo), 'PPP')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Community Services */}
            {data.communityServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Community Services ({data.communityServices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.communityServices.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{service.committeeOrTask}</h4>
                        {service.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={service.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              View File
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {service.authority && <p className="text-sm text-gray-600">Authority: {service.authority}</p>}
                        {service.participation && (
                          <p className="text-sm text-gray-600">Participation: {service.participation}</p>
                        )}
                        {service.dateFrom && (
                          <p className="text-sm text-gray-600">
                            From: {format(new Date(service.dateFrom), 'PPP')}
                          </p>
                        )}
                        {service.dateTo && (
                          <p className="text-sm text-gray-600">
                            To: {format(new Date(service.dateTo), 'PPP')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {data.awards.length === 0 && data.courses.length === 0 &&
             data.researchActivities.length === 0 && data.scientificActivities.length === 0 &&
             data.universityServices.length === 0 && data.communityServices.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No achievements recorded for this appraisal period.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations" className="space-y-6">
            {data.evaluations.length > 0 ? (
              data.evaluations.map((evaluation) => (
                <Card key={evaluation.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {evaluation.role} Evaluation
                      </span>
                      {evaluation.totalScore && (
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {evaluation.totalScore.toFixed(2)}%
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Score Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Research</label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-lg">
                            {evaluation.researchPts ? `${evaluation.researchPts.toFixed(2)} pts` : 'Not scored'}
                          </p>
                          {evaluation.researchBand && (
                            <Badge className={getBandColor(evaluation.researchBand)}>
                              {evaluation.researchBand.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        {evaluation.researchExplanation && (
                          <p className="text-sm text-gray-600 mt-1">{evaluation.researchExplanation}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">University Service</label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-lg">
                            {evaluation.universityServicePts ? `${evaluation.universityServicePts.toFixed(2)} pts` : 'Not scored'}
                          </p>
                          {evaluation.universityServiceBand && (
                            <Badge className={getBandColor(evaluation.universityServiceBand)}>
                              {evaluation.universityServiceBand.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        {evaluation.universityServiceExplanation && (
                          <p className="text-sm text-gray-600 mt-1">{evaluation.universityServiceExplanation}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Community Service</label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-lg">
                            {evaluation.communityServicePts ? `${evaluation.communityServicePts.toFixed(2)} pts` : 'Not scored'}
                          </p>
                          {evaluation.communityServiceBand && (
                            <Badge className={getBandColor(evaluation.communityServiceBand)}>
                              {evaluation.communityServiceBand.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        {evaluation.communityServiceExplanation && (
                          <p className="text-sm text-gray-600 mt-1">{evaluation.communityServiceExplanation}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Teaching Quality</label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-lg">
                            {evaluation.teachingQualityPts ? `${evaluation.teachingQualityPts.toFixed(2)} pts` : 'Not scored'}
                          </p>
                          {evaluation.teachingQualityBand && (
                            <Badge className={getBandColor(evaluation.teachingQualityBand)}>
                              {evaluation.teachingQualityBand.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        {evaluation.teachingQualityExplanation && (
                          <p className="text-sm text-gray-600 mt-1">{evaluation.teachingQualityExplanation}</p>
                        )}
                      </div>
                    </div>

                    {evaluation.notes && (
                      <>
                        <Separator />
                        <div>
                          <label className="text-sm font-medium text-gray-500">Additional Notes</label>
                          <p className="text-sm text-gray-700 mt-1">{evaluation.notes}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No evaluations have been completed yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  General Comments & Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.evaluations.some(e => e.notes) ? (
                  <div className="space-y-4">
                    {data.evaluations.map((evaluation) => (
                      evaluation.notes && (
                        <div key={evaluation.id} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{evaluation.role}</Badge>
                            <span className="text-sm text-gray-500">
                              {format(new Date(data.updatedAt), 'PPP')}
                            </span>
                          </div>
                          <p className="text-gray-700">{evaluation.notes}</p>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No comments or feedback available.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}