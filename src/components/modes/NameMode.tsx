'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NameMode() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [context, setContext] = useState('')
  const { report, loading, error, analyze } = useAnalysis('name')
  const { config } = useModelConfig()

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Sjekk en avsender — navn, e-postadresse eller begge. AI analyserer om de kjennetegner kjente svindelmønstre.
      </p>

      <div className="space-y-2">
        <label className="field-label block">Navn</label>
        <Textarea
          className="h-11 resize-none text-sm bg-background/60 border-border/80 focus:border-amber-500/60 focus:ring-amber-500/20 transition-colors"
          placeholder="f.eks. Dr. James Wilson, Agent Sarah Johnson..."
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="field-label block">E-postadresse <span className="normal-case tracking-normal font-normal opacity-60 text-xs">(valgfritt)</span></label>
        <Textarea
          className="h-11 resize-none font-mono text-sm bg-background/60 border-border/80 focus:border-amber-500/60 focus:ring-amber-500/20 transition-colors"
          placeholder="sender@domain.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="field-label block">Kontekst <span className="normal-case tracking-normal font-normal opacity-60 text-xs">(valgfritt)</span></label>
        <Textarea
          className="h-20 resize-y text-sm leading-relaxed bg-background/60 border-border/80 focus:border-amber-500/60 focus:ring-amber-500/20 transition-colors"
          placeholder="Hva påstår de? f.eks. 'FN-offiser med lotterigevinst til deg'"
          value={context}
          onChange={e => setContext(e.target.value)}
        />
      </div>

      <Button
        className={cn(
          'w-full h-12 font-display font-bold tracking-[0.15em] text-sm uppercase',
          loading && 'btn-scanning'
        )}
        disabled={loading || !name.trim()}
        onClick={() => {
          if (!config.apiKey) { alert('Legg til API-nøkkel i innstillinger'); return }
          analyze({ name, email: email || undefined, context: context || undefined }, config)
        }}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Søker...</>
          : 'Søk opp avsender'
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
          Analyserer med AI...
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">{error}</p>
      )}
      {report && <ReportView report={report} />}
    </div>
  )
}
