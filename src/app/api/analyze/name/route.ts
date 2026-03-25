import { NextRequest, NextResponse } from 'next/server'
import { checkEmailRep } from '@/lib/checks/emailrep'
import { analyzeWithAI } from '@/lib/ai'
import { calculateScore, getRiskLevel } from '@/lib/scoring'
import type { AnalysisReport, ModelConfig } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { name, email, context, modelConfig } = await req.json() as {
    name: string; email?: string; context?: string; modelConfig: ModelConfig
  }
  const checks = email ? [await checkEmailRep(email, process.env.EMAILREP_KEY ?? '')] : []
  const ai = await analyzeWithAI('name', { name, context: context ?? '' }, checks, modelConfig)
  checks.push(ai)
  const score = calculateScore(checks)
  const report: AnalysisReport = { score, riskLevel: getRiskLevel(score), checks, summary: ai.detail }
  return NextResponse.json(report)
}
