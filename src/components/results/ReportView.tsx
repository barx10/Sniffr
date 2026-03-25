import type { AnalysisReport } from '@/lib/types'
import { RiskScore } from './RiskScore'
import { CheckCard } from './CheckCard'

export function ReportView({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-4 mt-6 border-t border-white/6 pt-6">
      <RiskScore report={report} />

      <div className="pt-1">
        <p className="field-label mb-3">
          {report.checks.length} kontroller kjørt
        </p>
        <div className="space-y-1.5">
          {report.checks.map((c, i) => (
            <CheckCard key={c.id} check={c} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
