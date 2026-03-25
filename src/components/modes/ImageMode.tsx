'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'
import { cn } from '@/lib/utils'

export function ImageMode() {
  const [imageUrl, setImageUrl] = useState('')
  const { report, loading, error, analyze } = useAnalysis('image')
  const { config } = useModelConfig()

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="field-label block">Bilde-URL</label>
        <Textarea
          className="h-16 resize-none font-mono text-xs bg-background/60 border-border/60 focus:border-amber-500/50 focus:ring-amber-500/20 transition-colors"
          placeholder="https://example.com/profile-photo.jpg"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground tracking-wide">
          Bing søker etter dette bildet på tvers av nettet. Fungerer også for QR-kode-URLer.
        </p>
      </div>

      <Button
        className={cn(
          'w-full h-11 font-display font-bold tracking-[0.15em] text-xs uppercase',
          loading && 'btn-scanning'
        )}
        disabled={loading || !imageUrl}
        onClick={() => analyze({ imageUrl }, config)}
      >
        {loading ? 'Søker...' : 'Sjekk bilde'}
      </Button>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}
      {report && <ReportView report={report} />}
    </div>
  )
}
