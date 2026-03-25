import { NextRequest, NextResponse } from 'next/server'
import { checkReverseImage } from '@/lib/checks/google-vision'
import { checkSafeBrowsing } from '@/lib/checks/safe-browsing'
import { calculateScore, getRiskLevel } from '@/lib/scoring'
import type { AnalysisReport, ModelConfig } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: { imageUrl: string; extractedQrUrl?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { imageUrl, extractedQrUrl } = body
  if (!imageUrl) return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 })
  const checks = [await checkReverseImage(imageUrl, process.env.GOOGLE_SAFE_BROWSING_KEY ?? '')]
  if (extractedQrUrl) {
    const qr = await checkSafeBrowsing([extractedQrUrl], process.env.GOOGLE_SAFE_BROWSING_KEY ?? '')
    checks.push({ ...qr, id:'qr-url-safety', label:'QR-kode URL-sjekk' })
  }
  const score = calculateScore(checks)
  const report: AnalysisReport = { score, riskLevel: getRiskLevel(score), checks, summary: checks[0].detail }
  return NextResponse.json(report)
}
