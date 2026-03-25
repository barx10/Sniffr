export type CheckStatus = 'pass' | 'warn' | 'fail' | 'error'
export type RiskLevel = 'green' | 'yellow' | 'red'

export interface CheckResult {
  id: string
  label: string
  status: CheckStatus
  weight: number       // 0-100, contribution to score
  detail: string       // Human-readable explanation
  data?: unknown       // Raw data from check
}

export interface AnalysisReport {
  score: number
  riskLevel: RiskLevel
  checks: CheckResult[]
  summary: string
}

export type AnalysisMode = 'email' | 'image' | 'name'

export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'google'
  model: string
  apiKey: string
}
