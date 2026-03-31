import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGroq } from '@ai-sdk/groq'
import { createMistral } from '@ai-sdk/mistral'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

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
    return new Response(
      JSON.stringify({ error: 'Chưa có API key. Vui lòng cấu hình model ở thanh trên.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let model: ReturnType<ReturnType<typeof createMistral>>
  if (provider === 'anthropic') model = createAnthropic({ apiKey })(modelId)
  else if (provider === 'groq') model = createGroq({ apiKey })(modelId)
  else model = createMistral({ apiKey })(modelId)

  const { messages, documentContent, documentName } = await req.json()

  const systemPrompt = documentContent
    ? `Bạn là AI phân tích tài liệu trong hệ thống AstroX. Người dùng hỏi về tài liệu "${documentName}".

## Quy tắc ngôn ngữ
- Mặc định trả lời tiếng Việt
- Nếu user hỏi tiếng Anh → trả lời tiếng Anh

## Phân tích tài liệu
- Trả lời ngắn gọn, chính xác dựa trên nội dung tài liệu
- Trích dẫn vị trí (Trang X, Mục Y) khi có thể
- Nếu thông tin không có trong tài liệu, nói rõ điều đó

## Nhận diện tài liệu phần mềm
Khi user hỏi về "break down task", "phân tách công việc", hoặc yêu cầu tạo task:
1. Đánh giá xem tài liệu có phải tài liệu phần mềm không (SRS, BRD, spec, yêu cầu kỹ thuật, API doc, v.v.)
2. Nếu CÓ → phân tích và liệt kê các task theo nhóm: DevOps, Backend, Frontend, QA
3. Nếu KHÔNG → giải thích rõ: "Tài liệu này không phải tài liệu phần mềm nên không thể break down task theo chuẩn DevOps/BE/FE/QA"
4. Sau khi liệt kê task → gợi ý user xem Task Board để quản lý

## Nội dung tài liệu
---
${documentContent.slice(0, 15000)}
---`
    : `Bạn là AI hỗ trợ của AstroX. Chưa có tài liệu nào được tải lên. Hãy nhắc user tải lên file PDF hoặc Word để bắt đầu phân tích.`

  const result = streamText({ model, system: systemPrompt, messages })
  return result.toDataStreamResponse()
}
