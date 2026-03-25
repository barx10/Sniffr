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
