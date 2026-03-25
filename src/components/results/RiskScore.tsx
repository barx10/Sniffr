import type { AnalysisReport } from '@/lib/types'
import { cn } from '@/lib/utils'

const CONFIG = {
  green:  { color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', light: '🟢', label: 'Low Risk' },
  yellow: { color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',       light: '🟡', label: 'Suspicious' },
  red:    { color: 'text-red-400 border-red-500/30 bg-red-500/10',             light: '🔴', label: 'High Risk — Likely Scam' },
}

export function RiskScore({ report }: { report: AnalysisReport }) {
  const { color, light, label } = CONFIG[report.riskLevel]
  return (
    <div className={cn('rounded-xl border p-6 text-center', color)}>
      <div className="text-4xl mb-2">{light}</div>
      <div className="text-2xl font-bold">{label}</div>
      <div className="text-5xl font-mono font-black my-3">{report.score}<span className="text-2xl">/100</span></div>
      <p className="text-sm opacity-80">{report.summary}</p>
    </div>
  )
}
