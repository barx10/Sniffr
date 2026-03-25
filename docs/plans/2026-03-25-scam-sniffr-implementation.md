# Scam Sniffr Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a stateless Next.js web app that analyzes suspected scam emails, images, and sender names using parallel external API checks and AI interpretation.

**Architecture:** Three focused analysis modes (email, image/QR, name) each fan out parallel checks via Promise.allSettled, feed results to a user-configured AI model (Claude/GPT/Gemini) for interpretation, and return a weighted risk score with per-check breakdown cards. All API keys are BYOK — stored in the user's localStorage and sent per-request; nothing is persisted server-side.

**Tech Stack:** Next.js 16 App Router · shadcn/ui + Tailwind CSS · Vercel AI SDK v6 · Vitest for unit tests · no database · no auth

---

## Prerequisites

You need API keys for these free services before starting Task 5+:
- **Google Safe Browsing v4** — console.cloud.google.com — enable "Safe Browsing API", create API key
- **EmailRep.io** — emailrep.io — register for free key
- **Bing Visual Search** — portal.azure.com — create "Bing Search v7" resource, free tier (1000/month)
- **AI key** — whichever provider you choose (Anthropic/OpenAI/Google)

Store in .env.local (never commit):
```
GOOGLE_SAFE_BROWSING_KEY=...
EMAILREP_KEY=...
BING_SEARCH_KEY=...
```

---

## Task 1: Scaffold Next.js project

**Step 1: Run create-next-app**
```bash
cd /Users/kennethbareksten/Koding/sniffr
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

**Step 2: Install core dependencies**
```bash
npm install ai @ai-sdk/react @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google lucide-react geist
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

**Step 3: Create vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], globals: true },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

**Step 4: Create src/test/setup.ts**
```typescript
import '@testing-library/jest-dom'
```

**Step 5: Add test scripts to package.json**
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 6: Commit**
```bash
git add -A && git commit -m "feat: scaffold Next.js 16 with Vitest"
```

---

## Task 2: Install shadcn/ui + configure layout

**Step 1: Initialize shadcn**
```bash
npx shadcn@latest init
```
Choose: Default style · Zinc color · CSS variables: yes

**Step 2: Add components**
```bash
npx shadcn@latest add button card tabs textarea badge dialog label select separator tooltip input
```

**Step 3: Update src/app/layout.tsx**
```typescript
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Scam Sniffr',
  description: 'Analyze suspicious emails for scam and phishing signals',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
```

**Step 4: Verify dev server**
```bash
npm run dev
```
Visit http://localhost:3000 — dark background, no errors.

**Step 5: Commit**
```bash
git add -A && git commit -m "feat: shadcn/ui, Geist font, dark mode"
```

---

## Task 3: Types + Scoring logic (TDD)

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/scoring.ts`
- Create: `src/lib/__tests__/scoring.test.ts`

**Step 1: Create src/lib/types.ts**
```typescript
export type CheckStatus = 'pass' | 'warn' | 'fail' | 'error'
export type RiskLevel = 'green' | 'yellow' | 'red'

export interface CheckResult {
  id: string
  label: string
  status: CheckStatus
  weight: number
  detail: string
  data?: unknown
}

export interface AnalysisReport {
  score: number
  riskLevel: RiskLevel
  checks: CheckResult[]
  summary: string
}

export type AnalysisMode = 'email' | 'image' | 'name'

export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'google'
  model: string
  apiKey: string
}
```

**Step 2: Write failing tests — src/lib/__tests__/scoring.test.ts**
```typescript
import { describe, it, expect } from 'vitest'
import { calculateScore, getRiskLevel } from '@/lib/scoring'
import type { CheckResult } from '@/lib/types'

const c = (status: CheckResult['status'], weight: number): CheckResult =>
  ({ id: 'x', label: 'X', status, weight, detail: '' })

describe('calculateScore', () => {
  it('returns 0 for all passing', () => expect(calculateScore([c('pass', 10)])).toBe(0))
  it('returns 100 for full fail', () => expect(calculateScore([c('fail', 100)])).toBe(100))
  it('weights warn at 50%', () => expect(calculateScore([c('warn', 100)])).toBe(50))
  it('ignores error checks', () => expect(calculateScore([c('error', 100)])).toBe(0))
  it('caps at 100', () => expect(calculateScore([c('fail', 80), c('fail', 80)])).toBe(100))
})

