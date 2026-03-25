import type { CheckResult } from '@/lib/types'

export async function checkEmailRep(email: string, apiKey: string): Promise<CheckResult> {
  if (!email) return { id:'emailrep', label:'E-postrykte', status:'error', weight:20, detail:'Ingen e-post oppgitt' }
  try {
    const res = await fetch(`https://emailrep.io/${encodeURIComponent(email)}`, {
      headers: { Key: apiKey, 'User-Agent': 'scam-sniffr' },
    })
    const data = await res.json()
    if (data.suspicious || data.details?.malicious_activity)
      return { id:'emailrep', label:'E-postrykte', status:'fail', weight:20,
        detail:`Flagget som mistenkelig. Rykte: ${data.reputation ?? 'ukjent'}`, data }
    if (data.reputation === 'none' || !data.details?.profiles?.length)
      return { id:'emailrep', label:'E-postrykte', status:'warn', weight:20, detail:'Ingen rykte-data — avsender har ingen kjent nettilstedeværelse' }
    return { id:'emailrep', label:'E-postrykte', status:'pass', weight:20, detail:`Rykte: ${data.reputation}` }
  } catch {
    return { id:'emailrep', label:'E-postrykte', status:'error', weight:20, detail:'EmailRep utilgjengelig' }
  }
}
