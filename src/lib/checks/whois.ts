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
