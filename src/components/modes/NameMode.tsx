'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'

export function NameMode() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [context, setContext] = useState('')
  const { report, loading, error, analyze } = useAnalysis('name')
  const { config } = useModelConfig()
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Avsendernavn</Label>
        <Textarea className="h-12 resize-none" placeholder="f.eks. Dr. James Wilson, Agent Sarah Johnson..." value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>E-postadresse (valgfritt)</Label>
        <Textarea className="h-12 resize-none font-mono text-sm" placeholder="sender@domain.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Kontekst (valgfritt)</Label>
        <Textarea className="h-20 resize-y" placeholder="Hva påstår de? f.eks. 'FN-offiser med lotterigevinst'" value={context} onChange={e => setContext(e.target.value)} />
      </div>
      <Button className="w-full" disabled={loading || !name}
        onClick={() => {
          if (!config.apiKey) { alert('Legg til API-nøkkel i innstillinger'); return }
          analyze({ name, email: email || undefined, context: context || undefined }, config)
        }}>
        {loading ? 'Søker...' : 'Søk navn'}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {report && <ReportView report={report} />}
    </div>
  )
}
