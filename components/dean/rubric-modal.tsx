'use client'
import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

export type BandKey = 'HIGH'|'EXCEEDS'|'MEETS'|'PARTIAL'|'NEEDS'
export type PerformanceRubric = {
  weight: number
  bands: Record<BandKey, { label: string; points: number; summary: string; details?: string[] }>
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  rubric: PerformanceRubric
  currentBand?: BandKey
  onUse: (band: BandKey) => void
}

export default function RubricModal({ open, onOpenChange, rubric, currentBand, onUse }: Props) {
  const [tab, setTab] = React.useState<BandKey>(currentBand ?? 'MEETS')
  React.useEffect(()=> { if(open && currentBand) setTab(currentBand) }, [open, currentBand])

  const order: BandKey[] = ['HIGH','EXCEEDS','MEETS','PARTIAL','NEEDS']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Performance Rubric</DialogTitle>
          <DialogDescription>Weight: {rubric.weight}% — Review the official rubric and apply a band.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v)=>setTab(v as BandKey)}>
          <TabsList className="flex flex-wrap gap-2">
            {order.map(k=>(
              <TabsTrigger key={k} value={k}>
                {rubric.bands[k].label} ({rubric.bands[k].points})
              </TabsTrigger>
            ))}
          </TabsList>
          {order.map(k=>{
            const b = rubric.bands[k]
            return (
              <TabsContent key={k} value={k} className="mt-4 space-y-3">
                <div className="text-sm">
                  <div className="font-semibold mb-1">{b.label} — {b.points} pts</div>
                  <p className="text-muted-foreground">{b.summary}</p>
                </div>
                {!!b.details?.length && (
                  <ul className="list-disc pl-5 text-sm">
                    {b.details.map((d,i)=><li key={i}>{d}</li>)}
                  </ul>
                )}
              </TabsContent>
            )
          })}
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={()=>onOpenChange(false)}>Close</Button>
          <Button onClick={()=>{ onUse(tab); onOpenChange(false) }}>Use this band</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
