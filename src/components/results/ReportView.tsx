import type { AnalysisReport } from '@/lib/types'
import { RiskScore } from './RiskScore'
import { CheckCard } from './CheckCard'

export function ReportView({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-4 mt-4">
      <RiskScore report={report} />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Check Details</p>
      {report.checks.map(c => <CheckCard key={c.id} check={c} />)}
    </div>
  )
}
