import { createMistral } from '@ai-sdk/mistral'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGroq } from '@ai-sdk/groq'

export type AIProvider = 'mistral' | 'groq' | 'anthropic'

/**
 * Resolve API key: ưu tiên user key, fallback về env variable.
 */
export function resolveApiKey(provider: string, userKey: string): string {
  if (userKey) return userKey.trim()
  if (provider === 'mistral') return (process.env.MISTRAL_API_KEY ?? '').trim()
  if (provider === 'anthropic') return (process.env.ANTHROPIC_API_KEY ?? '').trim()
  if (provider === 'groq') return (process.env.GROQ_API_KEY ?? '').trim()
  return ''
}

/**
 * Tạo model instance từ provider + modelId + apiKey.
 */
export function createModel(provider: string, modelId: string, apiKey: string) {
  if (provider === 'anthropic') return createAnthropic({ apiKey })(modelId)
  if (provider === 'groq') return createGroq({ apiKey })(modelId)
  return createMistral({ apiKey })(modelId)
}
