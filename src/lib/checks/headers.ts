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