describe('getRiskLevel', () => {
  it('green 0-30', () => { expect(getRiskLevel(0)).toBe('green'); expect(getRiskLevel(30)).toBe('green') })
  it('yellow 31-65', () => { expect(getRiskLevel(31)).toBe('yellow'); expect(getRiskLevel(65)).toBe('yellow') })
  it('red 66+', () => { expect(getRiskLevel(66)).toBe('red'); expect(getRiskLevel(100)).toBe('red') })
})
```

**Step 3: Run — verify FAIL**
```bash
npm run test:run -- src/lib/__tests__/scoring.test.ts
```
Expected: Cannot find module

**Step 4: Implement src/lib/scoring.ts**
```typescript
import type { CheckResult, RiskLevel } from './types'

export function calculateScore(checks: CheckResult[]): number {
  const active = checks.filter(c => c.status !== 'error')
  const total = active.reduce((s, c) => s + c.weight, 0)
  if (total === 0) return 0
  const risk = checks.reduce((s, c) => {
    if (c.status === 'fail') return s + c.weight
    if (c.status === 'warn') return s + c.weight * 0.5
    return s
  }, 0)
  return Math.min(100, Math.round((risk / total) * 100))
}

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'green'
  if (score <= 65) return 'yellow'
  return 'red'
}
```

**Step 5: Run — verify PASS**
```bash
npm run test:run -- src/lib/__tests__/scoring.test.ts
```

**Step 6: Commit**
```bash
git add src/lib/ && git commit -m "feat: types and scoring logic (TDD)"
```

---

## Task 4: Lookalike domain detector (TDD)

**Files:**
- Create: `src/lib/checks/lookalike.ts`
- Create: `src/lib/checks/__tests__/lookalike.test.ts`

**Step 1: Write failing tests**
```typescript
import { describe, it, expect } from 'vitest'
import { detectLookalikeDomains, extractDomains } from '@/lib/checks/lookalike'

describe('extractDomains', () => {
  it('extracts from URLs', () => {
    expect(extractDomains('https://paypa1.com/login')).toEqual(['paypa1.com'])
  })
  it('extracts from email addresses', () => {
    expect(extractDomains('no-reply@netflix-billing.io')).toEqual(['netflix-billing.io'])
  })
  it('returns empty for plain text', () => {
    expect(extractDomains('Hello world')).toEqual([])
  })
})

describe('detectLookalikeDomains', () => {
  it('flags numeric substitution', () => expect(detectLookalikeDomains(['paypa1.com'])).toHaveLength(1))
  it('flags hyphenated brand', () => expect(detectLookalikeDomains(['netflix-billing.com'])).toHaveLength(1))
  it('passes legitimate domains', () => expect(detectLookalikeDomains(['google.com'])).toHaveLength(0))
  it('passes paypal itself', () => expect(detectLookalikeDomains(['paypal.com'])).toHaveLength(0))
})
```

**Step 2: Run — verify FAIL**
```bash
npm run test:run -- src/lib/checks/__tests__/lookalike.test.ts
```

**Step 3: Implement src/lib/checks/lookalike.ts**
```typescript
const BRANDS = ['paypal','amazon','netflix','apple','microsoft','google',
  'facebook','instagram','twitter','bank','dhl','fedex','ups','spotify',
  'dropbox','linkedin','yahoo','outlook']

export function extractDomains(text: string): string[] {
  const urls = [...text.matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g)].map(m => m[1])
  const emails = [...text.matchAll(/[\w.+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)].map(m => m[1])
  return [...new Set([...urls, ...emails])]
}

export interface LookalikeMatch { domain: string; reason: string }

export function detectLookalikeDomains(domains: string[]): LookalikeMatch[] {
  return domains.flatMap(domain => {
    const base = domain.toLowerCase().split('.')[0]
    const norm = base.replace(/4/g,'a').replace(/3/g,'e').replace(/1/g,'i').replace(/0/g,'o').replace(/5/g,'s')
    if (norm !== base && BRANDS.some(b => norm.includes(b)))
      return [{ domain, reason: `Numeric substitution (looks like "${norm}")` }]
    const nohyph = base.replace(/-/g, '')
    if (base.includes('-') && BRANDS.some(b => nohyph.includes(b)))
      return [{ domain, reason: 'Hyphenated brand impersonation' }]
    if (BRANDS.some(b => base.startsWith(b) && base.length > b.length))
      return [{ domain, reason: 'Brand name with suspicious suffix' }]
    return []
  })
}
```

**Step 4: Run — verify PASS**
```bash
npm run test:run -- src/lib/checks/__tests__/lookalike.test.ts
```

**Step 5: Commit**
```bash
git add src/lib/checks/ && git commit -m "feat: lookalike domain detector (TDD)"
```

---

## Task 5: Email header parser (TDD)

**Files:**
- Create: `src/lib/checks/headers.ts`
- Create: `src/lib/checks/__tests__/headers.test.ts`

**Step 1: Write failing tests**
```typescript
import { describe, it, expect } from 'vitest'
import { parseEmailHeaders } from '@/lib/checks/headers'

