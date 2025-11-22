import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AllAchievementsScreen from './screen'


export default async function AllAchievementsPage(){
const session = await getServerSession(authOptions)
const user = session?.user as any
if (!user) redirect('/login')


const appraisals = await prisma.appraisal.findMany({
where: { facultyId: parseInt(user.id) },
include: { cycle: true },
orderBy: { id: 'desc' },
})


const cycles = appraisals.map(a => ({
 id: a.id,
 label: `${a.cycle?.academicYear ?? ''}`.trim() || String(a.id),
 status: a.status,
}))


return (
<div className="p-6 space-y-6">
<h1 className="text-xl font-semibold">My Achievements (All Cycles)</h1>
<AllAchievementsScreen cycles={cycles} />
</div>
)
}




// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Search, Filter, Copy, Eye, Award, BookOpen, Microscope, Users, Briefcase, Heart, FileText } from "lucide-react"
// import Link from "next/link"

// interface HistoricalAchievement {
//   id: string
//   type: string
//   title: string
//   academicYear: string
//   semester: string
//   appraisalId: string
//   appraisalStatus: string
//   // Additional fields based on type
//   [key: string]: any
// }

// export default function HistoricalAchievementsPage() {
//   const [achievements, setAchievements] = useState<HistoricalAchievement[]>([])
//   const [filteredAchievements, setFilteredAchievements] = useState<HistoricalAchievement[]>([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState("")
//   const [cycleFilter, setCycleFilter] = useState("all")
//   const [typeFilter, setTypeFilter] = useState("all")

//   useEffect(() => {
//     fetchAchievements()
//   }, [])

//   useEffect(() => {
//     filterAchievements()
//   }, [achievements, searchTerm, cycleFilter, typeFilter])

//   const fetchAchievements = async () => {
//     try {
//       // This would fetch all achievements across all cycles for the current user
//       // For now, using placeholder data
//       const mockData: HistoricalAchievement[] = [
//         {
//           id: "1",
//           type: "award",
//           title: "Best Research Paper Award",
//           academicYear: "2023/2024",
//           semester: "First",
//           appraisalId: "appraisal-1",
//           appraisalStatus: "COMPLETE",
//           generatedArea: "Computer Science",
//           generatingOrganization: "IEEE",
//           dateObtained: "2024-03-15"
//         },
//         {
//           id: "2",
//           type: "course",
//           title: "Advanced Algorithms",
//           academicYear: "2023/2024",
//           semester: "Second",
//           appraisalId: "appraisal-1",
//           appraisalStatus: "COMPLETE",
//           courseCredit: 3,
//           studentsCount: 45
//         }
//       ]
//       setAchievements(mockData)
//     } catch (error) {
//       console.error("Error fetching achievements:", error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const filterAchievements = () => {
//     let filtered = achievements

//     if (searchTerm) {
//       filtered = filtered.filter(
//         (achievement) =>
//           achievement.title.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     }

//     if (cycleFilter !== "all") {
//       filtered = filtered.filter((achievement) => `${achievement.academicYear}-${achievement.semester}` === cycleFilter)
//     }

//     if (typeFilter !== "all") {
//       filtered = filtered.filter((achievement) => achievement.type === typeFilter)
//     }

//     setFilteredAchievements(filtered)
//   }

//   const getTypeIcon = (type: string) => {
//     switch (type) {
//       case "award": return <Award className="h-4 w-4" />
//       case "course": return <BookOpen className="h-4 w-4" />
//       case "research-published":
//       case "research-article": return <Microscope className="h-4 w-4" />
//       case "scientific": return <Users className="h-4 w-4" />
//       case "university-service": return <Briefcase className="h-4 w-4" />
//       case "community-service": return <Heart className="h-4 w-4" />
//       default: return <FileText className="h-4 w-4" />
//     }
//   }

//   const getTypeLabel = (type: string) => {
//     switch (type) {
//       case "award": return "Award"
//       case "course": return "Course"
//       case "research-published": return "Research (Published)"
//       case "research-article": return "Research (Article)"
//       case "scientific": return "Scientific Activity"
//       case "university-service": return "University Service"
//       case "community-service": return "Community Service"
//       default: return type
//     }
//   }

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "COMPLETE": return "bg-green-100 text-green-800"
//       case "SCORES_SENT": return "bg-orange-100 text-orange-800"
//       case "IN_REVIEW": return "bg-yellow-100 text-yellow-800"
//       case "NEW": return "bg-blue-100 text-blue-800"
//       case "RETURNED": return "bg-red-100 text-red-800"
//       default: return "bg-gray-100 text-gray-800"
//     }
//   }

