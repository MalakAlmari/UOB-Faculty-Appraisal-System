'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Plus, Trash2, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'

type PlanRow = {
  id: string
  developmentArea: string
  linkToGoals: string
  activities: string
  expectedResults: string
  timeframe: string
}

type PlanState = {
  rows: PlanRow[]
  biAnnualComments: string
  annualComments: string
  hodSignature?: { name: string; signedAt: string } | null
  deanSignature?: { name: string; signedAt: string } | null
}

const emptyRow = (): PlanRow => ({
  id: crypto.randomUUID(),
  developmentArea: '',
  linkToGoals: '',
  activities: '',
  expectedResults: '',
  timeframe: '',
})

export default function SelfDevelopmentPlanPage() {
  const router = useRouter()
  const { appraisalId } = useParams<{ appraisalId: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [meRole, setMeRole] = useState<'HOD' | 'DEAN' | 'ADMIN' | 'INSTRUCTOR'>('HOD')

  const [plan, setPlan] = useState<PlanState>({
    rows: [emptyRow(), emptyRow()],
    biAnnualComments: '',
    annualComments: '',
    hodSignature: null,
    deanSignature: null,
  })

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setErr(null)
      try {
        const res = await fetch(`/api/appraisals/${appraisalId}/self-development-plan`)
        if (!res.ok) throw new Error(`Failed to load plan: ${res.status}`)
        const data = await res.json()
        if (data.role) setMeRole(data.role)
        if (data.plan) setPlan(data.plan)
      } catch (e: any) {
        setErr(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [appraisalId])

  const addRow = () => setPlan(p => ({ ...p, rows: [...p.rows, emptyRow()] }))
  const removeRow = (id: string) => setPlan(p => ({ ...p, rows: p.rows.filter(r => r.id !== id) }))
  const updateRow = (id: string, patch: Partial<PlanRow>) =>
    setPlan(p => ({ ...p, rows: p.rows.map(r => (r.id === id ? { ...r, ...patch } : r)) }))

  const canSignAsHod = meRole === 'HOD' || meRole === 'ADMIN'
  const canSignAsDean = meRole === 'DEAN' || meRole === 'ADMIN'

  const sign = async (who: 'HOD' | 'DEAN') => {
    const nameRes = await fetch('/api/auth/session')
    const sess = nameRes.ok ? await nameRes.json() : null
    const signerName = sess?.user?.name ?? who

    const nowIso = new Date().toISOString()
    setPlan(p => ({
      ...p,
      hodSignature: who === 'HOD' ? { name: signerName, signedAt: nowIso } : p.hodSignature,
      deanSignature: who === 'DEAN' ? { name: signerName, signedAt: nowIso } : p.deanSignature,
    }))
  }

  const onSave = async () => {
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch(`/api/appraisals/${appraisalId}/self-development-plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `Save failed (${res.status})`)
      }
    } catch (e: any) {
      setErr(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const onPrint = () => window.print()

  const signatureText = (sig?: { name: string; signedAt: string } | null) =>
    sig ? `${sig.name} — ${new Date(sig.signedAt).toLocaleDateString()}` : '________________   Date: __________'

  return (
    <div className="p-6 space-y-6 print:p-0">
      <div className="flex items-start justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Section 3: Self-development Plan</h1>
          <p className="text-muted-foreground">Complete this section after finalizing the evaluation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {err && (
        <Card className="border-destructive/50 bg-destructive/5 print:hidden">
          <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{err}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="print:text-center">Section 3: Self-development Plan</CardTitle>
          <CardDescription className="print:hidden">
            Fill the table below. Add/remove rows as needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="min-w-[200px]">Development Area</TableHead>
                  <TableHead className="min-w-[220px]">Link to my goals, capabilities, or organization</TableHead>
                  <TableHead className="min-w-[240px]">Plan of Development Activities</TableHead>
                  <TableHead className="min-w-[200px]">Expected Results</TableHead>
                  <TableHead className="min-w-[160px]">Timeframe</TableHead>
                  <TableHead className="w-12 print:hidden"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="align-top">
                      <Input value={row.developmentArea} onChange={(e) => updateRow(row.id, { developmentArea: e.target.value })} />
                    </TableCell>
                    <TableCell className="align-top">
                      <Textarea rows={3} value={row.linkToGoals} onChange={(e) => updateRow(row.id, { linkToGoals: e.target.value })} />
                    </TableCell>
                    <TableCell className="align-top">
                      <Textarea rows={3} value={row.activities} onChange={(e) => updateRow(row.id, { activities: e.target.value })} />
                    </TableCell>
                    <TableCell className="align-top">
                      <Textarea rows={3} value={row.expectedResults} onChange={(e) => updateRow(row.id, { expectedResults: e.target.value })} />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input value={row.timeframe} onChange={(e) => updateRow(row.id, { timeframe: e.target.value })} />
                    </TableCell>
                    <TableCell className="print:hidden text-right">
                      <Button size="icon" variant="ghost" onClick={() => removeRow(row.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="print:hidden">
                  <TableCell colSpan={6} className="text-center py-3">
                    <Button variant="outline" onClick={addRow}><Plus className="mr-2 h-4 w-4" /> Add Row</Button>
                  </TableCell>
                </TableRow>

                {/* Gray band row like the sample */}
                <TableRow>
                  <TableCell colSpan={5} className="bg-muted text-sm font-medium">
                    Evaluation of Performance Progress / Comments Section
                  </TableCell>
                  <TableCell className="bg-muted text-center font-medium">Annual Evaluation</TableCell>
                </TableRow>

                {/* Comments rows below table per sample */}
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Bi-annual Evaluation Comments</div>
                      <Textarea rows={4} value={plan.biAnnualComments} onChange={(e) => setPlan(p => ({ ...p, biAnnualComments: e.target.value }))} />
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Annual Evaluation Comments</div>
                      <Textarea rows={4} value={plan.annualComments} onChange={(e) => setPlan(p => ({ ...p, annualComments: e.target.value }))} />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
            <div className="border rounded-md p-4">
              <div className="mb-2 font-medium">Head of Academic Department Signature</div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{signatureText(plan.hodSignature)}</span>
                {canSignAsHod && (
                  <Button size="sm" variant="outline" onClick={() => sign('HOD')} className="print:hidden">Sign as HOD</Button>
                )}
              </div>
            </div>
            <div className="border rounded-md p-4">
              <div className="mb-2 font-medium">Dean of College Signature</div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{signatureText(plan.deanSignature)}</span>
                {canSignAsDean && (
                  <Button size="sm" variant="outline" onClick={() => sign('DEAN')} className="print:hidden">Sign as Dean</Button>
                )}
              </div>
            </div>
          </div>

          {/* Footer actions (print view hidden) */}
          <div className="flex items-center justify-between pt-2 print:hidden">
            <Badge variant="secondary" className="text-xs">
              {meRole === 'DEAN' ? 'Dean view' : meRole === 'HOD' ? 'HOD view' : meRole}
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>Back</Button>
              <Button onClick={onSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