const PASS_HDR = `Authentication-Results: mx.google.com;
  spf=pass dkim=pass dmarc=pass
Received: from mail.legit.com (mail.legit.com [203.0.113.5])`

const FAIL_HDR = `Authentication-Results: mx.google.com;
  spf=fail dkim=none dmarc=fail
Received: from unknown (EHLO bad) (185.220.101.42)`

describe('parseEmailHeaders', () => {
  it('detects spf pass', () => expect(parseEmailHeaders(PASS_HDR).spf).toBe('pass'))
  it('detects dkim pass', () => expect(parseEmailHeaders(PASS_HDR).dkim).toBe('pass'))
  it('detects dmarc pass', () => expect(parseEmailHeaders(PASS_HDR).dmarc).toBe('pass'))
  it('detects spf fail', () => expect(parseEmailHeaders(FAIL_HDR).spf).toBe('fail'))
  it('detects dkim none', () => expect(parseEmailHeaders(FAIL_HDR).dkim).toBe('none'))
  it('extracts IP', () => expect(parseEmailHeaders(FAIL_HDR).originatingIp).toBe('185.220.101.42'))
  it('returns nulls for empty', () => {
    const r = parseEmailHeaders('From: x@y.com')
    expect(r.spf).toBeNull()
    expect(r.originatingIp).toBeNull()
  })
})
```

**Step 2: Run — verify FAIL**
```bash
npm run test:run -- src/lib/checks/__tests__/headers.test.ts
```

**Step 3: Implement src/lib/checks/headers.ts**
```typescript
export interface ParsedHeaders {
  spf: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none' | null
  dkim: 'pass' | 'fail' | 'none' | null
  dmarc: 'pass' | 'fail' | 'none' | null
  originatingIp: string | null
}

export function parseEmailHeaders(raw: string): ParsedHeaders {
  const t = raw.toLowerCase()
  return {
    spf: (t.match(/spf=(pass|fail|softfail|neutral|none)/)?.[1] ?? null) as ParsedHeaders['spf'],
    dkim: (t.match(/dkim=(pass|fail|none)/)?.[1] ?? null) as ParsedHeaders['dkim'],
    dmarc: (t.match(/dmarc=(pass|fail|none)/)?.[1] ?? null) as ParsedHeaders['dmarc'],
    originatingIp: raw.match(/\((?:[^)]*\s)?\(?((?:\d{1,3}\.){3}\d{1,3})\)?/)?.[1] ?? null,
  }
}
```

**Step 4: Run — verify PASS**
```bash
npm run test:run -- src/lib/checks/__tests__/headers.test.ts
```

**Step 5: Commit**
```bash
git add src/lib/checks/ && git commit -m "feat: email header parser SPF/DKIM/DMARC (TDD)"
```

---

## Task 6: Extractors (TDD)

**Files:**
- Create: `src/lib/extractors.ts`
- Create: `src/lib/__tests__/extractors.test.ts`

**Step 1: Write failing tests**
```typescript
import { describe, it, expect } from 'vitest'
import { extractUrls, extractPhoneNumbers, containsCryptoMention } from '@/lib/extractors'

describe('extractUrls', () => {
  it('finds http and https URLs', () =>
    expect(extractUrls('Visit https://evil.com or http://bad.net')).toEqual(['https://evil.com', 'http://bad.net']))
  it('returns empty for no URLs', () => expect(extractUrls('Hello')).toEqual([]))
})

describe('extractPhoneNumbers', () => {
  it('finds international numbers', () => expect(extractPhoneNumbers('Call +4712345678')).toHaveLength(1))
  it('returns empty', () => expect(extractPhoneNumbers('No numbers')).toHaveLength(0))
})

