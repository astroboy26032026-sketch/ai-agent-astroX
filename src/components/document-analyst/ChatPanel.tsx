'use client'

/**
 * ChatPanel
 * Giao diện chat với AI để phân tích tài liệu đã upload hoặc ý tưởng.
 * Kết nối tới /api/document-chat, hỗ trợ multi-provider qua useAISettings.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { Send, Bot, User, Loader2, FileText, LayoutGrid, Lightbulb, Upload } from 'lucide-react'
import { toast } from 'sonner'
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

/** Gợi ý cho chế độ ý tưởng */
const IDEA_SUGGESTIONS = [
  'Tôi muốn xây dựng app e-commerce',
  'Tôi có ý tưởng về hệ thống quản lý nhân sự',
  'Tôi muốn làm một SaaS platform',
  'Tôi cần thiết kế API cho mobile app',
]

/**
 * Từ khoá trong response AI để hiện nút "Xem Task Board".
 */
const TASK_KEYWORDS = ['task', 'breakdown', 'công việc', 'break down']

interface ChatPanelProps {
  selectedDoc: UploadedDocument | null
}

export default function ChatPanel({ selectedDoc }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { settings } = useAISettings()
  const [ideaMode, setIdeaMode] = useState(false)

  const chatHeaders: Record<string, string> = {
    'x-provider': settings.provider,
    'x-model': settings.modelId,
    ...(settings.apiKey ? { 'x-api-key': settings.apiKey } : {}),
  }

  const chatBody = {
    documentContent: selectedDoc?.content ?? null,
    documentName: selectedDoc?.name ?? null,
    ideaMode: !selectedDoc && ideaMode,
  }

  const { messages, input, handleSubmit, handleInputChange, isLoading, setMessages, append } =
    useChat({
      api: '/api/document-chat',
      body: chatBody,
      headers: chatHeaders,
      onError: (error) => {
        toast.error(`Lỗi AI: ${error.message}`)
      },
    })

  // Reset lịch sử chat khi đổi tài liệu
  useEffect(() => {
    setMessages([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoc?.id])

  // Khi chọn tài liệu, tắt idea mode
  useEffect(() => {
    if (selectedDoc) setIdeaMode(false)
  }, [selectedDoc])

  // Tự cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendQuickQuestion = (q: string) => {
    append({ role: 'user', content: q }, { body: chatBody })
  }

  const shouldShowTaskButton = (content: string): boolean => {
    const lower = content.toLowerCase()
    return TASK_KEYWORDS.some((kw) => lower.includes(kw))
  }

  // Gom toàn bộ nội dung chat thành text để gửi sang Task Board
  const buildChatSummaryForTasks = () => {
    return messages
      .map((m) => (m.role === 'user' ? `[User]: ${m.content}` : `[AI]: ${m.content}`))
      .join('\n\n')
  }

  const goToTaskBoard = () => {
    try {
      if (selectedDoc) {
        sessionStorage.setItem('break_task_content', selectedDoc.content)
        sessionStorage.setItem('break_task_docname', selectedDoc.name)
      } else if (ideaMode && messages.length > 0) {
        // Gom toàn bộ chat ý tưởng gửi sang task board
        sessionStorage.setItem('break_task_content', buildChatSummaryForTasks())
        sessionStorage.setItem('break_task_docname', 'Ý tưởng dự án')
      }
    } catch { /* ignore */ }
    router.push('/todo-tasks?from=document')
  }

  // Cho phép chat khi có tài liệu HOẶC đang ở idea mode
  const canChat = !!selectedDoc || ideaMode

  // Hiện nút break task khi idea mode có ít nhất 1 response từ AI
  const showIdeaBreakTask = ideaMode && !selectedDoc && messages.some((m) => m.role === 'assistant')

  return (
    <div className="flex h-full flex-col bg-black">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/10 bg-black px-4 py-3">
        <Bot size={16} className="text-indigo-400" aria-hidden />
        <h2 className="text-sm font-semibold text-white/80">AI Document Management</h2>
        {selectedDoc && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-1 text-[11px] font-medium text-indigo-300">
            <FileText size={10} aria-hidden />
            {selectedDoc.name}
          </span>
        )}
        {!selectedDoc && ideaMode && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300">
            <Lightbulb size={10} aria-hidden />
            Chế độ ý tưởng
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
                  <button
                    onClick={goToTaskBoard}
                    className="flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
                  >
                    <LayoutGrid size={12} aria-hidden />
                    Break down task
                  </button>
                </div>
              </>
            ) : ideaMode ? (
              /* Chế độ ý tưởng */
              <>
                <div className="rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-4">
                  <Lightbulb size={24} className="text-amber-400" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Hãy mô tả ý tưởng của bạn
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    AI sẽ giúp bạn phân tích, lên kế hoạch và tạo task từ ý tưởng
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {IDEA_SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendQuickQuestion(q)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIdeaMode(false)}
                  className="mt-2 text-[11px] text-white/30 hover:text-white/50 transition-colors"
                >
                  ← Quay lại tải tài liệu
                </button>
              </>
            ) : (
              /* Chưa có tài liệu — hiện 2 lựa chọn */
              <>
                <div className="rounded-full bg-white/5 p-4">
                  <Bot size={24} className="text-white/30" aria-hidden />
                </div>
                <p className="text-sm font-medium text-white/60">Bạn muốn bắt đầu như thế nào?</p>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                  <button
                    onClick={() => {
                      const fileInput = document.querySelector('input[type="file"][accept=".pdf,.doc,.docx"]') as HTMLInputElement
                      fileInput?.click()
                    }}
                    className="flex-1 group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/5"
                  >
                    <div className="rounded-full bg-indigo-500/20 p-3 transition-colors group-hover:bg-indigo-500/30">
                      <Upload size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/80">Tải tài liệu lên</p>
                      <p className="mt-1 text-[11px] text-white/40 leading-relaxed">
                        PDF, Word — AI sẽ đọc và phân tích nội dung
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setIdeaMode(true)}
                    className="flex-1 group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-amber-500/40 hover:bg-amber-500/5"
                  >
                    <div className="rounded-full bg-amber-500/20 p-3 transition-colors group-hover:bg-amber-500/30">
                      <Lightbulb size={20} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/80">Tôi có ý tưởng</p>
                      <p className="mt-1 text-[11px] text-white/40 leading-relaxed">
                        Chưa có tài liệu? Mô tả ý tưởng để AI giúp bạn
                      </p>
                    </div>
                  </button>
                </div>
              </>
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
              <div className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                msg.role === 'user' ? 'bg-white/10' : 'bg-indigo-500/20'
              )} aria-hidden>
                {msg.role === 'user'
                  ? <User size={14} className="text-gray-400" />
                  : <Bot size={14} className="text-indigo-400" />
                }
              </div>

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

                {msg.role === 'assistant' && shouldShowTaskButton(msg.content) && (
                  <button
                    onClick={goToTaskBoard}
                    className="mt-2 flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
                  >
                    <LayoutGrid size={11} aria-hidden />
                    Xem Task Board
                  </button>
                )}
              </div>
            </div>
          ))}

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

        <div ref={bottomRef} />
      </div>

      {/* Nút Break down task — hiện khi idea mode có response AI */}
      {showIdeaBreakTask && (
        <div className="border-t border-white/10 bg-white/[0.02] px-4 py-2.5">
          <button
            onClick={goToTaskBoard}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-indigo-700"
          >
            <LayoutGrid size={14} />
            Break down task từ ý tưởng
          </button>
        </div>
      )}

      {/* Input gửi câu hỏi */}
      <div className="border-t border-white/10 bg-black px-4 py-3">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e, { body: chatBody }) }} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>, { body: chatBody })
              }
            }}
            placeholder={selectedDoc ? 'Hỏi về tài liệu... (Enter để gửi)' : ideaMode ? 'Mô tả ý tưởng của bạn... (Enter để gửi)' : 'Tải lên tài liệu hoặc chọn "Tôi có ý tưởng"...'}
            disabled={isLoading || !canChat}
            rows={1}
            aria-label="Nhập câu hỏi"
            className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50 placeholder:text-white/20"
            style={{ maxHeight: '120px', minHeight: '42px' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !canChat}
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
