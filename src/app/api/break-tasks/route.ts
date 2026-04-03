import { generateObject } from 'ai'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveApiKey, createModel } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Bước 1: AI đánh giá tài liệu có phải kỹ thuật/phần mềm không */
const evaluationSchema = z.object({
  isTechnical: z.boolean().describe('true nếu đây là tài liệu kỹ thuật phần mềm hoặc mô tả dự án phần mềm, false nếu không'),
  reason: z.string().describe('Giải thích ngắn gọn bằng tiếng Việt vì sao đây là/không phải tài liệu kỹ thuật'),
  documentType: z.string().describe('Loại tài liệu: ví dụ SRS, BRD, API Spec, Mô tả dự án, Hợp đồng, Báo cáo tài chính, v.v.'),
})

/** Bước 2: Schema cho task breakdown */
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

  const model = createModel(provider, modelId, apiKey)
  const { description } = await req.json()

  if (!description?.trim()) {
    return Response.json({ error: 'Thiếu mô tả dự án.' }, { status: 400 })
  }

  const content = description.slice(0, 15000)

  try {
    // Bước 1: Đánh giá tài liệu có phải kỹ thuật phần mềm không
    const { object: evaluation } = await generateObject({
      model,
      schema: evaluationSchema,
      prompt: `Đánh giá xem nội dung sau có phải là tài liệu kỹ thuật phần mềm hoặc mô tả dự án phần mềm không.

Tài liệu kỹ thuật phần mềm bao gồm: SRS, BRD, PRD, API Spec, Technical Spec, mô tả dự án phần mềm, yêu cầu hệ thống, user stories, wireframe descriptions, v.v.

KHÔNG phải tài liệu kỹ thuật phần mềm: hợp đồng thương mại, báo cáo tài chính, bài luận, tài liệu y tế, sách, truyện, v.v.

## Nội dung:
${content}`,
    })

    // Nếu không phải tài liệu kỹ thuật → trả về kết quả đánh giá, không break task
    if (!evaluation.isTechnical) {
      return Response.json({
        isTechnical: false,
        reason: evaluation.reason,
        documentType: evaluation.documentType,
      })
    }

    // Bước 2: Break down task
    const { object: tasks } = await generateObject({
      model,
      schema: taskSchema,
      prompt: `Bạn là Project Manager chuyên nghiệp. Phân tích mô tả dự án/tài liệu kỹ thuật sau và break down thành các task cụ thể, phân nhóm theo 4 cột: DevOps, Backend, Frontend, QA.

Quy tắc:
- Mỗi cột nên có 2-6 task
- Task phải cụ thể, actionable, không chung chung
- Priority: high = cần làm đầu tiên hoặc blocking, medium = quan trọng nhưng không urgent, low = nice-to-have
- Tất cả task có status "todo"
- id của column: devops, be, fe, qa
- Viết tên task bằng tiếng Việt

## Nội dung tài liệu kỹ thuật (${evaluation.documentType}):
${content}`,
    })

    return Response.json({ isTechnical: true, ...tasks })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi khi phân tích'
    return Response.json({ error: message }, { status: 500 })
  }
}
