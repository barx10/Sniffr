import type { CheckResult } from '@/lib/types'

export async function checkReverseImage(imageUrl: string, apiKey: string): Promise<CheckResult> {
  if (!imageUrl) return { id:'reverse-image', label:'Reverse Image Search', status:'error', weight:20, detail:'No image URL provided' }
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
      return { id:'reverse-image', label:'Reverse Image Search', status:'warn', weight:20,
        detail:`Image found on ${pages.length} other page(s) — may be stolen`, data: pages.slice(0,5) }
    return { id:'reverse-image', label:'Reverse Image Search', status:'pass', weight:20, detail:'Image not found elsewhere — appears original' }
  } catch {
    return { id:'reverse-image', label:'Reverse Image Search', status:'error', weight:20, detail:'Bing Visual Search unavailable' }
  }
}
