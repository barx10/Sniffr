import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { CheckResult, ModelConfig, AnalysisMode } from './types'

function getModel(config: ModelConfig) {
  if (config.provider === 'openai') return createOpenAI({ apiKey: config.apiKey })(config.model)
  if (config.provider === 'anthropic') return createAnthropic({ apiKey: config.apiKey })(config.model)
  return createGoogleGenerativeAI({ apiKey: config.apiKey })(config.model)
}

export async function analyzeWithAI(
  mode: AnalysisMode,
  input: Record<string, string>,
  checks: CheckResult[],
  config: ModelConfig
): Promise<CheckResult> {
  const checkSummary = checks.map(c => `- ${c.label}: ${c.status.toUpperCase()} — ${c.detail}`).join('\n')

  const prompts: Record<AnalysisMode, string> = {
    email: `Analyze this email for scam signals.\n\nFROM: ${input.sender}\nSUBJECT: ${input.subject}\nBODY:\n${input.body}\n\nAutomated checks:\n${checkSummary}\n\nReturn JSON: { "status": "pass"|"warn"|"fail", "detail": "1-2 sentence finding", "flags": ["flag1",...] }`,
    name: `Is "${input.name}" a name associated with scam identities?\nContext: ${input.context}\nChecks:\n${checkSummary}\n\nReturn JSON: { "status": "pass"|"warn"|"fail", "detail": "...", "flags": [] }`,
    image: `Assess this image context for scam risk: ${input.imageUrl}\nChecks:\n${checkSummary}\n\nReturn JSON: { "status": "pass"|"warn"|"fail", "detail": "...", "flags": [] }`,
  }

  try {
    const { text } = await generateText({
      model: getModel(config),
      system: 'You are a cybersecurity expert specializing in email scam and phishing analysis. Be direct and specific.',
      prompt: prompts[mode],
    })
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    const flags: string[] = parsed.flags ?? []
    const detail = parsed.detail ?? text.slice(0, 200)
    return {
      id: 'ai-analysis', label: 'AI Analysis',
      status: parsed.status ?? 'warn', weight: 30,
      detail: flags.length ? `${detail} Flags: ${flags.join(', ')}` : detail,
      data: parsed,
    }
  } catch (e) {
    return { id:'ai-analysis', label:'AI Analysis', status:'error', weight:30,
      detail: `AI analysis failed: ${e instanceof Error ? e.message : 'unknown'}` }
  }
}
