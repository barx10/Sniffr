import { describe, it, expect } from 'vitest'
import { calculateScore, getRiskLevel } from '@/lib/scoring'
import type { CheckResult } from '@/lib/types'

const c = (status: CheckResult['status'], weight: number): CheckResult =>
  ({ id: 'x', label: 'X', status, weight, detail: '' })

describe('calculateScore', () => {
  it('returns 0 for all passing', () => expect(calculateScore([c('pass', 10)])).toBe(0))
  it('returns 100 for full fail', () => expect(calculateScore([c('fail', 100)])).toBe(100))
  it('weights warn at 50%', () => expect(calculateScore([c('warn', 100)])).toBe(50))
  it('ignores error checks', () => expect(calculateScore([c('error', 100)])).toBe(0))
  it('caps at 100', () => expect(calculateScore([c('fail', 80), c('fail', 80)])).toBe(100))
})

describe('getRiskLevel', () => {
  it('green 0-30', () => { expect(getRiskLevel(0)).toBe('green'); expect(getRiskLevel(30)).toBe('green') })
  it('yellow 31-65', () => { expect(getRiskLevel(31)).toBe('yellow'); expect(getRiskLevel(65)).toBe('yellow') })
  it('red 66+', () => { expect(getRiskLevel(66)).toBe('red'); expect(getRiskLevel(100)).toBe('red') })
})
