import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const maxSize = 15 * 1024 * 1024 // 15MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File quá lớn (tối đa 15MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let text = ''
    let pageCount: number | undefined

    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.pdf')) {
      // Use require path to avoid pdf-parse test file issue in Next.js
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse')
      const result = await pdfParse(buffer)
      text = result.text
      pageCount = result.numpages
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      return NextResponse.json(
        { error: 'Chỉ hỗ trợ file PDF và Word (.docx)' },
        { status: 400 }
      )
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Không thể đọc nội dung file. File có thể bị scan/image-based.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      text: text.trim(),
      pageCount,
      fileName: file.name,
      size: file.size,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Lỗi khi đọc file' }, { status: 500 })
  }
}
