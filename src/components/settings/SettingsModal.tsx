'use client'
import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { MODELS, useModelConfig } from '@/hooks/useModelConfig'
import type { ModelConfig } from '@/lib/types'

export function SettingsModal() {
  const { config, save } = useModelConfig()
  const [draft, setDraft] = useState<ModelConfig>(config)
  // Sync draft when localStorage hydrates (config changes after first render)
  useEffect(() => { setDraft(config) }, [config])

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" />}>
        <Settings className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display font-bold tracking-[0.06em] text-sm uppercase">
            AI-modell innstillinger
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">

          <div className="space-y-2">
            <label className="field-label block">Leverandør</label>
            <Select
              value={draft.provider}
              onValueChange={(v) => {
                if (!v) return
                setDraft(d => ({ ...d, provider: v as ModelConfig['provider'], model: MODELS[v as keyof typeof MODELS][0] }))
              }}
            >
              <SelectTrigger className="bg-background/60 border-border/60 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {(Object.keys(MODELS) as (keyof typeof MODELS)[]).map(p => (
                  <SelectItem key={p} value={p} className="text-xs">
                    {p[0].toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="field-label block">Modell</label>
            <Select
              value={draft.model}
              onValueChange={(v) => {
                if (!v) return
                setDraft(d => ({ ...d, model: v }))
              }}
            >
              <SelectTrigger className="bg-background/60 border-border/60 h-9 text-xs font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {MODELS[draft.provider].map(m => (
                  <SelectItem key={m} value={m} className="text-xs font-mono">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="field-label block">API-nøkkel</label>
            <Input
              type="password"
              placeholder={`${draft.provider} API key`}
              className="bg-background/60 border-border/60 h-9 text-xs font-mono focus:border-amber-500/50"
              value={draft.apiKey}
              onChange={e => setDraft(d => ({ ...d, apiKey: e.target.value }))}
            />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Lagres i nettleseren din. Sendes til valgt AI-leverandør per forespørsel — aldri logget eller lagret server-side.
            </p>
          </div>

          <Button
            className="w-full h-9 font-display font-bold tracking-[0.12em] text-xs uppercase"
            onClick={() => save(draft)}
          >
            Lagre innstillinger
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
