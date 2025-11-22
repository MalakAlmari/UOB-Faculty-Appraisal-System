'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  BandKey, CapKey, CAP_LABEL, CAP_EXPLANATIONS, BAND_LABEL, BAND_POINTS_20
} from '@/lib/capabilities-rubrics'

type Props = {
  appraisalId: number
  readOnly?: boolean
  initialSelections?: Partial<Record<CapKey, BandKey>>
  initialNotes?: Partial<Record<CapKey, string>>
}

const ORDER: CapKey[] = [
  'institutionalCommitment',
  'collaborationTeamwork',
  'professionalism',
  'clientService',
  'achievingResults',
]

export default function CapabilitiesForm({ appraisalId, readOnly, initialSelections, initialNotes }: Props) {
  const [selections, setSelections] = useState<Partial<Record<CapKey, BandKey>>>(initialSelections ?? {})
  const [notes, setNotes] = useState<Partial<Record<CapKey, string>>>(initialNotes ?? {})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ pts?: number; band?: BandKey } | null>(null)

  function onPick(k: CapKey, band: BandKey) {
    setSelections(prev => ({ ...prev, [k]: band }))
  }

  async function onSaveCompute() {
    setSaving(true)
    try {
      const res = await fetch(`/api/appraisals/${appraisalId}/evaluation/capabilities`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ selections }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setResult({ pts: json.capabilitiesPts, band: json.capabilitiesBand })
    } catch (e:any) {
      alert(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const totalPicked = ORDER.reduce((a,k)=> a + (selections[k] ? 1 : 0), 0)
  const previewPts = totalPicked
    ? ORDER.reduce((sum,k)=>{
        const b = selections[k]; if(!b) return sum
        return sum + BAND_POINTS_20[b]
      }, 0) / totalPicked
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Choose a band for each capability (no modal). Explanation fills from the official PDF.
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Picked: {totalPicked}/5</Badge>
          <Badge variant="secondary">
            Preview: {previewPts.toFixed(1)} / 20
          </Badge>
        </div>
      </div>

      {ORDER.map((k)=> {
        const band = selections[k]
        const label = CAP_LABEL[k]
        const explanation = band ? CAP_EXPLANATIONS[k][band] : ''
        return (
          <Card key={k}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(['HIGH','EXCEEDS','MEETS','PARTIAL','NEEDS'] as BandKey[]).map(b => (
                  <button
                    key={b}
                    type="button"
                    disabled={readOnly}
                    onClick={()=> onPick(k, b)}
                    className={cn(
                      'px-3 py-1 rounded-full border text-sm',
                      band === b ? 'bg-primary text-primary-foreground border-primary' : 'bg-white hover:bg-accent',
                      readOnly && 'opacity-50 cursor-not-allowed'
                    )}
                    aria-pressed={band === b}
                  >
                    {BAND_LABEL[b]}
                  </button>
                ))}
              </div>

              <div>
                <Label>Explanation</Label>
                <Textarea
                  value={explanation}
                  readOnly
                  className="mt-1 min-h-[120px]"
                />
              </div>

              <div>
                <Label>Note (private)</Label>
                <Textarea
                  value={notes[k] ?? ''}
                  onChange={(e)=> setNotes(prev => ({...prev, [k]: e.target.value}))}
                  disabled={readOnly}
                  placeholder="Optional note…"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )
      })}

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Average of the selected bands (20-point scale). First save moves status to <b>IN_REVIEW</b>.
        </div>
        <div className="flex gap-2">
          <Button onClick={onSaveCompute} disabled={readOnly || saving}>
            {saving ? 'Saving…' : 'Compute & Save Capabilities'}
          </Button>
          {result?.pts != null && (
            <Badge variant="secondary">
              Saved: {result.pts.toFixed(1)} / 20 ({result.band && BAND_LABEL[result.band]})
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
