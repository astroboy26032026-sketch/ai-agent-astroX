import { NextRequest, NextResponse } from 'next/server'
import { mistral } from '@ai-sdk/mistral'
import { generateText } from 'ai'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { content, fileName } = await req.json()
    if (!content) return NextResponse.json({ error: 'No content' }, { status: 400 })

    const { text } = await generateText({
      model: mistral('mistral-large-latest'),
      prompt: `Trích xuất thông tin liên hệ từ CV "${fileName}".
Trả về JSON object, KHÔNG giải thích:
{
  "name": "Họ tên đầy đủ hoặc null",
  "email": "email@example.com hoặc null",
  "phone": "số điện thoại hoặc null"
}

CV:
${content.slice(0, 6000)}`,
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ raw: text.trim() })
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Lỗi trích xuất' }, { status: 500 })
  }
}
