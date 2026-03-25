import type { AnalysisReport } from '@/lib/types'
import { RiskScore } from './RiskScore'
import { CheckCard } from './CheckCard'

export function ReportView({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-3 mt-6 border-t border-white/5 pt-6">
      <RiskScore report={report} />

      <div className="pt-2">
        <p className="field-label mb-3">Detaljerte sjekker — {report.checks.length} kontroller</p>
        <div className="space-y-1.5">
          {report.checks.map((c, i) => (
            <CheckCard key={c.id} check={c} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
