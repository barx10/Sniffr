import { promises as dns } from 'dns'
import type { CheckResult } from '@/lib/types'

const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.org', 'guerrillamail.net',
  'guerrillamail.de', 'guerrillamail.biz', 'guerrillamail.info', 'grr.la',
  'sharklasers.com', 'spam4.me', 'yopmail.com', 'trashmail.com', 'trashmail.me',
  'trashmail.net', 'dispostable.com', 'maildrop.cc', 'mailnull.com',
  'spamgourmet.com', 'tempr.email', 'discard.email', 'fakeinbox.com',
  'throwaway.email', 'temp-mail.org', 'getairmail.com', 'filzmail.com',
  'tempemail.net', 'throwam.com', 'spamfree24.org', 'spamfree24.de',
])

export async function checkMxRecord(email: string): Promise<CheckResult> {
  if (!email) return { id:'mx-record', label:'E-postdomene', status:'error', weight:20, detail:'Ingen e-post oppgitt' }

  const domain = (email.includes('@') ? email.split('@')[1] : email).toLowerCase()

  if (DISPOSABLE.has(domain))
    return { id:'mx-record', label:'E-postdomene', status:'fail', weight:20,
      detail:`Engangs-e-postdomene: ${domain} — typisk brukt for å skjule identitet` }

  try {
    const records = await dns.resolveMx(domain)

    if (!records.length)
      return { id:'mx-record', label:'E-postdomene', status:'fail', weight:20,
        detail:`${domain} har ingen e-postserver — domenet kan ikke motta e-post` }

    const top = records.sort((a, b) => a.priority - b.priority)[0].exchange.toLowerCase()
    const knownProvider =
      top.includes('google') ? 'Google Workspace' :
      top.includes('outlook') || top.includes('microsoft') ? 'Microsoft 365' :
      top.includes('yahoo') ? 'Yahoo' :
      top.includes('protonmail') ? 'Proton Mail' :
      top.includes('apple') ? 'Apple' : null

    if (knownProvider)
      return { id:'mx-record', label:'E-postdomene', status:'pass', weight:20,
        detail:`${domain} bruker ${knownProvider}` }

    return { id:'mx-record', label:'E-postdomene', status:'pass', weight:20,
      detail:`${domain} har gyldig e-postserver (${top})` }
  } catch {
    return { id:'mx-record', label:'E-postdomene', status:'warn', weight:20,
      detail:`Kunne ikke verifisere e-postdomene ${domain}` }
  }
}
