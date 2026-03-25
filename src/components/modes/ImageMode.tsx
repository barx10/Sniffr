'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'

export function ImageMode() {
  const [imageUrl, setImageUrl] = useState('')
  const { report, loading, error, analyze } = useAnalysis('image')
  const { config } = useModelConfig()
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Bilde-URL eller QR-kode URL</Label>
        <Textarea className="h-16 resize-none font-mono text-sm"
          placeholder="https://example.com/profile.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
        <p className="text-xs text-muted-foreground">Lim inn en direkte bilde-URL. Bing søker etter kopier av dette bildet.</p>
      </div>
      <Button className="w-full" disabled={loading || !imageUrl} onClick={() => analyze({ imageUrl }, config)}>
        {loading ? 'Søker...' : 'Sjekk bilde'}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {report && <ReportView report={report} />}
    </div>
  )
}
