import { generateObject } from 'ai'
import { createMistral } from '@ai-sdk/mistral'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGroq } from '@ai-sdk/groq'
import { NextRequest } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

const subtaskSchema = z.object({
  subtasks: z.array(
    z.object({
      title: z.string().describe('Tên subtask cụ thể, actionable'),
      priority: z.enum(['high', 'medium', 'low']),
    })
  ).describe('Danh sách 2-6 subtask nhỏ'),
})

function resolveApiKey(provider: string, userKey: string): string {
  if (userKey) return userKey.trim()
  if (provider === 'mistral') return (process.env.MISTRAL_API_KEY ?? '').trim()
  if (provider === 'anthropic') return (process.env.ANTHROPIC_API_KEY ?? '').trim()
  if (provider === 'groq') return (process.env.GROQ_API_KEY ?? '').trim()
  return ''
}

export async function POST(req: NextRequest) {
  const userKey = req.headers.get('x-api-key') || ''
  const provider = req.headers.get('x-provider') || 'mistral'
  const modelId = req.headers.get('x-model') || 'mistral-large-latest'

  const apiKey = resolveApiKey(provider, userKey)
  if (!apiKey) {
    return Response.json(
      { error: 'Chưa có API key.' },
      { status: 401 },
    )
  }

  let model: ReturnType<ReturnType<typeof createMistral>>
  if (provider === 'anthropic') model = createAnthropic({ apiKey })(modelId)
  else if (provider === 'groq') model = createGroq({ apiKey })(modelId)
  else model = createMistral({ apiKey })(modelId)

  const { taskTitle, groupTitle, projectContext } = await req.json()

  if (!taskTitle?.trim()) {
    return Response.json({ error: 'Thiếu tên task.' }, { status: 400 })
  }

  try {
    const { object } = await generateObject({
      model,
      schema: subtaskSchema,
      prompt: `Bạn là Project Manager chuyên nghiệp. Hãy break down task lớn sau thành các subtask nhỏ, cụ thể, actionable.

## Task lớn
- Tên: "${taskTitle}"
- Nhóm: ${groupTitle}
${projectContext ? `\n## Bối cảnh dự án\n${projectContext.slice(0, 5000)}` : ''}

## Quy tắc
- Tạo 2-6 subtask
- Mỗi subtask phải cụ thể, có thể giao cho 1 dev thực hiện
- Priority: high = cần làm trước hoặc blocking, medium = quan trọng, low = nice-to-have
- Viết bằng tiếng Việt
- Subtask phải liên quan trực tiếp đến task lớn, không lan man`,
    })

    return Response.json(object)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi khi phân tích'
    return Response.json({ error: message }, { status: 500 })
  }
}
