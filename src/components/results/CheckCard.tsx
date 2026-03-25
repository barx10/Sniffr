import type { CheckResult } from '@/lib/types'
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const S = {
  pass: {
    Icon: CheckCircle2,
    iconCls: 'text-emerald-500',
    strip: 'bg-emerald-500/50',
    label: 'OK',
    labelCls: 'text-emerald-400',
  },
  warn: {
    Icon: AlertTriangle,
    iconCls: 'text-amber-500',
    strip: 'bg-amber-500/60',
    label: 'Advarsel',
    labelCls: 'text-amber-400',
  },
  fail: {
    Icon: XCircle,
    iconCls: 'text-red-500',
    strip: 'bg-red-500/70',
    label: 'Feil',
    labelCls: 'text-red-400',
  },
  error: {
    Icon: MinusCircle,
    iconCls: 'text-zinc-500',
    strip: 'bg-zinc-600/40',
    label: 'Feil',
    labelCls: 'text-zinc-500',
  },
}

export function CheckCard({ check, index }: { check: CheckResult; index: number }) {
  const { Icon, iconCls, strip, label, labelCls } = S[check.status]

  return (
    <div
      className="flex items-start gap-3 py-3 px-3 rounded-lg bg-white/[0.025] border border-white/[0.06] animate-fade-in-up"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className={cn('w-0.5 min-h-[1.75rem] rounded-full self-stretch flex-shrink-0', strip)} />

      <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', iconCls)} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-semibold">{check.label}</span>
          <span className={cn('text-xs font-bold tracking-[0.08em] uppercase flex-shrink-0', labelCls)}>
            {label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{check.detail}</p>
      </div>
    </div>
  )
}
