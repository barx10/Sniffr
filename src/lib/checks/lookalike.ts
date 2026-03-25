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
    const norm = base.replace(/4/g,'a').replace(/3/g,'e').replace(/1/g,'l').replace(/0/g,'o').replace(/5/g,'s')
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
