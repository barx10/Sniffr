import type { AnalysisReport } from '@/lib/types'
import { cn } from '@/lib/utils'

const CONFIG = {
  green: {
    label: 'Lav risiko',
    sublabel: 'Ingen tydelige faresignaler',
    barClass: 'from-emerald-500 to-emerald-400',
    scoreColor: 'text-emerald-400',
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-500/6',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  yellow: {
    label: 'Mistenkelig',
    sublabel: 'Bør undersøkes nærmere',
    barClass: 'from-amber-500 to-amber-400',
    scoreColor: 'text-amber-400',
    border: 'border-amber-500/25',
    bg: 'bg-amber-500/6',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  red: {
    label: 'Høy risiko',
    sublabel: 'Sannsynlig svindel — ikke svar',
    barClass: 'from-red-600 to-red-400',
    scoreColor: 'text-red-400',
    border: 'border-red-500/25',
    bg: 'bg-red-500/6',
    dot: 'bg-red-500',
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
}

export function RiskScore({ report }: { report: AnalysisReport }) {
  const c = CONFIG[report.riskLevel]

  return (
    <div className={cn('rounded-xl border p-5', c.border, c.bg)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className={cn('font-mono font-black leading-none', c.scoreColor)} style={{ fontSize: '3.75rem' }}>
            {report.score}
            <span className="text-2xl font-semibold opacity-40">/100</span>
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <div className={cn('w-2 h-2 rounded-full flex-shrink-0', c.dot)} />
            <span className="font-display font-bold text-base tracking-[0.04em] uppercase">{c.label}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 ml-4">{c.sublabel}</p>
        </div>

        <div className={cn('rounded px-2.5 py-1 border text-xs font-bold tracking-[0.12em] uppercase mt-1', c.badge)}>
          {report.riskLevel === 'green' ? 'Trygg' : report.riskLevel === 'yellow' ? 'Advarsel' : 'Fare'}
        </div>
      </div>

      {/* Gradient score bar */}
      <div className="mb-5">
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r score-bar-fill', c.barClass)}
            style={{ width: `${report.score}%` }}
          />
        </div>
      </div>

      {/* AI summary */}
      <p className="text-sm leading-relaxed text-foreground/75 border-t border-white/6 pt-4">
        {report.summary}
      </p>
    </div>
  )
}
