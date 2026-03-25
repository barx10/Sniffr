# Scam Sniffr — Design Document
_2026-03-25_

## Overview

A web app for analyzing suspected scam and phishing emails. Users paste email content,
images, or sender names into one of three focused analysis modes and receive a structured
risk report with a traffic-light score and per-check breakdown.

Personal use initially; designed BYOK-first so it can be shared publicly at no cost to
the operator.

---

## Analysis Modes

### 1. E-post (Email)

**Input:** Sender name, sender address, subject, body text, and optionally full email headers.

**Checks (run in parallel):**

| Check | Tool | Notes |
|-------|------|-------|
| Content analysis | Claude / GPT / Gemini | Tone, urgency, vague promises, love bombing, nomination fraud, advance fee, crypto/gift card mentions |
| URL safety | Google Safe Browsing API | All URLs extracted from body |
| Domain age | WHOIS (free: whoisjson.com) | Sender domain + linked domains; flag if < 30 days old |
| Domain reputation | EmailRep.io (freemium) | Blacklist, spam history, malicious flag |
| Header analysis | Parsed client-side | SPF/DKIM/DMARC pass/fail, originating IP reputation (ip-api.com) |
| Lookalike domains | Local heuristic + AI | Typosquatting detection (amaz0n, paypa1, etc.) |
| Crypto/gift card flag | Regex + AI confirmation | Automatic red flag on Bitcoin, Ethereum, iTunes, Google Play mentions |
| Phone number extraction | Regex | Extract phone numbers, flag for manual lookup |

### 2. Bilde / QR-kode (Image / QR)

**Input:** Image URL paste or file upload.

**Checks (run in parallel):**

| Check | Tool | Notes |
|-------|------|-------|
| Reverse image search | Bing Visual Search API (Azure free tier, 1000/mnd) | Is the profile picture stolen? |
| QR code URL extraction | Client-side decoder | Extract URL from QR code image |
| QR URL safety | Google Safe Browsing | Check extracted URL |

### 3. Navnesøk (Name Search)

**Input:** Sender's name (free text).

**Checks:**

| Check | Tool | Notes |
|-------|------|-------|
| Scam identity patterns | AI (configured model) | Cross-check against known scam archetypes |
| Domain/email reputation | EmailRep.io | If email address provided |

---

## Results Format

Every analysis returns:

```
┌─────────────────────────────────┐
│  🔴 HIGH RISK  —  Score: 87/100 │
└─────────────────────────────────┘

Per-check breakdown cards:
  ✅ Domain age: 4 years — OK
  🔴 Safe Browsing: 1 URL flagged as phishing
  🟡 Content: High urgency language, vague prize claim
  🔴 Crypto mention: Bitcoin wallet address found
  ✅ SPF/DKIM: Pass
  🔴 Lookalike domain: "paypa1-billing.com"
```

Traffic light thresholds:
- 🟢 Green: 0–30 (low risk)
- 🟡 Yellow: 31–65 (suspicious)
- 🔴 Red: 66–100 (high risk / likely scam)

Score is calculated server-side based on weighted check results, confirmed by AI.

---

## Settings Panel

Accessible via gear icon. Stored in `localStorage` only — never persisted server-side.

| Setting | Options |
|---------|---------|
| AI Provider | Anthropic Claude / OpenAI / Google Gemini |
| Model | Per-provider dropdown (e.g. claude-sonnet-4-6, gpt-5.4, gemini-2.5-pro) |
| API Key | Text input per provider |

API keys are sent only to the Vercel API route for the active request and never logged.

---

## Technical Architecture

### Stack

- **Framework:** Next.js 16 (App Router)
- **Hosting:** Vercel (Fluid Compute)
- **UI:** shadcn/ui + Tailwind CSS + Geist font, dark mode
- **AI:** Vercel AI SDK + AI Gateway (BYOK via user-supplied key in request header)
- **Storage:** None — fully stateless
- **Auth:** None

### File Structure

```
/
├── app/
│   ├── page.tsx                  — Main UI (mode tabs + input forms)
│   ├── layout.tsx
│   └── api/
│       ├── analyze/
│       │   ├── email/route.ts    — Parallel: AI + Safe Browsing + WHOIS + EmailRep + Headers
│       │   ├── image/route.ts    — Bing Visual Search + QR decode + Safe Browsing
│       │   └── name/route.ts     — AI + EmailRep
├── components/
│   ├── modes/
│   │   ├── EmailMode.tsx
│   │   ├── ImageMode.tsx
│   │   └── NameMode.tsx
│   ├── results/
│   │   ├── RiskScore.tsx         — Traffic light + score
│   │   ├── CheckCard.tsx         — Individual check result card
│   │   └── ReportView.tsx        — Full report layout
│   └── settings/
│       └── SettingsModal.tsx     — Model selector + API key input
├── lib/
│   ├── checks/
│   │   ├── safe-browsing.ts
│   │   ├── whois.ts
│   │   ├── emailrep.ts
│   │   ├── headers.ts
│   │   ├── lookalike.ts
│   │   ├── bing-image.ts
│   │   └── qr-decode.ts
│   ├── ai.ts                     — AI SDK wrapper (model from request)
│   └── scoring.ts                — Weighted score calculation
└── docs/plans/
    └── 2026-03-25-scam-sniffr-design.md
```

### API Route Pattern

Each route receives the input + model config from the client, fans out all checks with
`Promise.allSettled`, feeds results to AI for interpretation, and returns a structured
JSON report. Failed checks are shown as "unavailable" rather than crashing the report.

### External APIs (all free tier)

| API | Purpose | Key source |
|-----|---------|-----------|
| Google Safe Browsing v4 | URL threat check | Google Cloud Console |
| whoisjson.com | Domain age lookup | No key required |
| EmailRep.io | Domain/email reputation | Free API key |
| Bing Visual Search (Azure) | Reverse image search | Azure free tier (1000/mnd) |
| ip-api.com | IP reputation (headers) | No key required |

---

## BYOK / Future Multi-User Extension

When expanding to other users:
- Settings modal already handles per-user API keys (stored in their localStorage)
- No server-side key storage needed
- Rate limiting via Vercel Edge middleware (per-IP)
- Optional: Vercel KV for lightweight usage tracking

---

## Out of Scope (v1)

- User accounts / auth
- Analysis history / persistence
- SMS/WhatsApp analysis
- Deepfake detection
- Attachment scanning
