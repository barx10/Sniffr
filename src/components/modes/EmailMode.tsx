'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ReportView } from '@/components/results/ReportView'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useModelConfig } from '@/hooks/useModelConfig'

export function EmailMode() {
  const [sender, setSender] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [headers, setHeaders] = useState('')
  const [showHeaders, setShowHeaders] = useState(false)
  const { report, loading, error, analyze } = useAnalysis('email')
  const { config } = useModelConfig()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Fra (e-postadresse)</Label>
          <Textarea className="h-12 resize-none" placeholder="scammer@suspicious-domain.com" value={sender} onChange={e => setSender(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Emne</Label>
          <Textarea className="h-12 resize-none" placeholder="Du har vunnet $1,000,000!" value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>E-postinnhold</Label>
        <Textarea className="h-40 resize-y" placeholder="Lim inn hele e-posten her..." value={body} onChange={e => setBody(e.target.value)} />
      </div>
      <div>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowHeaders(v => !v)}>
          {showHeaders ? '▾' : '▸'} Lim inn e-posthoder (valgfritt — for SPF/DKIM-sjekk)
        </button>
        {showHeaders && (
          <Textarea className="mt-2 h-28 font-mono text-xs resize-y"
            placeholder="Received: from mail.example.com..." value={headers} onChange={e => setHeaders(e.target.value)} />
        )}
      </div>
      <Button className="w-full" disabled={loading || !body}
        onClick={() => {
          if (!config.apiKey) { alert('Legg til API-nøkkel i innstillinger'); return }
          analyze({ sender, subject, emailBody: body, headers: headers || undefined }, config)
        }}>
        {loading ? 'Analyserer...' : 'Analyser e-post'}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {report && <ReportView report={report} />}
    </div>
  )
}
