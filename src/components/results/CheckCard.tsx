import type { CheckResult } from '@/lib/types'
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const S = {
  pass: {
    Icon: CheckCircle2,
    iconCls: 'text-emerald-500',
    leftBar: 'bg-emerald-500/50',
    label: 'Pass',
    labelCls: 'text-emerald-500',
  },
  warn: {
    Icon: AlertTriangle,
    iconCls: 'text-amber-500',
    leftBar: 'bg-amber-500/50',
    label: 'Advarsel',
    labelCls: 'text-amber-500',
  },
  fail: {
    Icon: XCircle,
    iconCls: 'text-red-500',
    leftBar: 'bg-red-500/60',
    label: 'Feil',
    labelCls: 'text-red-500',
  },
  error: {
    Icon: MinusCircle,
    iconCls: 'text-zinc-500',
    leftBar: 'bg-zinc-600/50',
    label: 'Feil',
    labelCls: 'text-zinc-500',
  },
}

export function CheckCard({ check, index }: { check: CheckResult; index: number }) {
  const { Icon, iconCls, leftBar, label, labelCls } = S[check.status]

  return (
    <div
      className="flex items-start gap-3 py-3 px-3 rounded-lg bg-white/[0.02] border border-white/[0.05] animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Left color strip */}
      <div className={cn('w-0.5 h-full min-h-[2rem] rounded-full flex-shrink-0 self-stretch', leftBar)} />

      {/* Icon */}
      <Icon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', iconCls)} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-[0.02em]">{check.label}</span>
          <span className={cn('text-[10px] font-bold tracking-[0.1em] uppercase flex-shrink-0', labelCls)}>
            {label}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{check.detail}</p>
      </div>
    </div>
  )
}
