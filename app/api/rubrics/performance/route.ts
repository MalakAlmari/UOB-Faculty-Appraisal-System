import { NextResponse } from 'next/server'
import { performanceRubric } from '@/lib/performance-rubrics'

export async function GET() {
  return await NextResponse.json(performanceRubric)
}