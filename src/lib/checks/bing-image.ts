import type { CheckResult } from '@/lib/types'

export async function checkReverseImage(imageUrl: string, apiKey: string): Promise<CheckResult> {
  if (!imageUrl) return { id:'reverse-image', label:'Omvendt bildesøk', status:'error', weight:20, detail:'Ingen bilde-URL oppgitt' }
  try {
    const knowledgeRequest = JSON.stringify({ imageInfo: { url: imageUrl } })
    const res = await fetch('https://api.bing.microsoft.com/v7.0/images/visualsearch?mkt=en-US', {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `knowledgeRequest=${encodeURIComponent(knowledgeRequest)}`,
    })
    const data = await res.json()
    const pages = (data.tags ?? [])
      .flatMap((t: {actions: unknown[]}) => t.actions)
      .filter((a: {actionType: string}) => a.actionType === 'PagesIncluding')
      .flatMap((a: {data: {value: {hostPageUrl: string}[]}}) => a.data?.value ?? [])
    if (pages.length > 0)
      return { id:'reverse-image', label:'Omvendt bildesøk', status:'warn', weight:20,
        detail:`Bildet funnet på ${pages.length} andre side(r) — kan være stjålet`, data: pages.slice(0,5) }
    return { id:'reverse-image', label:'Omvendt bildesøk', status:'pass', weight:20, detail:'Bildet ikke funnet andre steder — ser originalt ut' }
  } catch {
    return { id:'reverse-image', label:'Omvendt bildesøk', status:'error', weight:20, detail:'Bing bildesøk utilgjengelig' }
  }
}