describe('containsCryptoMention', () => {
  it('detects Bitcoin', () => expect(containsCryptoMention('Send Bitcoin now')).toBe(true))
  it('detects gift card', () => expect(containsCryptoMention('Buy iTunes gift card')).toBe(true))
  it('returns false for clean text', () => expect(containsCryptoMention('Please see attached')).toBe(false))
})
```

**Step 2: Run — verify FAIL**
```bash
npm run test:run -- src/lib/__tests__/extractors.test.ts
```

**Step 3: Implement src/lib/extractors.ts**
```typescript
export function extractUrls(text: string): string[] {
  return [...text.matchAll(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi)].map(m => m[0])
}

export function extractPhoneNumbers(text: string): string[] {
  return (text.match(/\+?[\d\s\-().]{7,20}\d/g) ?? [])
    .filter(m => { const d = m.replace(/\D/g,''); return d.length >= 7 && d.length <= 15 })
}

const CRYPTO_KW = ['bitcoin','btc','ethereum','eth','crypto','usdt','tether',
  'itunes gift card','google play card','amazon gift card','gift card','prepaid card']

export function containsCryptoMention(text: string): boolean {
  const t = text.toLowerCase()
  return CRYPTO_KW.some(k => t.includes(k))
}
```

**Step 4: Run — verify PASS**
```bash
npm run test:run -- src/lib/__tests__/extractors.test.ts
```

**Step 5: Run full test suite**
```bash
npm run test:run
```
Expected: all green.

**Step 6: Commit**
```bash
git add src/lib/ && git commit -m "feat: URL/phone/crypto extractors (TDD)"
```

---

## Task 7: External API check wrappers

No TDD — these call real external APIs. We write thin wrappers with consistent CheckResult shape.

**Files to create:**
- `src/lib/checks/safe-browsing.ts`
- `src/lib/checks/whois.ts`
- `src/lib/checks/emailrep.ts`
- `src/lib/checks/bing-image.ts`

**src/lib/checks/safe-browsing.ts**
```typescript
import type { CheckResult } from '@/lib/types'

export async function checkSafeBrowsing(urls: string[], apiKey: string): Promise<CheckResult> {
  if (!urls.length) return { id:'safe-browsing', label:'Safe Browsing', status:'pass', weight:25, detail:'No URLs found' }
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId:'scam-sniffr', clientVersion:'1.0' },
        threatInfo: {
          threatTypes: ['MALWARE','SOCIAL_ENGINEERING','UNWANTED_SOFTWARE','POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: urls.map(u => ({ url: u })),
        },
      }),
    })
    const data = await res.json()
    const matches = data.matches ?? []
    if (matches.length > 0)
      return { id:'safe-browsing', label:'Safe Browsing', status:'fail', weight:25,
        detail: `${matches.length} URL(s) flagged: ${matches.map((m: {threat:{url:string}}) => m.threat.url).join(', ')}`, data: matches }
    return { id:'safe-browsing', label:'Safe Browsing', status:'pass', weight:25, detail:`${urls.length} URL(s) checked — none flagged` }
  } catch {
    return { id:'safe-browsing', label:'Safe Browsing', status:'error', weight:25, detail:'API unavailable' }
  }
}
```

**src/lib/checks/whois.ts**
```typescript
import type { CheckResult } from '@/lib/types'

export async function checkDomainAge(domain: string): Promise<CheckResult> {
  if (!domain) return { id:'domain-age', label:'Domain Age', status:'error', weight:15, detail:'No domain provided' }
  try {
    const res = await fetch(`https://www.whoisjsonapi.com/v1/${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/json' },
    })
    const data = await res.json()
    const created = data?.domain?.created_date ?? data?.created_date
    if (!created) return { id:'domain-age', label:'Domain Age', status:'warn', weight:15, detail:'Could not determine domain age' }
    const days = Math.floor((Date.now() - new Date(created).getTime()) / 86_400_000)
    if (days < 30) return { id:'domain-age', label:'Domain Age', status:'fail', weight:15, detail:`Domain registered only ${days} days ago` }
    if (days < 180) return { id:'domain-age', label:'Domain Age', status:'warn', weight:15, detail:`Domain is ${days} days old — relatively new` }
    return { id:'domain-age', label:'Domain Age', status:'pass', weight:15, detail:`Domain is ${Math.floor(days/365)} year(s) old` }
  } catch {
    return { id:'domain-age', label:'Domain Age', status:'error', weight:15, detail:'WHOIS lookup failed' }
  }
}
```

**src/lib/checks/emailrep.ts**
```typescript
import type { CheckResult } from '@/lib/types'

export async function checkEmailRep(email: string, apiKey: string): Promise<CheckResult> {
  if (!email) return { id:'emailrep', label:'Email Reputation', status:'error', weight:20, detail:'No email provided' }
  try {
    const res = await fetch(`https://emailrep.io/${encodeURIComponent(email)}`, {
      headers: { Key: apiKey, 'User-Agent': 'scam-sniffr' },
    })
    const data = await res.json()
    if (data.suspicious || data.details?.malicious_activity)
      return { id:'emailrep', label:'Email Reputation', status:'fail', weight:20,
        detail:`Flagged as suspicious. Reputation: ${data.reputation ?? 'none'}`, data }
    if (data.reputation === 'none' || !data.details?.profiles?.length)
      return { id:'emailrep', label:'Email Reputation', status:'warn', weight:20, detail:'No reputation data — sender has no online presence' }
    return { id:'emailrep', label:'Email Reputation', status:'pass', weight:20, detail:`Reputation: ${data.reputation}` }
  } catch {
    return { id:'emailrep', label:'Email Reputation', status:'error', weight:20, detail:'EmailRep unavailable' }
  }
}
```

**src/lib/checks/bing-image.ts**
```typescript
import type { CheckResult } from '@/lib/types'

