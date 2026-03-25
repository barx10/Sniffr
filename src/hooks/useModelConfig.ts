'use client'
import { useState, useEffect } from 'react'
import type { ModelConfig } from '@/lib/types'

const KEY = 'scam-sniffr-model-config'
export const MODELS = {
  anthropic: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5'],
  openai: ['gpt-5.4', 'gpt-4o-mini'],
  google: ['gemini-2.5-pro', 'gemini-2.0-flash'],
} as const

const DEFAULT: ModelConfig = { provider: 'anthropic', model: 'claude-sonnet-4-6', apiKey: '' }

export function useModelConfig() {
  const [config, setConfig] = useState<ModelConfig>(DEFAULT)
  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setConfig(JSON.parse(s)) } catch {}
  }, [])
  const save = (c: ModelConfig) => { setConfig(c); localStorage.setItem(KEY, JSON.stringify(c)) }
  return { config, save }
}
