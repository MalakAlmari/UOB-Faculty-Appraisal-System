'use client'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Copy, Eye, Award, BookOpen, Microscope, Users, Briefcase, Heart, FileText, FolderOpen } from "lucide-react"

const TYPES = [
 { key:'awards', label:'Awards' },
 { key:'courses', label:'Courses Taught' },
 { key:'research_published', label:'Research (Published)' },
 { key:'research_article', label:'Research (Article)' },
 { key:'scientific', label:'Scientific Activities' },
 { key:'university', label:'University Service' },
 { key:'community', label:'Community Service' },
 ]

export default function AllAchievementsScreen({ cycles }:{ cycles: Array<{ id:number; label:string; status:string }> }){
 const [selected, setSelected] = useState<number | null>(cycles[0]?.id ?? null)
 const [type, setType] = useState<string>(TYPES[0].key)
 const [q, setQ] = useState('')
 const [data, setData] = useState<any>(null)
 const [loading, setLoading] = useState(false)

 useEffect(()=>{ if (selected) fetchOne(selected) }, [selected])

 async function fetchOne(appraisalId:number){
   setLoading(true)
   try {
     const res = await fetch(`/api/appraisals/${appraisalId}/achievements-summary`)
     const j = await res.json()
     setData(j)
   } catch (error) {
     console.error('Error fetching achievements:', error)
     setData(null)
   }
   setLoading(false)
 }

 const filtered = useMemo(()=>{
   if (!data) return []
   let rows:any[] = []
   if (type==='awards') rows = data.awards ?? []
   else if (type==='courses') rows = data.courses ?? []
   else if (type==='research_published') rows = (data.research??[]).filter((r:any)=> (r.kind||'').toUpperCase()==='PUBLISHED')
   else if (type==='research_article') rows = (data.research??[]).filter((r:any)=> (r.kind||'').toUpperCase()==='REFEREED_PAPER')
   else if (type==='scientific') rows = data.scientific ?? []
   else if (type==='university') rows = data.university ?? []
   else if (type==='community') rows = data.community ?? []

   if (!q) return rows
   const qq = q.toLowerCase()
   return rows.filter((r:any)=> JSON.stringify(r).toLowerCase().includes(qq))
 }, [data, type, q])

 function duplicateToCurrent(row:any){
   const resource = type.startsWith('research_') ? 'research' : type
   const payload = { ...row }
   // sanitize id & foreign keys for creation
   delete payload.id; delete payload.appraisalId; delete payload.createdAt; delete payload.updatedAt
   if (type==='research_published') {
     payload.kind = 'PUBLISHED'
     payload.type = payload.type || 'JOURNAL' // Default to JOURNAL if not set
   }
   if (type==='research_article') {
     payload.kind = 'REFEREED_PAPER'
     payload.type = payload.type || 'JOURNAL' // Default to JOURNAL if not set
   }

   fetch(`/api/appraisals/current/${resource}`, {
     method:'POST',
     headers:{'Content-Type':'application/json'},
     body: JSON.stringify(payload)
   })
   .then(async(res)=>{
     if (!res.ok) throw new Error('fail')
     alert('Duplicated to current cycle')
     // Refresh current cycle data
     window.location.reload()
   })
   .catch(()=> alert('Failed to duplicate'))
 }

 const getTypeIcon = (achievementType: string) => {
   switch (achievementType) {
     case "awards": return <Award className="h-4 w-4" />
     case "courses": return <BookOpen className="h-4 w-4" />
     case "research_published":
     case "research_article": return <Microscope className="h-4 w-4" />
     case "scientific": return <Users className="h-4 w-4" />
     case "university": return <Briefcase className="h-4 w-4" />
     case "community": return <Heart className="h-4 w-4" />
     default: return <FileText className="h-4 w-4" />
   }
 }

 const link = (url?:string)=> url? <a className="underline text-blue-600" href={url} target="_blank" rel="noopener noreferrer"><FolderOpen size={15} /></a> : '—'

 const current = cycles.find(c=>c.id===selected)

 if (loading) {
   return (
     <Card className="bg-card">
       <CardContent className="p-6">
         <div className="text-center">Loading achievements...</div>
       </CardContent>
     </Card>
   )
 }

 return (
   <div className="space-y-6">
     {/* Controls */}
     <Card className="bg-card">
       <CardHeader>
         <CardTitle>Achievements from Historical Cycles</CardTitle>
         <CardDescription>
           View and duplicate achievements from previous appraisal cycles to your current cycle
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
             <label className="block text-sm font-medium mb-2">Select Cycle</label>
             <Select value={selected?.toString() || ''} onValueChange={(value)=>setSelected(Number(value))}>
               <SelectTrigger>
                 <SelectValue placeholder="Select a cycle" />
               </SelectTrigger>
               <SelectContent>
                 {cycles.map((cycle) => (
                   <SelectItem key={cycle.id} value={cycle.id.toString()}>
                     {cycle.label} ({cycle.status})
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>

           <div>
             <label className="block text-sm font-medium mb-2">Achievement Type</label>
             <Select value={type} onValueChange={setType}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {TYPES.map((t) => (
                   <SelectItem key={t.key} value={t.key}>
                     {t.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>


         </div>

         {current && (
           <div className="p-3 bg-muted rounded-lg">
             <p className="text-sm">
               <strong>Current Cycle:</strong> {current.label} (Status: {current.status})
             </p>
           </div>
         )}
       </CardContent>
     </Card>

     {/* Achievements Table */}
     <Card className="bg-card">
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           {getTypeIcon(type)}
           {TYPES.find(t=>t.key===type)?.label || 'Achievements'}
         </CardTitle>
         <CardDescription>
           {filtered.length} achievements found
         </CardDescription>
       </CardHeader>
       <CardContent>
         {filtered.length === 0 ? (
           <div className="text-center py-8 text-muted-foreground">
             No achievements found for this type and cycle
           </div>
         ) : (
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Title</TableHead>
                 <TableHead>Details</TableHead>
                 <TableHead>Attachment</TableHead>
                 <TableHead>Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filtered.map((row:any) => (
                 <TableRow key={row.id}>
                   <TableCell className="font-medium">
                     {type === 'awards' && row.name}
                     {type === 'courses' && row.courseTitle}
                     {type === 'research_published' && row.title}
                     {type === 'research_article' && row.title}
                     {type === 'scientific' && row.title}
                     {type === 'university' && row.committeeOrTask}
                     {type === 'community' && row.committeeOrTask}
                   </TableCell>
                   <TableCell>
                     {type === 'awards' && (
                       <div className="text-sm">
                         <div>Area: {row.area}</div>
                         <div>Organization: {row.organization}</div>
                         <div>Date: {row.dateObtained ? new Date(row.dateObtained).toLocaleDateString() : '—'}</div>
                       </div>
                     )}
                     {type === 'courses' && (
                       <div className="text-sm">
                         <div>Credit: {row.credit}</div>
                         <div>Students: {row.studentsCount}</div>
                         <div>Avg Eval: {row.studentsEvalAvg || '—'}</div>
                       </div>
                     )}
                     {(type.startsWith('research_')) && (
                       <div className="text-sm">
                         <div>Kind: {row.kind}</div>
                         <div>Journal: {row.journalOrPublisher}</div>
                         <div>Date: {row.publicationDate ? new Date(row.publicationDate).toLocaleDateString() : '—'}</div>
                       </div>
                     )}
                     {type === 'scientific' && (
                       <div className="text-sm">
                         <div>Type: {row.type}</div>
                         <div>Participation: {row.participation}</div>
                         <div>Venue: {row.venue}</div>
                       </div>
                     )}
                     {(type === 'university' || type === 'community') && (
                       <div className="text-sm">
                         <div>Authority: {row.authority}</div>
                         <div>Participation: {row.participation}</div>
                         <div>Period: {row.dateFrom && row.dateTo ?
                           `${new Date(row.dateFrom).toLocaleDateString()} - ${new Date(row.dateTo).toLocaleDateString()}`
                           : '—'}</div>
                       </div>
                     )}
                   </TableCell>
                   <TableCell>
                     {link(row.attachment || row.fileUrl)}
                   </TableCell>
                   <TableCell>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => duplicateToCurrent(row)}
                     >
                       <Copy className="h-4 w-4 mr-1" />
                       Duplicate
                     </Button>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         )}
       </CardContent>
     </Card>
   </div>
 )
}