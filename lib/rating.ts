// import { RatingBand } from '@prisma/client'

// // UI band used in the form
// export type UiBand = 'HIGH' | 'EXCEEDS' | 'MEETS' | 'PARTIAL' | 'NEEDS'

// // map UI band → Prisma enum
// export function toRatingBand(b: UiBand): RatingBand {
//   switch (b) {
//     case 'HIGH': return 'HIGHLY_EXCEEDS'
//     case 'EXCEEDS': return 'EXCEEDS'
//     case 'MEETS': return 'FULLY_MEETS'
//     case 'PARTIAL': return 'PARTIALLY_MEETS'
//     case 'NEEDS': return 'NEEDS_IMPROVEMENT'
//   }
// }

// // convenience helpers for auto-compute
// export function bandFromCount(n: number): UiBand {
//   return n >= 5 ? 'HIGH' : n === 4 ? 'EXCEEDS' : n === 3 ? 'MEETS' : n === 2 ? 'PARTIAL' : 'NEEDS'
// }
// export function bandFromTeachingPct(pct: number): UiBand {
//   if (pct >= 90) return 'HIGH'
//   if (pct >= 80) return 'EXCEEDS'
//   if (pct >= 60) return 'MEETS'
//   if (pct >= 50) return 'PARTIAL'
//   return 'NEEDS'
// }



import { RatingBand } from '@prisma/client'

export type UiBand = 'HIGH' | 'EXCEEDS' | 'MEETS' | 'PARTIAL' | 'NEEDS'

/** UI → Prisma enum */
export function toRatingBand(ui: UiBand): RatingBand {
  switch (ui) {
    case 'HIGH':     return 'HIGHLY_EXCEEDS'
    case 'EXCEEDS':  return 'EXCEEDS'
    case 'MEETS':    return 'FULLY_MEETS'
    case 'PARTIAL':  return 'PARTIALLY_MEETS'
    default:         return 'NEEDS_IMPROVEMENT'
  }
}

export const S1_POINTS = {
  research:          { HIGH:30, EXCEEDS:24, MEETS:18, PARTIAL:12, NEEDS:6  } as Record<UiBand,number>,
  universityService: { HIGH:20, EXCEEDS:16, MEETS:12, PARTIAL: 8, NEEDS:4  } as Record<UiBand,number>,
  communityService:  { HIGH:20, EXCEEDS:16, MEETS:12, PARTIAL: 8, NEEDS:4  } as Record<UiBand,number>,
  teachingQuality:   { HIGH:30, EXCEEDS:24, MEETS:18, PARTIAL:12, NEEDS:6  } as Record<UiBand,number>,
}

export function s1PointsFor(criterion: 'research'|'universityService'|'communityService'|'teaching'|'teachingQuality', band: UiBand) {
  const key = criterion === 'teaching' ? 'teachingQuality' : criterion
  return (S1_POINTS as any)[key][band]
}

/** من مجموع القدرات (0-100) إلى UI band */
export function capabilitiesBandFromTotal(total: number): UiBand {
  if (total >= 90) return 'HIGH'
  if (total >= 80) return 'EXCEEDS'
  if (total >= 60) return 'MEETS'
  if (total >= 50) return 'PARTIAL'
  return 'NEEDS'
}

export function toNumbered(text?: string | null) {
  if (!text) return ''
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  return lines.map((l, i) => `${i+1}. ${l.replace(/^\d+[\).]\s*|^[\-\u2022]\s*/, '')}`).join('\n')
}
