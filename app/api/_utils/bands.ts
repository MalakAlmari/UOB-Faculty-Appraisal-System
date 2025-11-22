import { RatingBand } from '@prisma/client'

export type UiBand = 'HIGH' | 'EXCEEDS' | 'MEETS' | 'PARTIAL' | 'NEEDS'

export function uiToRatingBand(ui: UiBand): RatingBand {
  const RB = RatingBand as unknown as Record<string, RatingBand>
  const candidates: Record<UiBand, string[]> = {
    HIGH:    ['HIGH', 'HIGHLY_EXCEEDS'],
    EXCEEDS: ['EXCEEDS', 'EXCEEDS_EXPECTATIONS'],
    MEETS:   ['MEETS', 'FULLY_MEETS'],
    PARTIAL: ['PARTIAL', 'PARTIALLY_MEETS'],
    NEEDS:   ['NEEDS', 'NEEDS_IMPROVEMENT'],
  }
  for (const key of candidates[ui]) {
    if (RB[key]) return RB[key]
  }
  // fallback آمن
  return RB.MEETS ?? (Object.values(RB)[0] as RatingBand)
}
