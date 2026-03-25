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
