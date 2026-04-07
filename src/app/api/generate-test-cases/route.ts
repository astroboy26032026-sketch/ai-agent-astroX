import { generateObject } from 'ai'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveApiKey, createModel } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 120

const testCaseItem = z.object({
  id: z.string().describe('Mã test case: TC-001, TC-002, ...'),
  title: z.string().describe('Tên test case ngắn gọn'),
  type: z.enum(['functional', 'edge-case', 'negative', 'performance', 'security', 'ui-ux', 'compatibility', 'api'])
    .describe('Loại test case'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  platform: z.enum(['web', 'mobile', 'api', 'all'])
    .describe('Nền tảng: web (desktop browser), mobile (iOS/Android), api (backend), all (tất cả)'),
  precondition: z.string().describe('Điều kiện tiên quyết trước khi thực hiện test'),
  steps: z.array(z.string()).describe('Các bước thực hiện test (3-8 bước)'),
  expectedResult: z.string().describe('Kết quả mong đợi'),
})

function buildSchema(mode: string) {
  const count = mode === 'full' ? '40-55' : '12-18'
  return z.object({
    moduleName: z.string().describe('Tên module hoặc tính năng chính được test'),
    testCases: z.array(testCaseItem).describe(`Danh sách ${count} test case`),
  })
}

const QUICK_PROMPT = `Bạn là Senior QA Engineer. Tạo bộ test case nhanh từ mô tả tính năng sau.

## Yêu cầu
- Tạo **12-18 test case** — cover các flow quan trọng nhất
- Bao gồm: functional (happy path), edge-case, negative, ui-ux, api, security
- Platform: chia đều web / mobile / api / all
- Mỗi test case có precondition, steps (3-6 bước), expected result
- Priority: critical > high > medium > low
- ID: TC-001, TC-002, ...
- Viết bằng tiếng Việt
- Sắp xếp theo priority giảm dần`

const FULL_PROMPT = `Bạn là Senior QA Engineer với 10+ năm kinh nghiệm. Tạo bộ test case CHUYÊN NGHIỆP và ĐẦY ĐỦ.

## Yêu cầu số lượng
- Tạo **40-55 test case** — BẮT BUỘC không ít hơn 40

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
- **web**: ~40% (desktop browser, keyboard nav, responsive, cross-browser)
- **mobile**: ~30% (iOS/Android, touch gestures, offline, rotation, push notification)
- **api**: ~15% (backend endpoints, validation, error codes)
- **all**: ~15% (business logic chung)

## Quy tắc viết
- Priority: critical = core flow / mất data / security, high = quan trọng, medium = nên test, low = cosmetic
- ID: TC-001 → TC-055
- Viết bằng **tiếng Việt**, steps cụ thể (3-8 bước)
- Precondition rõ ràng: user state, device, browser
- Expected result phải measurable

## Lưu ý mobile
- Touch gestures (swipe, long press, pinch zoom)
- Offline mode / mất kết nối giữa chừng
- Push notification, landscape/portrait rotation
- Màn hình nhỏ (< 375px) và tablet, deep link

## Lưu ý web
- Keyboard navigation (Tab, Enter, Escape)
- Cross-browser: Chrome, Firefox, Safari, Edge
- Responsive: desktop (1920px), laptop (1366px), tablet (768px)
- Ad blocker, browser extensions

## Sắp xếp: critical → high → medium → low, nhóm theo platform`

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
  const { description, mode = 'quick' } = await req.json()

  if (!description?.trim()) {
    return Response.json({ error: 'Thiếu mô tả tính năng hoặc tài liệu.' }, { status: 400 })
  }

  const content = description.slice(0, 15000)
  const schema = buildSchema(mode)
  const basePrompt = mode === 'full' ? FULL_PROMPT : QUICK_PROMPT

  try {
    const { object } = await generateObject({
      model,
      schema,
      prompt: `${basePrompt}

## Nội dung tài liệu / mô tả tính năng:
${content}`,
    })

    return Response.json(object)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi khi sinh test case'
    return Response.json({ error: message }, { status: 500 })
  }
}
