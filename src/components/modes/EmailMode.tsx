'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmailMode() {
  const [sender, setSender] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [headers, setHeaders] = useState('')
  const [showHeaders, setShowHeaders] = useState(false)
  const { report, loading, error, analyze } = useAnalysis('email')
  const { config } = useModelConfig()

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="field-label block">Fra</label>
          <Textarea
            className="h-11 resize-none font-mono text-xs bg-background/60 border-border/60 focus:border-amber-500/50 focus:ring-amber-500/20 transition-colors"
            placeholder="scammer@suspicious.com"
            value={sender}
            onChange={e => setSender(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="field-label block">Emne</label>
          <Textarea
            className="h-11 resize-none text-xs bg-background/60 border-border/60 focus:border-amber-500/50 focus:ring-amber-500/20 transition-colors"
            placeholder="Du har vunnet $1,000,000!"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="field-label block">E-postinnhold</label>
        <Textarea
          className="h-40 resize-y text-xs leading-relaxed bg-background/60 border-border/60 focus:border-amber-500/50 focus:ring-amber-500/20 transition-colors"
          placeholder="Lim inn hele e-posten her..."
          value={body}
          onChange={e => setBody(e.target.value)}
        />
      </div>

      <div>
        <button
          className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase font-semibold text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowHeaders(v => !v)}
        >
          {showHeaders ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          E-posthoder — SPF / DKIM / DMARC
        </button>
        {showHeaders && (
          <Textarea
            className="mt-3 h-28 font-mono text-xs resize-y bg-background/60 border-border/60 focus:border-amber-500/50 focus:ring-amber-500/20 transition-colors"
            placeholder="Received: from mail.example.com..."
            value={headers}
            onChange={e => setHeaders(e.target.value)}
          />
        )}
      </div>

      <Button
        className={cn(
          'w-full h-11 font-display font-bold tracking-[0.15em] text-xs uppercase',
          loading && 'btn-scanning'
        )}
        disabled={loading || !body}
        onClick={() => {
          if (!config.apiKey) { alert('Legg til API-nøkkel i innstillinger'); return }
          analyze({ sender, subject, emailBody: body, headers: headers || undefined }, config)
        }}
      >
        {loading ? 'Analyserer...' : 'Analyser e-post'}
      </Button>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}
      {report && <ReportView report={report} />}
    </div>
  )
}
