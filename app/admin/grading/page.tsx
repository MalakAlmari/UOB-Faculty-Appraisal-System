"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Settings, Save, Eye } from "lucide-react"

interface GradingConfig {
  id: number
  scope: string
  cycleId: number | null
  researchWeight: number
  universityServiceWeight: number
  communityServiceWeight: number
  teachingQualityWeight: number
  servicePointsPerItem: number
  serviceMaxPoints: number
  teachingBands: any[]
  researchMap: any
}

interface AppraisalCycle {
  id: number
  academicYear: string
  semester: string
}

export default function GradingPage() {
  const [config, setConfig] = useState<GradingConfig | null>(null)
  const [cycles, setCycles] = useState<AppraisalCycle[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("GLOBAL")
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [configRes, cyclesRes] = await Promise.all([
        fetch("/api/admin/grading"),
        fetch("/api/admin/appraisal-cycles")
      ])

      if (configRes.ok) {
        const configData = await configRes.json()
        setConfig(configData)
      }

      if (cyclesRes.ok) {
        const cyclesData = await cyclesRes.json()
        setCycles(cyclesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSave = async () => {
    // TODO: Implement save functionality
    alert("Save functionality not implemented yet")
  }

  const handlePreview = () => {
    // TODO: Implement preview functionality
    alert("Preview functionality not implemented yet")
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Grading Configuration</h1>
          <p className="text-muted-foreground">Define scoring rules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview Calculation
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button>
            Publish
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scope</CardTitle>
          <CardDescription>Choose global defaults or per-cycle override</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GLOBAL">Global Defaults</SelectItem>
              {cycles.map(cycle => (
                <SelectItem key={cycle.id} value={cycle.id.toString()}>
                  {cycle.academicYear} - {cycle.semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="weights" className="w-full">
        <TabsList>
          <TabsTrigger value="weights">Weights & Caps</TabsTrigger>
          <TabsTrigger value="bands">Teaching Bands</TabsTrigger>
          <TabsTrigger value="research">Research Map</TabsTrigger>
        </TabsList>

        <TabsContent value="weights">
          <Card>
            <CardHeader>
              <CardTitle>Weights & Caps</CardTitle>
              <CardDescription>Configure scoring weights and service points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="researchWeight">Research Weight (0-100)</Label>
                  <Input
                    id="researchWeight"
                    type="number"
                    min="0"
                    max="100"
                    value={config?.researchWeight || 30}
                    onChange={(e) => setConfig(prev => prev ? {...prev, researchWeight: parseInt(e.target.value)} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="universityServiceWeight">University Service Weight (0-100)</Label>
                  <Input
                    id="universityServiceWeight"
                    type="number"
                    min="0"
                    max="100"
                    value={config?.universityServiceWeight || 20}
                    onChange={(e) => setConfig(prev => prev ? {...prev, universityServiceWeight: parseInt(e.target.value)} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="communityServiceWeight">Community Service Weight (0-100)</Label>
                  <Input
                    id="communityServiceWeight"
                    type="number"
                    min="0"
                    max="100"
                    value={config?.communityServiceWeight || 20}
                    onChange={(e) => setConfig(prev => prev ? {...prev, communityServiceWeight: parseInt(e.target.value)} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="teachingQualityWeight">Teaching Quality Weight (0-100)</Label>
                  <Input
                    id="teachingQualityWeight"
                    type="number"
                    min="0"
                    max="100"
                    value={config?.teachingQualityWeight || 30}
                    onChange={(e) => setConfig(prev => prev ? {...prev, teachingQualityWeight: parseInt(e.target.value)} : null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="servicePointsPerItem">Service Points Per Item</Label>
                  <Input
                    id="servicePointsPerItem"
                    type="number"
                    min="0"
                    value={config?.servicePointsPerItem || 4}
                    onChange={(e) => setConfig(prev => prev ? {...prev, servicePointsPerItem: parseInt(e.target.value)} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="serviceMaxPoints">Service Max Points</Label>
                  <Input
                    id="serviceMaxPoints"
                    type="number"
                    min="0"
                    value={config?.serviceMaxPoints || 20}
                    onChange={(e) => setConfig(prev => prev ? {...prev, serviceMaxPoints: parseInt(e.target.value)} : null)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bands">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Bands</CardTitle>
              <CardDescription>Define points for teaching evaluation bands</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Min Average</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Band Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* TODO: Implement dynamic bands */}
                  <TableRow>
                    <TableCell>90</TableCell>
                    <TableCell>30</TableCell>
                    <TableCell>Excellent</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>80</TableCell>
                    <TableCell>24</TableCell>
                    <TableCell>Good</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>70</TableCell>
                    <TableCell>18</TableCell>
                    <TableCell>Satisfactory</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research">
          <Card>
            <CardHeader>
              <CardTitle>Research Map</CardTitle>
              <CardDescription>Define points for research activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity Type</TableHead>
                    <TableHead>Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* TODO: Implement dynamic research map */}
                  <TableRow>
                    <TableCell>Published Paper</TableCell>
                    <TableCell>10</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Accepted Paper</TableCell>
                    <TableCell>8</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Refereed Paper</TableCell>
                    <TableCell>6</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}