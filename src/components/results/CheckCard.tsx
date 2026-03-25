import type { CheckResult } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const S = {
  pass:  { icon: '✅', label: 'Pass',  cls: 'border-emerald-500/20 bg-emerald-500/5' },
  warn:  { icon: '⚠️', label: 'Warn',  cls: 'border-amber-500/20 bg-amber-500/5' },
  fail:  { icon: '🔴', label: 'Fail',  cls: 'border-red-500/20 bg-red-500/5' },
  error: { icon: '⚫', label: 'Error', cls: 'border-zinc-500/20 bg-zinc-500/5' },
}

export function CheckCard({ check }: { check: CheckResult }) {
  const { icon, label, cls } = S[check.status]
  return (
    <Card className={cn('border', cls)}>
      <CardContent className="p-4 flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{check.label}</span>
            <Badge variant="outline" className="text-xs">{label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{check.detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}
