'use client'

/**
 * ChatPanel
 * Giao diện chat với AI để phân tích tài liệu đã upload.
 * Kết nối tới /api/document-chat, hỗ trợ multi-provider qua useAISettings.
 */

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { Send, Bot, User, Loader2, FileText, LayoutGrid } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { UploadedDocument } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAISettings } from '@/hooks/use-ai-settings'

/** Câu hỏi gợi ý khi tài liệu vừa được tải lên */
const QUICK_QUESTIONS = [
  'Tóm tắt tài liệu này',
  'Deadline quan trọng nhất?',
  'Có risk nào cần chú ý không?',
  'Các bên liên quan trong tài liệu?',
]

/**
 * Từ khoá trong response AI để hiện nút "Xem Task Board".
 * Nếu AI đề cập đến task/breakdown thì gợi ý chuyển sang Kanban.
 */
const TASK_KEYWORDS = ['task', 'breakdown', 'công việc', 'break down']

interface ChatPanelProps {
  /** Tài liệu đang được chọn để phân tích. null = chưa chọn tài liệu nào. */
  selectedDoc: UploadedDocument | null
}

export default function ChatPanel({ selectedDoc }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { settings } = useAISettings()

  // Xây dựng headers — nếu có apiKey người dùng thì gửi kèm, nếu không server tự dùng env key
  const chatHeaders: Record<string, string> = {
    'x-provider': settings.provider,
    'x-model': settings.modelId,
    ...(settings.apiKey ? { 'x-api-key': settings.apiKey } : {}),
  }

  const { messages, input, handleSubmit, handleInputChange, isLoading, setMessages, append } =
    useChat({
      api: '/api/document-chat',
      body: {
        documentContent: selectedDoc?.content ?? null,
        documentName: selectedDoc?.name ?? null,
      },
      headers: chatHeaders,
    })

  // Reset lịch sử chat khi đổi tài liệu
  useEffect(() => {
    setMessages([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoc?.id])

  // Tự cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /**
   * Gửi câu hỏi nhanh trực tiếp (không cần gõ vào input).
   * Dùng append thay vì fake event để tránh anti-pattern.
   */
  const sendQuickQuestion = (q: string) => {
    append({ role: 'user', content: q })
  }

  /**
   * Kiểm tra response AI có đề cập đến task/breakdown không
   * để hiện nút gợi ý chuyển sang Task Board.
   */
  const shouldShowTaskButton = (content: string): boolean => {
    const lower = content.toLowerCase()
    return TASK_KEYWORDS.some((kw) => lower.includes(kw))
  }

  return (
    <div className="flex h-full flex-col bg-black">
      {/* Header — tên module + tên tài liệu đang xem */}
      <div className="flex items-center gap-2.5 border-b border-white/10 bg-black px-4 py-3">
        <Bot size={16} className="text-indigo-400" aria-hidden />
        <h2 className="text-sm font-semibold text-white/80">AI Document Management</h2>
        {selectedDoc && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-1 text-[11px] font-medium text-indigo-300">
            <FileText size={10} aria-hidden />
            {selectedDoc.name}
          </span>
        )}
      </div>

      {/* Khu vực tin nhắn */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* Trạng thái rỗng — chưa có tin nhắn */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            {selectedDoc ? (
              <>
                <div className="rounded-full bg-indigo-500/20 p-4">
                  <Bot size={24} className="text-indigo-400" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Đã đọc xong{' '}
                    <span className="font-semibold text-indigo-300">{selectedDoc.name}</span>
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {selectedDoc.pageCount ? `(${selectedDoc.pageCount} trang). ` : ''}
                    Bạn muốn hỏi gì về tài liệu này?
                  </p>
                </div>

                {/* Câu hỏi gợi ý */}
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendQuickQuestion(q)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300"
                    >
                      {q}
                    </button>
                  ))}

                  {/* Nút chuyển sang Kanban Task Board */}
                  <button
                    onClick={() => router.push('/todo-tasks')}
                    className="flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
                  >
                    <LayoutGrid size={12} aria-hidden />
                    Break down task
                  </button>
                </div>
              </>
            ) : (
              // Chưa có tài liệu nào được chọn
              <div className="text-center">
                <div className="mb-3 rounded-full bg-white/5 p-4 inline-block">
                  <FileText size={24} className="text-white/20" aria-hidden />
                </div>
                <p className="text-sm text-white/30">Tải lên tài liệu để bắt đầu hỏi đáp</p>
              </div>
            )}
          </div>
        )}

        {/* Danh sách tin nhắn */}
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
            >
              {/* Avatar */}
              <div className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                msg.role === 'user' ? 'bg-white/10' : 'bg-indigo-500/20'
              )} aria-hidden>
                {msg.role === 'user'
                  ? <User size={14} className="text-gray-400" />
                  : <Bot size={14} className="text-indigo-400" />
                }
              </div>

              {/* Bubble nội dung */}
              <div className={cn(
                'max-w-[72%] rounded-2xl px-3.5 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'rounded-tr-sm bg-indigo-600 text-white'
                  : 'rounded-tl-sm bg-white/10 text-white/90 ring-1 ring-white/10'
              )}>
                {msg.role === 'user' ? (
                  <p className="leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                )}

                {/* Gợi ý Task Board nếu AI đề cập đến task/breakdown */}
                {msg.role === 'assistant' && shouldShowTaskButton(msg.content) && (
                  <button
                    onClick={() => router.push('/todo-tasks')}
                    className="mt-2 flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
                  >
                    <LayoutGrid size={11} aria-hidden />
                    Xem Task Board
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator khi AI đang phản hồi */}
          {isLoading && (
            <div className="flex gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20" aria-hidden>
                <Bot size={14} className="text-indigo-400" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 ring-1 ring-white/10">
                <Loader2 size={13} className="animate-spin text-indigo-400" aria-hidden />
                <span className="text-xs text-white/40">Đang phân tích...</span>
              </div>
            </div>
          )}
        </div>

        {/* Anchor để cuộn xuống cuối */}
        <div ref={bottomRef} />
      </div>

      {/* Input gửi câu hỏi */}
      <div className="border-t border-white/10 bg-black px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
            onKeyDown={(e) => {
              // Enter gửi tin nhắn, Shift+Enter xuống dòng
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
              }
            }}
            placeholder={selectedDoc ? 'Hỏi về tài liệu... (Enter để gửi)' : 'Tải lên tài liệu trước...'}
            disabled={isLoading || !selectedDoc}
            rows={1}
            aria-label="Nhập câu hỏi về tài liệu"
            className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50 placeholder:text-white/20"
            style={{ maxHeight: '120px', minHeight: '42px' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !selectedDoc}
            aria-label="Gửi câu hỏi"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-700 disabled:opacity-40"
          >
            <Send size={15} aria-hidden />
          </button>
        </form>
      </div>
    </div>
  )
}
