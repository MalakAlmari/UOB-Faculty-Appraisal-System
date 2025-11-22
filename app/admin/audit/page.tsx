"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Shield, Download, Search, Calendar } from "lucide-react"

interface AuditEvent {
  id: number
  timestamp: string
  actor: string
  action: string
  target: string
  metadata: any
  ip?: string
}

export default function AuditPage() {
  const [events] = useState<AuditEvent[]>([
    // Placeholder data
    {
      id: 1,
      timestamp: "2024-01-15T10:30:00Z",
      actor: "admin@example.com",
      action: "USER_CREATE",
      target: "user:john.doe@example.com",
      metadata: { role: "INSTRUCTOR", department: "Computer Science" },
      ip: "192.168.1.100"
    },
    {
      id: 2,
      timestamp: "2024-01-15T11:00:00Z",
      actor: "admin@example.com",
      action: "CYCLE_ACTIVATE",
      target: "cycle:2024/2025-FALL",
      metadata: { previousActive: null },
      ip: "192.168.1.100"
    },
    {
      id: 3,
      timestamp: "2024-01-15T14:20:00Z",
      actor: "hod@example.com",
      action: "EVALUATION_SUBMIT",
      target: "appraisal:123",
      metadata: { totalScore: 85 },
      ip: "192.168.1.101"
    }
  ])

  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [actorFilter, setActorFilter] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [targetFilter, setTargetFilter] = useState("")

  const filteredEvents = events.filter(event => {
    const matchesDateFrom = !dateFrom || new Date(event.timestamp) >= new Date(dateFrom)
    const matchesDateTo = !dateTo || new Date(event.timestamp) <= new Date(dateTo + "T23:59:59")
    const matchesActor = !actorFilter || event.actor.toLowerCase().includes(actorFilter.toLowerCase())
    const matchesAction = actionFilter === "ALL" || !actionFilter || event.action === actionFilter
    const matchesTarget = !targetFilter || event.target.toLowerCase().includes(targetFilter.toLowerCase())

    return matchesDateFrom && matchesDateTo && matchesActor && matchesAction && matchesTarget
  })

  const actionColors = {
    USER_CREATE: "bg-green-100 text-green-800",
    USER_UPDATE: "bg-blue-100 text-blue-800",
    USER_DISABLE: "bg-red-100 text-red-800",
    CYCLE_ACTIVATE: "bg-purple-100 text-purple-800",
    EVALUATION_SUBMIT: "bg-yellow-100 text-yellow-800",
  }

  const handleExport = (format: string) => {
    // TODO: Implement export functionality
    alert(`Export to ${format.toUpperCase()} not implemented yet`)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground">Compliance and troubleshooting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("json")}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Actor</label>
              <Input
                placeholder="Search actor"
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="USER_CREATE">User Create</SelectItem>
                  <SelectItem value="USER_UPDATE">User Update</SelectItem>
                  <SelectItem value="USER_DISABLE">User Disable</SelectItem>
                  <SelectItem value="CYCLE_ACTIVATE">Cycle Activate</SelectItem>
                  <SelectItem value="EVALUATION_SUBMIT">Evaluation Submit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Target</label>
              <Input
                placeholder="Search target"
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Events
          </CardTitle>
          <CardDescription>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Metadata</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{event.actor}</TableCell>
                  <TableCell>
                    <Badge className={actionColors[event.action as keyof typeof actionColors] || "bg-gray-100 text-gray-800"}>
                      {event.action.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.target}</TableCell>
                  <TableCell className="max-w-xs">
                    <pre className="text-xs bg-muted p-1 rounded overflow-hidden">
                      {JSON.stringify(event.metadata, null, 2).substring(0, 100)}...
                    </pre>
                  </TableCell>
                  <TableCell>{event.ip || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}