export async function checkReverseImage(imageUrl: string, apiKey: string): Promise<CheckResult> {
  try {
    const res = await fetch('https://api.bing.microsoft.com/v7.0/images/visualsearch?mkt=en-US', {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `knowledgeRequest={"imageInfo":{"url":"${imageUrl}"}}`,
    })
    const data = await res.json()
    const pages = (data.tags ?? [])
      .flatMap((t: {actions: unknown[]}) => t.actions)
      .filter((a: {actionType: string}) => a.actionType === 'PagesIncluding')
      .flatMap((a: {data: {value: {hostPageUrl: string}[]}}) => a.data?.value ?? [])
    if (pages.length > 0)
      return { id:'reverse-image', label:'Reverse Image Search', status:'warn', weight:20,
        detail:`Image found on ${pages.length} other page(s) — may be stolen`, data: pages.slice(0,5) }
    return { id:'reverse-image', label:'Reverse Image Search', status:'pass', weight:20, detail:'Image not found elsewhere — appears original' }
  } catch {
    return { id:'reverse-image', label:'Reverse Image Search', status:'error', weight:20, detail:'Bing Visual Search unavailable' }
  }
}
```

**Commit**
```bash
git add src/lib/checks/ && git commit -m "feat: external API check wrappers"
```

---

## Task 8: AI analysis module

**File:** `src/lib/ai.ts`

```typescript
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { CheckResult, ModelConfig, AnalysisMode } from './types'

function getModel(config: ModelConfig) {
  if (config.provider === 'openai') return createOpenAI({ apiKey: config.apiKey })(config.model)
  if (config.provider === 'anthropic') return createAnthropic({ apiKey: config.apiKey })(config.model)
  return createGoogleGenerativeAI({ apiKey: config.apiKey })(config.model)
}

