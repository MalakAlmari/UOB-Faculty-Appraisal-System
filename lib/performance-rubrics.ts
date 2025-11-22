// lib/rubrics.ts
export type BandKey = 'HIGH'|'EXCEEDS'|'MEETS'|'PARTIAL'|'NEEDS'

/** Section 1 — Evaluation of Performance (Weight 30% / 30,24,18,12,6) */
export const performanceRubric = {
  weight: 30,
  bands: {
    HIGH: {
      label: 'Highly Exceeds',
      points: 30,
      summary:
        'Completion of ONE of the following:\n' +
        '1) Publishing 3+ international research papers.\n' +
        '2) Publishing 2+ international books.\n' +
        '3) Completing 3+ contract projects.\n' +
        '4) A combination of: 2 international papers + an international book + a contract project + reviewing an international paper.\n' +
        '5) One or more internationally registered patents.\n' +
        '6) Completion of 3 items from the “Exceeds expectations” column.'
    },
    EXCEEDS: {
      label: 'Exceeds',
      points: 24,
      summary:
        'Completion of ONE of the following:\n' +
        '1) Publishing 2 international research papers.\n' +
        '2) Publishing an international book.\n' +
        '3) Publishing 2+ indexed books.\n' +
        '4) Completing 2 contract projects.\n' +
        '5) ONE of the following combinations:\n' +
        '   a) An international paper + a book.\n' +
        '   b) An international paper + a contract project.\n' +
        '   c) An international paper + reviewing an international paper.\n' +
        '   d) An international paper + participating as speaker at an international conference.\n' +
        '6) Completion of 3 items from the “Fully meets expectations” column.\n' +
        '7) Registration of one or more patents.'
    },
    MEETS: {
      label: 'Fully Meets',
      points: 18,
      summary:
        'Completion of ONE of the following:\n' +
        '1) Publishing an international research paper.\n' +
        '2) Publishing an indexed book.\n' +
        '3) Completing a contract project.\n' +
        '4) Reviewing 2+ international research papers.\n' +
        '5) Participating as a speaker at an international conference.\n' +
        '6) Registration of a patent.'
    },
    PARTIAL: {
      label: 'Partially Meets',
      points: 12,
      summary:
        'Completion of ONE of the following:\n' +
        '1) Publishing in a local journal.\n' +
        '2) Publishing informative articles.\n' +
        '3) Participating in one or more conferences.'
    },
    NEEDS: {
      label: 'Needs Improvement',
      points: 6,
      summary:
        'No accomplishments as per “Partially meets expectations”. Other accomplishments shall be mentioned as applicable.'
    }
  }
} as const

/** عناصر سكشن 2 — University Service (4 نقاط لكل عنصر) */
export const universityServiceItems = [
  'Participating in activities of standing/ad-hoc committees.',
  'Participating in organizational activities (conferences, workshops, seminars) as chair, coordinator, or member.',
  'Delivering at least one lecture at department/college/university level.',
  'Proposing development initiatives (research/administrative) at department/college/university level.',
  'Proposing an academic program adopted/discussed by the University Council.',
  'Participating in other University services (e.g., admission interviews).',
  'Supervising Ph.D. or Master dissertations, or graduation projects.'
] as const

export const communityServiceItems = [
  'Delivering public lectures that serve the community.',
  'Participating in activities organized by official professional/cultural societies.',
  'Membership of technical/ad-hoc committees or boards.',
  'Providing scientific consultation or conducting workshops/seminars.',
  'Participating in media activities related to the major (articles, TV/radio interviews).',
  'Participating as judge/referee in official local/regional/international contests.',
  'Participating in other community service activities.'
] as const

export const SERVICE_POINTS_PER_ITEM = 4
export const UNIVERSITY_SERVICE_WEIGHT = 20
export const COMMUNITY_SERVICE_WEIGHT = 20

/** تحويل العدّ إلى باند/نقاط (ينطبق على سكشن 2 وسكشن 3) */
export function bandFromCount(count: number): BandKey {
  if (count >= 5) return 'HIGH'
  if (count === 4) return 'EXCEEDS'
  if (count === 3) return 'MEETS'
  if (count === 2) return 'PARTIAL'
  return count >= 1 ? 'NEEDS' : 'NEEDS'
}
export function scoreFromCount(count: number, maxPoints: number): number {
  const raw = count * SERVICE_POINTS_PER_ITEM
  return Math.min(raw, maxPoints)
}

export function buildServiceExplanation(
  sectionLabel: 'University Service'|'Community Service',
  band: BandKey,
  count: number,
  items: readonly string[],
  maxPoints: number
): string {
  const score = scoreFromCount(count, maxPoints)
  // صيغة العنوان حسب الباند
  const header =
    band === 'HIGH' ? 'Completion of 5 or more of the following:'
    : band === 'EXCEEDS' ? 'Completion of 4 of the following:'
    : band === 'MEETS' ? 'Completion of 3 of the following:'
    : band === 'PARTIAL' ? 'Completion of 2 of the following:'
    : 'Completion of 1 of the following:'
  // نص العناصر
  const list = items.map((t,i)=>`${i+1}. ${t}`).join('\n')
  return `${sectionLabel} — ${header}\n${list}\n(Items completed: ${count}; Score: ${score})`
}

export function buildPerformanceExplanation(band: BandKey): { points: number; text: string; label: string } {
  const b = performanceRubric.bands[band]
  return { points: b.points, text: b.summary, label: b.label }
}
