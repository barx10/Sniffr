'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmailMode() {
  const [sender, setSender] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [headers, setHeaders] = useState('')
  const [showHeaders, setShowHeaders] = useState(false)
  const { report, loading, error, analyze } = useAnalysis('email')
  const { config } = useModelConfig()

  const hasContent = !!(sender.trim() || body.trim())

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Lim inn e-post, SMS, WhatsApp-melding eller annen mistenkelig tekst. Alle felt er valgfrie — analysen tilpasses det du har.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="field-label block">Avsender</label>
          <Textarea
            className="h-11 resize-none font-mono text-sm bg-background/60 border-border/80 focus:border-amber-500/60 focus:ring-amber-500/20 transition-colors"
            placeholder="navn@domene.no"
            value={sender}
            onChange={e => setSender(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="field-label block">Emne / tittel</label>
          <Textarea
            className="h-11 resize-none text-sm bg-background/60 border-border/80 focus:border-amber-500/60 focus:ring-amber-500/20 transition-colors"
            placeholder="Du har vunnet $1,000,000!"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="field-label block">Meldingsinnhold</label>
        <Textarea
          className="h-40 resize-y text-sm leading-relaxed bg-background/60 border-border/80 focus:border-amber-500/60 focus:ring-amber-500/20 transition-colors"
          placeholder="Lim inn hele meldingen her — e-post, SMS, WhatsApp, sosiale medier..."
          value={body}
          onChange={e => setBody(e.target.value)}
        />
      </div>

      <div>
        <button
          className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowHeaders(v => !v)}
        >
          {showHeaders ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          E-posthoder — SPF / DKIM / DMARC
        </button>
        {showHeaders && (
          <Textarea
            className="mt-3 h-28 font-mono text-xs resize-y bg-background/60 border-border/80 focus:border-amber-500/60 transition-colors"
            placeholder="Received: from mail.example.com..."
            value={headers}
            onChange={e => setHeaders(e.target.value)}
          />
        )}
      </div>

      <Button
        className={cn(
          'w-full h-12 font-display font-bold tracking-[0.15em] text-sm uppercase',
          loading && 'btn-scanning'
        )}
        disabled={loading || !hasContent}
        onClick={() => {
          if (!config.apiKey) { alert('Legg til API-nøkkel i innstillinger'); return }
          analyze({ sender, subject, emailBody: body, headers: headers || undefined }, config)
        }}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyserer...</>
          : 'Analyser melding'
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
          Kjører sjekker — typisk 5–15 sekunder
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">{error}</p>
      )}
      {report && <ReportView report={report} />}
    </div>
  )
}
