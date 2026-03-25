'use client'
import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { MODELS, useModelConfig } from '@/hooks/useModelConfig'
import type { ModelConfig } from '@/lib/types'

export function SettingsModal() {
  const { config, save } = useModelConfig()
  const [draft, setDraft] = useState<ModelConfig>(config)
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
        <Settings className="h-5 w-5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>AI Model Settings</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={draft.provider} onValueChange={(v) => {
              if (!v) return
              setDraft(d => ({ ...d, provider: v as ModelConfig['provider'], model: MODELS[v as keyof typeof MODELS][0] }))
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(MODELS) as (keyof typeof MODELS)[]).map(p =>
                  <SelectItem key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={draft.model} onValueChange={(v) => {
              if (!v) return
              setDraft(d => ({ ...d, model: v }))
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODELS[draft.provider].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input type="password" placeholder={`${draft.provider} API key`}
              value={draft.apiKey} onChange={e => setDraft(d => ({ ...d, apiKey: e.target.value }))} />
            <p className="text-xs text-muted-foreground">Stored in your browser only. Never sent to our servers.</p>
          </div>
          <Button className="w-full" onClick={() => save(draft)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