export async function analyzeWithAI(
  mode: AnalysisMode,
  input: Record<string, string>,
  checks: CheckResult[],
  config: ModelConfig
): Promise<CheckResult> {
  const checkSummary = checks.map(c => `- ${c.label}: ${c.status.toUpperCase()} — ${c.detail}`).join('\n')

  const prompts: Record<AnalysisMode, string> = {
    email: `Analyze this email for scam signals.\n\nFROM: ${input.sender}\nSUBJECT: ${input.subject}\nBODY:\n${input.body}\n\nAutomated checks:\n${checkSummary}\n\nReturn JSON: { "status": "pass"|"warn"|"fail", "detail": "1-2 sentence finding", "flags": ["flag1",...] }`,
    name: `Is "${input.name}" a name associated with scam identities?\nContext: ${input.context}\nChecks:\n${checkSummary}\n\nReturn JSON: { "status": "pass"|"warn"|"fail", "detail": "...", "flags": [] }`,
    image: `Assess this image context for scam risk: ${input.imageUrl}\nChecks:\n${checkSummary}\n\nReturn JSON: { "status": "pass"|"warn"|"fail", "detail": "...", "flags": [] }`,
  }

  try {
    const { text } = await generateText({
      model: getModel(config),
      system: 'You are a cybersecurity expert specializing in email scam and phishing analysis. Be direct and specific.',
      prompt: prompts[mode],
    })
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    const flags: string[] = parsed.flags ?? []
    const detail = parsed.detail ?? text.slice(0, 200)
    return {
      id: 'ai-analysis', label: 'AI Analysis',
      status: parsed.status ?? 'warn', weight: 30,
      detail: flags.length ? `${detail} Flags: ${flags.join(', ')}` : detail,
      data: parsed,
    }
  } catch (e) {
    return { id:'ai-analysis', label:'AI Analysis', status:'error', weight:30,
      detail: `AI analysis failed: ${e instanceof Error ? e.message : 'unknown'}` }
  }
}
```

**Commit**
```bash
git add src/lib/ai.ts && git commit -m "feat: multi-provider AI analysis module"
```

---

## Task 9: API routes

**Create src/app/api/analyze/email/route.ts**
```typescript
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
  const { sender, subject, emailBody, headers: rawHeaders, modelConfig } = await req.json() as {
    sender: string; subject: string; emailBody: string; headers?: string; modelConfig: ModelConfig
  }

  const fullText = `${sender} ${subject} ${emailBody}`
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

  checks.push({
    id: 'crypto-flag', label: 'Crypto / Gift Cards',
    status: containsCryptoMention(emailBody) ? 'fail' : 'pass', weight: 20,
    detail: containsCryptoMention(emailBody) ? 'Crypto or gift card request found — strong scam indicator' : 'No crypto or gift card mentions',
  })

  const phones = extractPhoneNumbers(fullText)
  checks.push({ id:'phone-numbers', label:'Phone Numbers', status: phones.length ? 'warn' : 'pass', weight:5,
    detail: phones.length ? `Found: ${phones.join(', ')}` : 'None found', data: phones })

  if (rawHeaders) {
    const h = parseEmailHeaders(rawHeaders)
    const issues = [h.spf === 'fail' && 'SPF fail', (h.dkim === 'fail' || h.dkim === 'none') && 'DKIM missing/fail', h.dmarc === 'fail' && 'DMARC fail'].filter(Boolean)
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
```

**Create src/app/api/analyze/image/route.ts**
```typescript
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
```

**Create src/app/api/analyze/name/route.ts**
```typescript
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
```

**Commit**
```bash
git add src/app/api/ && git commit -m "feat: email, image, and name analysis API routes"
```

---

## Task 10: Settings modal

**Create src/hooks/useModelConfig.ts**
```typescript
'use client'
import { useState, useEffect } from 'react'
import type { ModelConfig } from '@/lib/types'

const KEY = 'scam-sniffr-model-config'
export const MODELS = {
  anthropic: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5'],
  openai: ['gpt-5.4', 'gpt-4o-mini'],
  google: ['gemini-2.5-pro', 'gemini-2.0-flash'],
} as const

const DEFAULT: ModelConfig = { provider: 'anthropic', model: 'claude-sonnet-4-6', apiKey: '' }

export function useModelConfig() {
  const [config, setConfig] = useState<ModelConfig>(DEFAULT)
  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setConfig(JSON.parse(s)) } catch {}
  }, [])
  const save = (c: ModelConfig) => { setConfig(c); localStorage.setItem(KEY, JSON.stringify(c)) }
  return { config, save }
}
```

**Create src/components/settings/SettingsModal.tsx**
```tsx
'use client'
import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { MODELS, useModelConfig } from '@/hooks/useModelConfig'
import type { ModelConfig } from '@/lib/types'

