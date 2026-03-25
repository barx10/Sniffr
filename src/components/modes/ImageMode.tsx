'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ImageMode() {
  const [imageUrl, setImageUrl] = useState('')
  const { report, loading, error, analyze } = useAnalysis('image')
  const { config } = useModelConfig()

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Lim inn en direkte bilde-URL. Bing søker etter kopier av bildet på tvers av nettet — avslører om profil­bildet er stjålet.
      </p>

      <div className="space-y-2">
        <label className="field-label block">Bilde-URL</label>
        <Textarea
          className="h-16 resize-none font-mono text-sm bg-background/60 border-border/80 focus:border-amber-500/60 focus:ring-amber-500/20 transition-colors"
          placeholder="https://example.com/profile-photo.jpg"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
        />
      </div>

      <Button
        className={cn(
          'w-full h-12 font-display font-bold tracking-[0.15em] text-sm uppercase',
          loading && 'btn-scanning'
        )}
        disabled={loading || !imageUrl.trim()}
        onClick={() => analyze({ imageUrl }, config)}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Søker...</>
          : 'Sjekk bilde'
        }
      </Button>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground animate-fade-in-up">
          <div className="flex gap-1">
            {[0, 150, 300].map(delay => (
              <span key={delay} className="w-1.5 h-1.5 rounded-full bg-amber-500 bounce-dot"
                style={{ animationDelay: `${delay}ms` }} />
            ))}
          </div>
          Søker i Bing bildedatabase...
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">{error}</p>
      )}
      {report && <ReportView report={report} />}
    </div>
  )
}
