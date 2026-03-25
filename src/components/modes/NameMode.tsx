'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'
import { cn } from '@/lib/utils'

export function NameMode() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [context, setContext] = useState('')
  const { report, loading, error, analyze } = useAnalysis('name')
  const { config } = useModelConfig()

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="field-label block">Avsendernavn</label>
        <Textarea
          className="h-11 resize-none text-xs bg-background/60 border-border/60 focus:border-amber-500/50 focus:ring-amber-500/20 transition-colors"
          placeholder="f.eks. Dr. James Wilson, Agent Sarah Johnson..."
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="field-label block">E-postadresse <span className="normal-case tracking-normal font-normal opacity-50">(valgfritt)</span></label>
        <Textarea
          className="h-11 resize-none font-mono text-xs bg-background/60 border-border/60 focus:border-amber-500/50 focus:ring-amber-500/20 transition-colors"
          placeholder="sender@domain.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="field-label block">Kontekst <span className="normal-case tracking-normal font-normal opacity-50">(valgfritt)</span></label>
        <Textarea
          className="h-20 resize-y text-xs leading-relaxed bg-background/60 border-border/60 focus:border-amber-500/50 focus:ring-amber-500/20 transition-colors"
          placeholder="Hva påstår de? f.eks. 'FN-offiser med lotterigevinst til deg'"
          value={context}
          onChange={e => setContext(e.target.value)}
        />
      </div>

      <Button
        className={cn(
          'w-full h-11 font-display font-bold tracking-[0.15em] text-xs uppercase',
          loading && 'btn-scanning'
        )}
        disabled={loading || !name}
        onClick={() => {
          if (!config.apiKey) { alert('Legg til API-nøkkel i innstillinger'); return }
          analyze({ name, email: email || undefined, context: context || undefined }, config)
        }}
      >
        {loading ? 'Søker...' : 'Søk navn'}
      </Button>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}
      {report && <ReportView report={report} />}
    </div>
  )
}
