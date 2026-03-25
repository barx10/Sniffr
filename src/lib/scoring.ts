import type { CheckResult, RiskLevel } from './types'

export function calculateScore(checks: CheckResult[]): number {
  const active = checks.filter(c => c.status !== 'error')
  const total = active.reduce((s, c) => s + c.weight, 0)
  if (total === 0) return 0
  const risk = active.reduce((s, c) => {
    if (c.status === 'fail') return s + c.weight
    if (c.status === 'warn') return s + c.weight * 0.5
    return s
  }, 0)
  return Math.min(100, Math.round((risk / total) * 100))
}

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'green'
  if (score <= 65) return 'yellow'
  return 'red'
}
