'use client'
import { useState } from 'react'
import type { AnalysisReport, ModelConfig } from '@/lib/types'

export function useAnalysis(endpoint: string) {
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze(payload: Record<string, unknown>, modelConfig: ModelConfig) {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/analyze/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, modelConfig }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setReport(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return { report, loading, error, analyze }
}
