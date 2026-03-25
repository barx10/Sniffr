import type { CheckResult } from '@/lib/types'

export async function checkReverseImage(imageUrl: string, apiKey: string): Promise<CheckResult> {
  if (!imageUrl) return { id:'reverse-image', label:'Omvendt bildesøk', status:'error', weight:20, detail:'Ingen bilde-URL oppgitt' }
  try {
    const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [{ type: 'WEB_DETECTION', maxResults: 10 }],
        }],
      }),
    })
    const data = await res.json()
    const detection = data.responses?.[0]?.webDetection

    if (!detection)
      return { id:'reverse-image', label:'Omvendt bildesøk', status:'error', weight:20, detail:'Ingen respons fra Vision API' }

    const pages: { url: string }[] = detection.pagesWithMatchingImages ?? []
    const fullMatches: { url: string }[] = detection.fullMatchingImages ?? []

    if (fullMatches.length > 0)
      return { id:'reverse-image', label:'Omvendt bildesøk', status:'warn', weight:20,
        detail:`Nøyaktig kopi funnet på ${fullMatches.length} side(r) — bildet sirkulerer på nettet`,
        data: fullMatches.slice(0, 5) }

    if (pages.length > 0)
      return { id:'reverse-image', label:'Omvendt bildesøk', status:'warn', weight:20,
        detail:`Bildet funnet på ${pages.length} andre side(r) — kan være stjålet`,
        data: pages.slice(0, 5) }

    return { id:'reverse-image', label:'Omvendt bildesøk', status:'pass', weight:20,
      detail:'Bildet ikke funnet andre steder — ser originalt ut' }
  } catch {
    return { id:'reverse-image', label:'Omvendt bildesøk', status:'error', weight:20, detail:'Google Vision API utilgjengelig' }
  }
}