export function SettingsModal() {
  const { config, save } = useModelConfig()
  const [draft, setDraft] = useState<ModelConfig>(config)
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>AI Model Settings</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={draft.provider} onValueChange={v =>
              setDraft(d => ({ ...d, provider: v as ModelConfig['provider'], model: MODELS[v as keyof typeof MODELS][0] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(MODELS) as (keyof typeof MODELS)[]).map(p =>
                  <SelectItem key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={draft.model} onValueChange={v => setDraft(d => ({ ...d, model: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODELS[draft.provider].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input type="password" placeholder={`${draft.provider} API key`}
              value={draft.apiKey} onChange={e => setDraft(d => ({ ...d, apiKey: e.target.value }))} />
            <p className="text-xs text-muted-foreground">Stored in your browser only. Never sent to our servers.</p>
          </div>
          <Button className="w-full" onClick={() => save(draft)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Commit**
```bash
git add src/ && git commit -m "feat: settings modal with BYOK model selection"
```

---

## Task 11: Results components

**Create src/components/results/RiskScore.tsx**
```tsx
import type { AnalysisReport } from '@/lib/types'
import { cn } from '@/lib/utils'

const CONFIG = {
  green:  { color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', light: '🟢', label: 'Low Risk' },
  yellow: { color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',       light: '🟡', label: 'Suspicious' },
  red:    { color: 'text-red-400 border-red-500/30 bg-red-500/10',             light: '🔴', label: 'High Risk — Likely Scam' },
}

export function RiskScore({ report }: { report: AnalysisReport }) {
  const { color, light, label } = CONFIG[report.riskLevel]
  return (
    <div className={cn('rounded-xl border p-6 text-center', color)}>
      <div className="text-4xl mb-2">{light}</div>
      <div className="text-2xl font-bold">{label}</div>
      <div className="text-5xl font-mono font-black my-3">{report.score}<span className="text-2xl">/100</span></div>
      <p className="text-sm opacity-80">{report.summary}</p>
    </div>
  )
}
```

**Create src/components/results/CheckCard.tsx**
```tsx
import type { CheckResult } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const S = {
  pass:  { icon: '✅', label: 'Pass',  cls: 'border-emerald-500/20 bg-emerald-500/5' },
  warn:  { icon: '⚠️', label: 'Warn',  cls: 'border-amber-500/20 bg-amber-500/5' },
  fail:  { icon: '🔴', label: 'Fail',  cls: 'border-red-500/20 bg-red-500/5' },
  error: { icon: '⚫', label: 'Error', cls: 'border-zinc-500/20 bg-zinc-500/5' },
}

export function CheckCard({ check }: { check: CheckResult }) {
  const { icon, label, cls } = S[check.status]
  return (
    <Card className={cn('border', cls)}>
      <CardContent className="p-4 flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{check.label}</span>
            <Badge variant="outline" className="text-xs">{label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{check.detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Create src/components/results/ReportView.tsx**
```tsx
import type { AnalysisReport } from '@/lib/types'
import { RiskScore } from './RiskScore'
import { CheckCard } from './CheckCard'

export function ReportView({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-4 mt-4">
      <RiskScore report={report} />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Check Details</p>
      {report.checks.map(c => <CheckCard key={c.id} check={c} />)}
    </div>
  )
}
```

**Commit**
```bash
git add src/components/results/ && git commit -m "feat: RiskScore, CheckCard, ReportView components"
```

---

## Task 12: Mode components + main page

**Create src/hooks/useAnalysis.ts**
```typescript
'use client'
import { useState } from 'react'
import type { AnalysisReport, ModelConfig } from '@/lib/types'

export function useAnalysis(endpoint: string) {
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze(payload: Record<string, unknown>, modelConfig: ModelConfig) {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/analyze/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, modelConfig }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setReport(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return { report, loading, error, analyze }
}
```

**Create src/components/modes/EmailMode.tsx**
```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'

export function EmailMode() {
  const [sender, setSender] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [headers, setHeaders] = useState('')
  const [showHeaders, setShowHeaders] = useState(false)
  const { report, loading, error, analyze } = useAnalysis('email')
  const { config } = useModelConfig()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Fra (e-postadresse)</Label>
          <Textarea className="h-12 resize-none" placeholder="scammer@suspicious-domain.com" value={sender} onChange={e => setSender(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Emne</Label>
          <Textarea className="h-12 resize-none" placeholder="Du har vunnet $1,000,000!" value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>E-postinnhold</Label>
        <Textarea className="h-40 resize-y" placeholder="Lim inn hele e-posten her..." value={body} onChange={e => setBody(e.target.value)} />
      </div>
      <div>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowHeaders(v => !v)}>
          {showHeaders ? '▾' : '▸'} Lim inn e-posthoder (valgfritt — for SPF/DKIM-sjekk)
        </button>
        {showHeaders && (
          <Textarea className="mt-2 h-28 font-mono text-xs resize-y"
            placeholder="Received: from mail.example.com..." value={headers} onChange={e => setHeaders(e.target.value)} />
        )}
      </div>
      <Button className="w-full" disabled={loading || !body}
        onClick={() => { if (!config.apiKey) { alert('Legg til API-nøkkel i innstillinger'); return }
          analyze({ sender, subject, emailBody: body, headers: headers || undefined }, config) }}>
        {loading ? 'Analyserer...' : 'Analyser e-post'}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {report && <ReportView report={report} />}
    </div>
  )
}
```

**Create src/components/modes/ImageMode.tsx**
```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'

export function ImageMode() {
  const [imageUrl, setImageUrl] = useState('')
  const { report, loading, error, analyze } = useAnalysis('image')
  const { config } = useModelConfig()
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Bilde-URL eller QR-kode URL</Label>
        <Textarea className="h-16 resize-none font-mono text-sm"
          placeholder="https://example.com/profile.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
        <p className="text-xs text-muted-foreground">Lim inn en direkte bilde-URL. Bing søker etter kopier av dette bildet.</p>
      </div>
      <Button className="w-full" disabled={loading || !imageUrl} onClick={() => analyze({ imageUrl }, config)}>
        {loading ? 'Søker...' : 'Sjekk bilde'}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {report && <ReportView report={report} />}
    </div>
  )
}
```

**Create src/components/modes/NameMode.tsx**
```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'

export function NameMode() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [context, setContext] = useState('')
  const { report, loading, error, analyze } = useAnalysis('name')
  const { config } = useModelConfig()
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Avsendernavn</Label>
        <Textarea className="h-12 resize-none" placeholder="f.eks. Dr. James Wilson, Agent Sarah Johnson..." value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>E-postadresse (valgfritt)</Label>
        <Textarea className="h-12 resize-none font-mono text-sm" placeholder="sender@domain.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Kontekst (valgfritt)</Label>
        <Textarea className="h-20 resize-y" placeholder="Hva påstår de? f.eks. 'FN-offiser med lotterigevinst'" value={context} onChange={e => setContext(e.target.value)} />
      </div>
      <Button className="w-full" disabled={loading || !name}
        onClick={() => { if (!config.apiKey) { alert('Legg til API-nøkkel i innstillinger'); return }
          analyze({ name, email: email || undefined, context: context || undefined }, config) }}>
        {loading ? 'Søker...' : 'Søk navn'}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {report && <ReportView report={report} />}
    </div>
  )
}
```

**Replace src/app/page.tsx**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { EmailMode } from '@/components/modes/EmailMode'
import { ImageMode } from '@/components/modes/ImageMode'
import { NameMode } from '@/components/modes/NameMode'

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🐾 Scam Sniffr</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Analyser mistenkelige e-poster, bilder og avsendere</p>
          </div>
          <SettingsModal />
        </div>
        <Tabs defaultValue="email">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="email">📧 E-post</TabsTrigger>
            <TabsTrigger value="image">🖼️ Bilde / QR</TabsTrigger>
            <TabsTrigger value="name">🔍 Navn</TabsTrigger>
          </TabsList>
          <TabsContent value="email"><EmailMode /></TabsContent>
          <TabsContent value="image"><ImageMode /></TabsContent>
          <TabsContent value="name"><NameMode /></TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
```

**Verify dev server**
```bash
npm run dev
```
Check:
- [ ] Dark page loads at http://localhost:3000
- [ ] Three tabs visible
- [ ] Settings gear opens modal with provider/model/API key
- [ ] No console errors

**Run all tests**
```bash
npm run test:run
```
Expected: all pass.

**Commit**
```bash
git add -A && git commit -m "feat: mode components, main page — v1 complete"
```

---

## Task 13: Deploy to Vercel

**Step 1: Install Vercel CLI**
```bash
npm i -g vercel
```

**Step 2: Link and add env vars**
```bash
vercel link
vercel env add GOOGLE_SAFE_BROWSING_KEY
vercel env add EMAILREP_KEY
vercel env add BING_SEARCH_KEY
```

**Step 3: Deploy**
```bash
vercel deploy --prod
```

**Step 4: Smoke test on prod URL**
- Open Settings → add your AI API key
- Paste a real phishing email → verify full report appears
- Check all 3 tabs work

**Step 5: Push**
```bash
git push
```

---

## Checklist

- [ ] Task 1: Next.js scaffold + Vitest
- [ ] Task 2: shadcn/ui + Geist + dark mode
- [ ] Task 3: Types + scoring logic (TDD)
- [ ] Task 4: Lookalike domain detector (TDD)
- [ ] Task 5: Email header parser (TDD)
- [ ] Task 6: Extractors — URL, phone, crypto (TDD)
- [ ] Task 7: External API wrappers (Safe Browsing, WHOIS, EmailRep, Bing)
- [ ] Task 8: AI analysis module (multi-provider)
- [ ] Task 9: API routes (email, image, name)
- [ ] Task 10: Settings modal (BYOK)
- [ ] Task 11: Results components (RiskScore, CheckCard, ReportView)
- [ ] Task 12: Mode components + main page
- [ ] Task 13: Deploy to Vercel
