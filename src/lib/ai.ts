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
    email: `Analyser denne meldingen for svindel-signaler.\n\nFRA: ${input.sender}\nEMNE: ${input.subject}\nINNHOLD:\n${input.body}\n\nAutomatiserte sjekker:\n${checkSummary}\n\nReturn JSON: { "status": "pass"|"warn"|"fail", "detail": "1-2 setninger på norsk", "flags": ["flagg1",...] }`,
    name: `Er "${input.name}" et navn assosiert med svindel-identiteter?\nKontekst: ${input.context}\nSjekker:\n${checkSummary}\n\nReturn JSON: { "status": "pass"|"warn"|"fail", "detail": "1-2 setninger på norsk", "flags": [] }`,
    image: `Vurder denne bilde-konteksten for svindelrisiko: ${input.imageUrl}\nSjekker:\n${checkSummary}\n\nReturn JSON: { "status": "pass"|"warn"|"fail", "detail": "1-2 setninger på norsk", "flags": [] }`,
  }

  try {
    const { text } = await generateText({
      model: getModel(config),
      system: 'Du er en cybersikkerhetsekspert spesialisert på e-postsvindel og phishing-analyse. Svar alltid på norsk. Vær direkte og konkret.',
      prompt: prompts[mode],
    })
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    const flags: string[] = parsed.flags ?? []
    const detail = parsed.detail ?? text.slice(0, 200)
    return {
      id: 'ai-analysis', label: 'AI-analyse',
      status: parsed.status ?? 'warn', weight: 50,
      detail: flags.length ? `${detail} Flagg: ${flags.join(', ')}` : detail,
      data: parsed,
    }
  } catch (e) {
    return { id:'ai-analysis', label:'AI-analyse', status:'error', weight:30,
      detail: `AI-analyse mislyktes: ${e instanceof Error ? e.message : 'ukjent feil'}` }
  }
}
