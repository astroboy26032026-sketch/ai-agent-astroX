<div align="center">
  <h1>AstroX — AI Multi-Agent Platform</h1>
  <p>Nền tảng AI đa tác nhân biến tài liệu phần mềm thành kết quả hành động</p>
</div>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"></a>
  <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"></a>
  <a href="https://mistral.ai/"><img src="https://img.shields.io/badge/Mistral_AI-FF7E00?style=for-the-badge&logo=mistralai&logoColor=white" alt="Mistral AI"></a>
  <a href="https://groq.com/"><img src="https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logoColor=white" alt="Groq"></a>
  <a href="https://www.anthropic.com/"><img src="https://img.shields.io/badge/Anthropic-191919?style=for-the-badge&logoColor=white" alt="Anthropic"></a>
</p>

---

## Giới thiệu

**AstroX** là nền tảng AI đa tác nhân giúp đội phát triển phần mềm tăng tốc bằng cách tự động hoá các tác vụ lặp đi lặp lại từ tài liệu — từ phân tích nội dung, break down task đến sinh test case và API spec.

> Dự án được xây dựng với mục tiêu **giảm thời gian đọc tài liệu**, tăng thời gian viết code.

---

## Modules

| Module | Trạng thái | Mô tả |
|--------|-----------|-------|
| **AI Document Management** | 🟢 In Progress (30%) | Upload PDF/Word → Q&A với AI, break down task thành Kanban board |
| **AI Test Case Generator** | 🟢 In Progress (40%) | Mô tả tính năng → sinh bộ test case đầy đủ, export CSV |
| **AI Document Swagger** | ⏳ Planned | Parse tài liệu → sinh OpenAPI/Swagger spec tự động |

---

## Tính năng hiện có

- 🤖 **Chat AI** — Hỏi đáp về platform AstroX, xem dự án, tiến độ, liên hệ
- 📄 **AI Document Management** — Upload PDF/Word, streaming Q&A, phân tích nội dung
- 📋 **Task Board (Kanban)** — Break down tài liệu phần mềm thành task theo DevOps/BE/FE/QA
- 🧪 **AI Test Case Generator** — Sinh bộ test case đầy đủ (functional, edge-case, negative, performance, security), export CSV
- 🔌 **Multi-provider** — Hỗ trợ Mistral AI (mặc định), Groq (miễn phí), Anthropic
- 🌑 **Dark mode only** — Giao diện tối hoàn toàn

---

## Tech Stack

| Lớp | Công nghệ |
|-----|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion |
| **AI / Streaming** | Vercel AI SDK 4, Mistral AI, Groq, Anthropic |
| **Document Parsing** | pdf-parse, mammoth |
| **UI Components** | Radix UI, Lucide Icons, Vaul, Sonner |
| **Deployment** | Vercel |

---

## Cài đặt & Chạy local

### Yêu cầu
- Node.js v18+
- npm / pnpm

### Các bước

**1. Clone repository:**
```bash
git clone https://github.com/astroboy26032026-sketch/ai-agent-astroX.git
cd astrox
```

**2. Cài dependencies:**
```bash
npm install
```

**3. Tạo file `.env.local`:**
```env
# Mistral AI — model mặc định (lấy tại admin.mistral.ai)
MISTRAL_API_KEY=your_mistral_api_key_here

# Tuỳ chọn — nếu muốn dùng Anthropic phía server
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

> **Lưu ý:** Groq và Anthropic có thể được nhập trực tiếp trên giao diện người dùng, không bắt buộc phải có trong `.env`.

**4. Chạy development server:**
```bash
npm run dev
```

**5. Mở trình duyệt:** `http://localhost:3000`

---

## Cấu trúc thư mục

```
src/
├── app/
│   ├── page.tsx                  # Trang chủ
│   ├── chat/                     # Trang chat AI portfolio
│   ├── document-analyst/         # Trang AI Document Management
│   ├── todo-tasks/               # Trang Kanban Task Board (types, constants, components)
│   ├── test-case/                # Trang AI Test Case Generator (types, constants, components)
│   └── api/
│       ├── chat/                 # API chat portfolio (tools: getPresentation, getProjects, ...)
│       ├── document-chat/        # API chat phân tích tài liệu
│       ├── break-tasks/          # API break down tài liệu → task board
│       ├── break-subtasks/       # API break task lớn → subtask nhỏ
│       ├── generate-test-cases/  # API sinh bộ test case từ mô tả/tài liệu
│       ├── extract-contact/      # API trích xuất thông tin liên hệ từ CV
│       └── upload/               # API xử lý upload PDF/Word
├── components/
│   ├── chat/                     # Components chat portfolio
│   ├── document-analyst/         # Components Document Management
│   ├── projects/                 # Carousel dự án
│   ├── ModelSelectorBar.tsx      # Chọn AI provider/model
│   └── ui/                       # UI primitives (Radix)
├── hooks/
│   └── use-ai-settings.ts        # State management provider/model/apiKey
└── lib/
    ├── ai.ts                     # Shared AI utility (resolveApiKey, createModel)
    ├── types.ts                  # Shared TypeScript interfaces
    └── utils.ts                  # Utility functions (cn)
```

---

## Roadmap

- [x] AI Document Management — Q&A tài liệu
- [x] Task Board Kanban mẫu
- [x] Multi-provider AI (Mistral / Groq / Anthropic)
- [ ] AI Document Swagger — sinh OpenAPI spec
- [x] AI Test Case Generator — sinh test case từ tài liệu/ý tưởng
- [ ] Drag & drop Kanban board
- [ ] Lưu task board vào database

---

## License

MIT License — xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

<div align="center">
  <strong>AstroX</strong> · Built with Next.js 15 & Vercel AI SDK
</div>
