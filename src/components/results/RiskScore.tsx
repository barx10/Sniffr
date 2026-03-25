import type { AnalysisReport } from '@/lib/types'
import { cn } from '@/lib/utils'

const CONFIG = {
  green: {
    label: 'Lav risiko',
    sublabel: 'Ingen tydelige faresignaler',
    barColor: 'from-emerald-500 to-emerald-400',
    scoreColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    bgColor: 'bg-emerald-500/5',
    dotColor: 'bg-emerald-500',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  },
  yellow: {
    label: 'Mistenkelig',
    sublabel: 'Flere tegn bør undersøkes',
    barColor: 'from-amber-500 to-amber-400',
    scoreColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    bgColor: 'bg-amber-500/5',
    dotColor: 'bg-amber-500',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  },
  red: {
    label: 'Høy risiko',
    sublabel: 'Sannsynlig svindel — ikke svar',
    barColor: 'from-red-600 to-red-500',
    scoreColor: 'text-red-400',
    borderColor: 'border-red-500/20',
    bgColor: 'bg-red-500/5',
    dotColor: 'bg-red-500',
    badgeColor: 'bg-red-500/15 text-red-400 border-red-500/25',
  },
}

export function RiskScore({ report }: { report: AnalysisReport }) {
  const c = CONFIG[report.riskLevel]

  return (
    <div className={cn('rounded-xl border p-5', c.borderColor, c.bgColor)}>
      {/* Top row: score + badge */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className={cn('font-mono font-black leading-none', c.scoreColor)} style={{ fontSize: '3.5rem' }}>
            {report.score}
            <span className="text-2xl font-bold opacity-50">/100</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={cn('w-1.5 h-1.5 rounded-full', c.dotColor)} />
            <span className="font-display font-bold text-sm tracking-[0.06em] uppercase">{c.label}</span>
          </div>
          <p className="text-[10px] tracking-wide text-muted-foreground mt-0.5">{c.sublabel}</p>
        </div>

        <div className={cn('rounded px-2.5 py-1 border text-[10px] font-bold tracking-[0.15em] uppercase', c.badgeColor)}>
          {report.riskLevel === 'green' ? 'Trygg' : report.riskLevel === 'yellow' ? 'Advarsel' : 'Fare'}
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="h-1 rounded-full bg-white/8 overflow-hidden">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r score-bar-fill', c.barColor)}
            style={{ width: `${report.score}%` }}
          />
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs leading-relaxed text-muted-foreground border-t border-white/5 pt-4">
        {report.summary}
      </p>
    </div>
  )
}
