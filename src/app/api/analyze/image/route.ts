import { NextRequest, NextResponse } from 'next/server'
import { checkReverseImage } from '@/lib/checks/bing-image'
import { checkSafeBrowsing } from '@/lib/checks/safe-browsing'
import { calculateScore, getRiskLevel } from '@/lib/scoring'
import type { AnalysisReport, ModelConfig } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { imageUrl, extractedQrUrl } = await req.json() as { imageUrl: string; extractedQrUrl?: string; modelConfig: ModelConfig }
  const checks = [await checkReverseImage(imageUrl, process.env.BING_SEARCH_KEY ?? '')]
  if (extractedQrUrl) {
    const qr = await checkSafeBrowsing([extractedQrUrl], process.env.GOOGLE_SAFE_BROWSING_KEY ?? '')
    checks.push({ ...qr, id:'qr-url-safety', label:'QR URL Safety' })
  }
  const score = calculateScore(checks)
  const report: AnalysisReport = { score, riskLevel: getRiskLevel(score), checks, summary: checks[0].detail }
  return NextResponse.json(report)
}
