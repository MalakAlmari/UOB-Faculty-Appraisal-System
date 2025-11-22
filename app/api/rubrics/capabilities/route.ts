import { NextResponse } from 'next/server'
import { CAP_LABEL, CAP_EXPLANATIONS, BAND_POINTS_20, BAND_LABEL } from '@/lib/capabilities-rubrics'

export async function GET() {
  return NextResponse.json({
    weight: 20, // الوزن النهائي لقسم Capabilities ضمن التقييم الكلي
    bandPoints: BAND_POINTS_20,
    bandLabels: BAND_LABEL,
    sections: CAP_LABEL,
    explanations: CAP_EXPLANATIONS,
  })
}
