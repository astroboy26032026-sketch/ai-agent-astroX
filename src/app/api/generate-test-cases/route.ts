import { generateObject } from 'ai'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveApiKey, createModel } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 120

const testCaseSchema = z.object({
  moduleName: z.string().describe('Tên module hoặc tính năng chính được test'),
  testCases: z.array(
    z.object({
      id: z.string().describe('Mã test case: TC-001, TC-002, ...'),
      title: z.string().describe('Tên test case ngắn gọn'),
      type: z.enum(['functional', 'edge-case', 'negative', 'performance', 'security', 'ui-ux', 'compatibility', 'api'])
        .describe('Loại test case'),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      platform: z.enum(['web', 'mobile', 'api', 'all'])
        .describe('Nền tảng áp dụng: web (desktop browser), mobile (iOS/Android), api (backend), all (tất cả)'),
      precondition: z.string().describe('Điều kiện tiên quyết trước khi thực hiện test'),
      steps: z.array(z.string()).describe('Các bước thực hiện test (3-8 bước)'),
      expectedResult: z.string().describe('Kết quả mong đợi'),
    })
  ).describe('Danh sách 40-55 test case, cover đầy đủ tất cả nền tảng và loại test'),
})

export async function POST(req: NextRequest) {
  const userKey = req.headers.get('x-api-key') || ''
  const provider = req.headers.get('x-provider') || 'mistral'
  const modelId = req.headers.get('x-model') || 'mistral-large-latest'

  const apiKey = resolveApiKey(provider, userKey)
  if (!apiKey) {
    return Response.json(
      { error: 'Chưa có API key. Vui lòng cấu hình model ở thanh trên.' },
      { status: 401 },
    )
  }

  const model = createModel(provider, modelId, apiKey)
  const { description } = await req.json()

  if (!description?.trim()) {
    return Response.json({ error: 'Thiếu mô tả tính năng hoặc tài liệu.' }, { status: 400 })
  }

  const content = description.slice(0, 15000)

  try {
    const { object } = await generateObject({
      model,
      schema: testCaseSchema,
      prompt: `Bạn là Senior QA Engineer với 10+ năm kinh nghiệm. Hãy tạo bộ test case CHUYÊN NGHIỆP và ĐẦY ĐỦ từ tài liệu/mô tả tính năng sau.

## Yêu cầu số lượng
- Tạo **40-55 test case** — đây là yêu cầu BẮT BUỘC, không được ít hơn 40
- Phải cover đầy đủ tất cả nền tảng và góc nhìn

## Phân bổ theo loại (type) — BẮT BUỘC đủ 8 loại
| Loại | Số lượng | Mô tả |
|------|----------|-------|
| functional | 10-12 | Happy path, core business flows |
| edge-case | 6-8 | Boundary values, Unicode, empty states, max length |
| negative | 6-8 | Invalid input, unauthorized access, expired session |
| ui-ux | 5-7 | Responsive, layout, animation, accessibility, dark/light mode |
| compatibility | 4-6 | Cross-browser (Chrome/Firefox/Safari), iOS/Android, tablet, screen sizes |
| api | 4-5 | Request/response validation, error codes, rate limit, timeout |
| performance | 3-4 | Load time, concurrent users, large data, memory leak |
| security | 3-4 | XSS, SQL injection, CSRF, auth bypass, token expiry |

## Phân bổ theo platform — BẮT BUỘC cover đủ
- **web**: ~40% test cases (desktop browser experience)
- **mobile**: ~30% test cases (iOS + Android, touch, responsive, native features)
- **api**: ~15% test cases (backend endpoints, data validation)
- **all**: ~15% test cases (business logic chung cho tất cả platforms)

## Quy tắc viết test case
- Priority: critical = core flow bị ảnh hưởng / mất data / security breach, high = quan trọng nhưng có workaround, medium = nên test, low = nice-to-have / cosmetic
- ID theo format: TC-001, TC-002, ... TC-055
- Viết bằng **tiếng Việt**
- Steps phải cụ thể, chi tiết, ai đọc cũng có thể thực hiện được (3-8 bước mỗi test case)
- Precondition phải rõ ràng: user đã đăng nhập? Trên thiết bị gì? Browser gì?
- Expected result phải measurable, không mơ hồ

## Lưu ý đặc biệt cho mobile
- Test touch gestures (swipe, long press, pinch zoom)
- Test offline mode / mất kết nối giữa chừng
- Test push notification
- Test landscape/portrait rotation
- Test trên màn hình nhỏ (< 375px) và lớn (tablet)
- Test deep link

## Lưu ý đặc biệt cho web
- Test keyboard navigation (Tab, Enter, Escape)
- Test trên các browser: Chrome, Firefox, Safari, Edge
- Test responsive: desktop (1920px), laptop (1366px), tablet (768px)
- Test với ad blocker, extension ảnh hưởng

## Sắp xếp
- Sắp xếp theo priority: critical → high → medium → low
- Trong cùng priority, nhóm theo platform

## Nội dung tài liệu / mô tả tính năng:
${content}`,
    })

    return Response.json(object)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi khi sinh test case'
    return Response.json({ error: message }, { status: 500 })
  }
}
