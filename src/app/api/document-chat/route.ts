import { streamText } from 'ai'
import { NextRequest } from 'next/server'
import { resolveApiKey, createModel } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 30

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

  const model = createModel(provider, modelId, apiKey)
  const { messages, documentContent, documentName, ideaMode } = await req.json()

  let systemPrompt: string

  if (documentContent) {
    systemPrompt = `Bạn là AI phân tích tài liệu trong hệ thống AstroX. Người dùng hỏi về tài liệu "${documentName}".

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
  } else if (ideaMode) {
    systemPrompt = `Bạn là AI tư vấn dự án trong hệ thống AstroX. Người dùng chưa có tài liệu mà chỉ có ý tưởng.

## Quy tắc ngôn ngữ
- Mặc định trả lời tiếng Việt
- Nếu user hỏi tiếng Anh → trả lời tiếng Anh

## Vai trò của bạn
- Lắng nghe ý tưởng của người dùng và giúp họ phát triển thành kế hoạch cụ thể
- Đặt câu hỏi để hiểu rõ hơn về ý tưởng (mục tiêu, đối tượng, tính năng chính, tech stack mong muốn)
- Gợi ý kiến trúc hệ thống, tính năng cần thiết, và các bước triển khai
- Khi đã hiểu đủ ý tưởng, đề xuất phân tách thành các task theo nhóm: DevOps, Backend, Frontend, QA
- Gợi ý user sử dụng Task Board để quản lý các task

## Phong cách
- Thân thiện, chuyên nghiệp
- Đưa ra gợi ý thực tế, cụ thể
- Sử dụng bullet points và heading để dễ đọc
- Hỏi thêm nếu cần thông tin để tư vấn chính xác hơn`
  } else {
    systemPrompt = `Bạn là AI hỗ trợ của AstroX. Chưa có tài liệu nào được tải lên. Hãy nhắc user tải lên file PDF hoặc Word để bắt đầu phân tích, hoặc chọn chế độ "Tôi có ý tưởng" nếu chưa có tài liệu.`
  }

  try {
    const result = streamText({ model, system: systemPrompt, messages })
    return result.toDataStreamResponse()
  } catch (error) {
    console.error('[document-chat] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Lỗi không xác định' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
