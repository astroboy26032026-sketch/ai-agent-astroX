import { generateObject } from 'ai'
import { createMistral } from '@ai-sdk/mistral'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGroq } from '@ai-sdk/groq'
import { NextRequest } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

const taskSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string(),
      title: z.enum(['DevOps', 'Backend', 'Frontend', 'QA']),
      tasks: z.array(
        z.object({
          title: z.string().describe('Tên task ngắn gọn, rõ ràng'),
          priority: z.enum(['high', 'medium', 'low']),
          status: z.enum(['todo']),
        })
      ),
    })
  ),
})

function resolveApiKey(provider: string, userKey: string): string {
  if (userKey) return userKey
  if (provider === 'mistral') return process.env.MISTRAL_API_KEY ?? ''
  if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY ?? ''
  if (provider === 'groq') return process.env.GROQ_API_KEY ?? ''
  return ''
}

export async function POST(req: NextRequest) {
  const userKey = req.headers.get('x-api-key') || ''
  const provider = req.headers.get('x-provider') || 'mistral'
  const modelId = req.headers.get('x-model') || 'mistral-large-latest'

  const apiKey = resolveApiKey(provider, userKey)
  if (!apiKey) {
    return Response.json(
      { error: 'Chưa có API key. Vui lòng cấu hình model ở thanh trên.' },
      { status: 401 }
    )
  }

  let model: ReturnType<ReturnType<typeof createMistral>>
  if (provider === 'anthropic') model = createAnthropic({ apiKey })(modelId)
  else if (provider === 'groq') model = createGroq({ apiKey })(modelId)
  else model = createMistral({ apiKey })(modelId)

  const { description } = await req.json()

  if (!description?.trim()) {
    return Response.json({ error: 'Thiếu mô tả dự án.' }, { status: 400 })
  }

  try {
    const { object } = await generateObject({
      model,
      schema: taskSchema,
      prompt: `Bạn là Project Manager chuyên nghiệp. Phân tích mô tả dự án/tài liệu sau và break down thành các task cụ thể, phân nhóm theo 4 cột: DevOps, Backend, Frontend, QA.

Quy tắc:
- Mỗi cột nên có 2-6 task
- Task phải cụ thể, actionable, không chung chung
- Priority: high = cần làm đầu tiên hoặc blocking, medium = quan trọng nhưng không urgent, low = nice-to-have
- Tất cả task có status "todo"
- id của column: devops, be, fe, qa
- Viết tên task bằng tiếng Việt

## Mô tả dự án / Nội dung tài liệu:
${description.slice(0, 15000)}`,
    })

    return Response.json(object)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi khi phân tích'
    return Response.json({ error: message }, { status: 500 })
  }
}