//   const handleDuplicate = (achievement: HistoricalAchievement) => {
//     // Logic to duplicate achievement to current cycle
//     alert(`Duplicating ${achievement.title} to current cycle`)
//   }

//   const cycles = [...new Set(achievements.map(a => `${a.academicYear}-${a.semester}`))].sort().reverse()
//   const types = [...new Set(achievements.map(a => a.type))].sort()

//   if (isLoading) {
//     return <div className="p-6">Loading achievements...</div>
//   }

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-foreground">My Achievements</h1>
//           <p className="text-muted-foreground">View and manage your achievements across all appraisal cycles</p>
//         </div>
//         <Link href="/faculty/appraisal/achievements">
//           <Button className="bg-accent text-accent-foreground">
//             Update Current Cycle
//           </Button>
//         </Link>
//       </div>

//       {/* Filters */}
//       <Card className="bg-card">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Filter className="h-5 w-5" />
//             Filters
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="relative">
//               <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search achievements..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             <Select value={cycleFilter} onValueChange={setCycleFilter}>
//               <SelectTrigger>
//                 <SelectValue placeholder="All cycles" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All cycles</SelectItem>
//                 {cycles.map((cycle) => (
//                   <SelectItem key={cycle} value={cycle}>
//                     {cycle.replace("-", " - ")}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             <Select value={typeFilter} onValueChange={setTypeFilter}>
//               <SelectTrigger>
//                 <SelectValue placeholder="All types" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All types</SelectItem>
//                 {types.map((type) => (
//                   <SelectItem key={type} value={type}>
//                     {getTypeLabel(type)}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setSearchTerm("")
//                 setCycleFilter("all")
//                 setTypeFilter("all")
//               }}
//             >
//               Clear Filters
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Achievements Table */}
//       <Card className="bg-card">
//         <CardHeader>
//           <CardTitle>All Achievements</CardTitle>
//           <CardDescription>
//             {filteredAchievements.length} of {achievements.length} achievements
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Type</TableHead>
//                 <TableHead>Title</TableHead>
//                 <TableHead>Cycle</TableHead>
//                 <TableHead>Appraisal Status</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredAchievements.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={5} className="text-center text-muted-foreground">
//                     No achievements found matching your filters
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 filteredAchievements.map((achievement) => (
//                   <TableRow key={achievement.id}>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         {getTypeIcon(achievement.type)}
//                         <span className="text-sm">{getTypeLabel(achievement.type)}</span>
//                       </div>
//                     </TableCell>
//                     <TableCell className="font-medium">{achievement.title}</TableCell>
//                     <TableCell>
//                       {achievement.academicYear} - {achievement.semester}
//                     </TableCell>
//                     <TableCell>
//                       <Badge className={getStatusColor(achievement.appraisalStatus)}>
//                         {achievement.appraisalStatus}
//                       </Badge>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex gap-2">
//                         <Button variant="outline" size="sm">
//                           <Eye className="h-4 w-4 mr-1" />
//                           View
//                         </Button>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleDuplicate(achievement)}
//                         >
//                           <Copy className="h-4 w-4 mr-1" />
//                           Duplicate
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {/* Statistics */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card className="bg-card">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-2">
//               <Award className="h-5 w-5 text-chart-1" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Total Achievements</p>
//                 <p className="text-2xl font-bold text-card-foreground">{achievements.length}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card className="bg-card">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-2">
//               <BookOpen className="h-5 w-5 text-chart-2" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Courses Taught</p>
//                 <p className="text-2xl font-bold text-card-foreground">
//                   {achievements.filter(a => a.type === "course").length}
//                 </p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card className="bg-card">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-2">
//               <Microscope className="h-5 w-5 text-chart-3" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Research Items</p>
//                 <p className="text-2xl font-bold text-card-foreground">
//                   {achievements.filter(a => a.type.includes("research")).length}
//                 </p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card className="bg-card">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-2">
//               <Briefcase className="h-5 w-5 text-chart-4" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Service Activities</p>
//                 <p className="text-2xl font-bold text-card-foreground">
//                   {achievements.filter(a => a.type.includes("service")).length}
//                 </p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }
