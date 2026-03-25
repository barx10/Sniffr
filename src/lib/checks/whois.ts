import type { CheckResult } from '@/lib/types'

export async function checkDomainAge(domain: string): Promise<CheckResult> {
  if (!domain) return { id:'domain-age', label:'Domenealder', status:'error', weight:15, detail:'Ingen domene oppgitt' }
  try {
    const res = await fetch(`https://www.whoisjsonapi.com/v1/${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/json' },
    })
    const data = await res.json()
    const created = data?.domain?.created_date ?? data?.created_date
    if (!created) return { id:'domain-age', label:'Domenealder', status:'warn', weight:15, detail:'Kunne ikke fastslå domenealder' }
    const days = Math.floor((Date.now() - new Date(created).getTime()) / 86_400_000)
    if (days < 30) return { id:'domain-age', label:'Domenealder', status:'fail', weight:15, detail:`Domenet ble registrert for bare ${days} dager siden` }
    if (days < 180) return { id:'domain-age', label:'Domenealder', status:'warn', weight:15, detail:`Domenet er ${days} dager gammelt — relativt nytt` }
    return { id:'domain-age', label:'Domenealder', status:'pass', weight:15, detail:`Domenet er ${Math.floor(days/365)} år gammelt` }
  } catch {
    return { id:'domain-age', label:'Domenealder', status:'error', weight:15, detail:'WHOIS-oppslag mislyktes' }
  }
}
