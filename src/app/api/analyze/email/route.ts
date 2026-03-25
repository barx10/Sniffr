import { NextRequest, NextResponse } from 'next/server'
import { checkSafeBrowsing } from '@/lib/checks/safe-browsing'
import { checkDomainAge } from '@/lib/checks/whois'
import { checkEmailRep } from '@/lib/checks/emailrep'
import { parseEmailHeaders } from '@/lib/checks/headers'
import { detectLookalikeDomains, extractDomains } from '@/lib/checks/lookalike'
import { extractUrls, extractPhoneNumbers, containsCryptoMention } from '@/lib/extractors'
import { analyzeWithAI } from '@/lib/ai'
import { calculateScore, getRiskLevel } from '@/lib/scoring'
import type { CheckResult, ModelConfig, AnalysisReport } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: { sender: string; subject: string; emailBody: string; headers?: string; modelConfig: ModelConfig }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { sender, subject, emailBody, headers: rawHeaders, modelConfig } = body
  if ((!sender && !emailBody) || !modelConfig?.apiKey)
    return NextResponse.json({ error: 'Missing required fields or API key' }, { status: 400 })

  const fullText = `${sender} ${subject ?? ''} ${emailBody}`
  const urls = extractUrls(fullText)
  const senderDomain = sender.includes('@') ? sender.split('@')[1] : ''

  const [safeBrowsing, domainAge, emailRep] = await Promise.allSettled([
    checkSafeBrowsing(urls, process.env.GOOGLE_SAFE_BROWSING_KEY ?? ''),
    checkDomainAge(senderDomain),
    checkEmailRep(sender, process.env.EMAILREP_KEY ?? ''),
  ])

  const checks: CheckResult[] = [
    safeBrowsing.status === 'fulfilled' ? safeBrowsing.value : { id:'safe-browsing', label:'Safe Browsing', status:'error', weight:25, detail:'Check failed' },
    domainAge.status === 'fulfilled' ? domainAge.value : { id:'domain-age', label:'Domain Age', status:'error', weight:15, detail:'Check failed' },
    emailRep.status === 'fulfilled' ? emailRep.value : { id:'emailrep', label:'Email Reputation', status:'error', weight:20, detail:'Check failed' },
  ]

  const lookalikes = detectLookalikeDomains(extractDomains(fullText))
  checks.push({
    id: 'lookalike', label: 'Lookalike Domains',
    status: lookalikes.length > 0 ? 'fail' : 'pass', weight: 15,
    detail: lookalikes.length > 0 ? lookalikes.map(l => `${l.domain}: ${l.reason}`).join('; ') : 'No lookalike domains',
    data: lookalikes,
  })

  const hasCrypto = containsCryptoMention(emailBody)
  checks.push({
    id: 'crypto-flag', label: 'Crypto / Gift Cards',
    status: hasCrypto ? 'fail' : 'pass', weight: 20,
    detail: hasCrypto ? 'Crypto or gift card request found — strong scam indicator' : 'No crypto or gift card mentions',
  })

  const phones = extractPhoneNumbers(fullText)
  checks.push({ id:'phone-numbers', label:'Phone Numbers', status: phones.length ? 'warn' : 'pass', weight:5,
    detail: phones.length ? `Found: ${phones.join(', ')}` : 'None found', data: phones })

  if (rawHeaders) {
    const h = parseEmailHeaders(rawHeaders)
    const issues = [
      h.spf === 'fail' && 'SPF fail',
      (h.dkim === 'fail' || h.dkim === 'none') && 'DKIM missing/fail',
      h.dmarc === 'fail' && 'DMARC fail'
    ].filter(Boolean) as string[]
    checks.push({ id:'headers', label:'Email Headers',
      status: issues.length >= 2 ? 'fail' : issues.length === 1 ? 'warn' : 'pass', weight:15,
      detail: issues.length ? `Auth failures: ${issues.join(', ')}${h.originatingIp ? `. IP: ${h.originatingIp}` : ''}` : 'SPF/DKIM/DMARC all pass',
      data: h })
  }

  const aiResult = await analyzeWithAI('email', { sender, subject, body: emailBody }, checks, modelConfig)
  checks.push(aiResult)

  const score = calculateScore(checks)
  const report: AnalysisReport = { score, riskLevel: getRiskLevel(score), checks, summary: aiResult.detail }
  return NextResponse.json(report)
}
