import { NextRequest, NextResponse } from 'next/server'
import { checkEmailRep } from '@/lib/checks/emailrep'
import { analyzeWithAI } from '@/lib/ai'
import { calculateScore, getRiskLevel } from '@/lib/scoring'
import type { AnalysisReport, ModelConfig } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: { name: string; email?: string; context?: string; modelConfig: ModelConfig }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { name, email, context, modelConfig } = body
  if (!name || !modelConfig?.apiKey)
    return NextResponse.json({ error: 'Missing required fields or API key' }, { status: 400 })
  const checks = email ? [await checkEmailRep(email, process.env.EMAILREP_KEY ?? '')] : []
  const ai = await analyzeWithAI('name', { name, context: context ?? '' }, checks, modelConfig)
  checks.push(ai)
  const score = calculateScore(checks)
  const report: AnalysisReport = { score, riskLevel: getRiskLevel(score), checks, summary: ai.detail }
  return NextResponse.json(report)
}
