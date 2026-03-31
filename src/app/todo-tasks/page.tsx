'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Sparkles, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useAISettings } from '@/hooks/use-ai-settings'

interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in-progress' | 'done'
}

interface Column {
  id: string
  title: string
  color: string
  tasks: Task[]
}

const PRIORITY_COLORS = {
  high:   'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low:    'bg-green-500/20 text-green-400 border-green-500/30',
}

const STATUS_COLORS = {
  'todo':        'bg-white/5 text-white/40',
  'in-progress': 'bg-indigo-500/20 text-indigo-400',
  'done':        'bg-emerald-500/20 text-emerald-400',
}

const COLUMN_COLORS: Record<string, string> = {
  devops: 'from-orange-500 to-amber-500',
  be: 'from-blue-500 to-cyan-500',
  fe: 'from-violet-500 to-purple-500',
  qa: 'from-emerald-500 to-teal-500',
}

const EMPTY_COLUMNS: Column[] = [
  { id: 'devops', title: 'DevOps', color: COLUMN_COLORS.devops, tasks: [] },
  { id: 'be', title: 'Backend', color: COLUMN_COLORS.be, tasks: [] },
  { id: 'fe', title: 'Frontend', color: COLUMN_COLORS.fe, tasks: [] },
  { id: 'qa', title: 'QA', color: COLUMN_COLORS.qa, tasks: [] },
]

function TodoTasksContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useAISettings()

  const [columns, setColumns] = useState<Column[]>(EMPTY_COLUMNS)
  const [addingIn, setAddingIn] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // AI breakdown state
  const [aiInput, setAiInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(true)
  const [notTechnical, setNotTechnical] = useState<{ reason: string; documentType: string } | null>(null)

  // Nhận nội dung tài liệu từ Document Analyst qua sessionStorage
  useEffect(() => {
    const fromDoc = searchParams.get('from') === 'document'
    if (fromDoc) {
      try {
        const content = sessionStorage.getItem('break_task_content')
        const docName = sessionStorage.getItem('break_task_docname')
        if (content) {
          setAiInput(docName ? `[Tài liệu: ${docName}]\n\n${content}` : content)
          sessionStorage.removeItem('break_task_content')
          sessionStorage.removeItem('break_task_docname')
        }
      } catch { /* ignore */ }
    }
  }, [searchParams])

  const generateTasks = async () => {
    if (!aiInput.trim()) return
    setIsGenerating(true)
    setAiError(null)
    setNotTechnical(null)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-provider': settings.provider,
        'x-model': settings.modelId,
        ...(settings.apiKey ? { 'x-api-key': settings.apiKey } : {}),
      }

      const res = await fetch('/api/break-tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({ description: aiInput }),
      })

      const data = await res.json()
      if (!res.ok) {
        setAiError(data.error || 'Lỗi khi gọi AI')
        return
      }

      // Bước 1: Kiểm tra tài liệu có phải kỹ thuật không
      if (data.isTechnical === false) {
        setNotTechnical({ reason: data.reason, documentType: data.documentType })
        return
      }

      // Bước 2: Map AI response vào columns
      const newColumns: Column[] = EMPTY_COLUMNS.map((col) => {
        const aiCol = data.columns?.find(
          (c: { id: string }) => c.id === col.id
        )
        if (!aiCol) return { ...col, tasks: [] }
        return {
          ...col,
          tasks: aiCol.tasks.map((t: { title: string; priority: string }, i: number) => ({
            id: `${col.id}-${Date.now()}-${i}`,
            title: t.title,
            priority: t.priority as Task['priority'],
            status: 'todo' as Task['status'],
          })),
        }
      })

      setColumns(newColumns)
      setNotTechnical(null)
      setShowAiPanel(false)
    } catch {
      setAiError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  const addTask = (columnId: string) => {
    if (!newTaskTitle.trim()) { setAddingIn(null); return }
    const task: Task = {
      id: Math.random().toString(36).slice(2),
      title: newTaskTitle.trim(),
      priority: 'medium',
      status: 'todo',
    }
    setColumns((cols) =>
      cols.map((c) => c.id === columnId ? { ...c, tasks: [...c.tasks, task] } : c)
    )
    setNewTaskTitle('')
    setAddingIn(null)
  }

  const cycleStatus = (columnId: string, taskId: string) => {
    const cycle: Task['status'][] = ['todo', 'in-progress', 'done']
    setColumns((cols) =>
      cols.map((c) =>
        c.id !== columnId ? c : {
          ...c,
          tasks: c.tasks.map((t) =>
            t.id !== taskId ? t : {
              ...t,
              status: cycle[(cycle.indexOf(t.status) + 1) % cycle.length],
            }
          ),
        }
      )
    )
  }

  const totalTasks = columns.reduce((sum, c) => sum + c.tasks.length, 0)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 px-5 py-3">
        <button
          onClick={() => router.push('/document-analyst')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          <span className="text-xs font-medium">AI Document Management</span>
        </button>
        <div className="h-4 w-px bg-white/10" />
        <h1 className="text-sm font-semibold text-white/80">Task Board</h1>

        {/* Toggle AI panel */}
        <button
          onClick={() => setShowAiPanel(!showAiPanel)}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
        >
          <Sparkles size={12} />
          AI Break Task
          {showAiPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* AI Panel */}
      {showAiPanel && (
        <div className="border-b border-white/10 bg-white/[0.02] px-5 py-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-indigo-500/20 p-2">
                <Sparkles size={14} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-white/70 mb-2">
                  Mô tả dự án hoặc dán nội dung tài liệu — AI sẽ tự động phân tách thành các task
                </p>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ví dụ: Xây dựng hệ thống e-commerce với Next.js, có tính năng giỏ hàng, thanh toán Stripe, quản lý sản phẩm..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/30 placeholder:text-white/20"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={generateTasks}
                    disabled={isGenerating || !aiInput.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-indigo-700 disabled:opacity-40"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Đang phân tích...
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        Tạo task
                      </>
                    )}
                  </button>
                  {totalTasks > 0 && (
                    <button
                      onClick={() => { setColumns(EMPTY_COLUMNS); setShowAiPanel(true) }}
                      className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors"
                    >
                      <X size={12} />
                      Xoá board
                    </button>
                  )}
                  {aiError && (
                    <span className="text-xs text-red-400">{aiError}</span>
                  )}
                </div>

                {/* Cảnh báo: không phải tài liệu kỹ thuật */}
                {notTechnical && (
                  <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <p className="text-xs font-medium text-amber-300">
                      Không phải tài liệu kỹ thuật phần mềm
                    </p>
                    <p className="mt-1 text-[11px] text-amber-200/70">
                      <span className="font-medium">Loại tài liệu:</span> {notTechnical.documentType}
                    </p>
                    <p className="mt-0.5 text-[11px] text-amber-200/70">
                      {notTechnical.reason}
                    </p>
                    <p className="mt-2 text-[11px] text-white/40">
                      Chỉ hỗ trợ break task cho tài liệu phần mềm (SRS, BRD, PRD, API Spec, mô tả dự án phần mềm, v.v.)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden p-5">
        {columns.map((col) => {
          const doneCount = col.tasks.filter((t) => t.status === 'done').length

          return (
            <div key={col.id} className="flex w-64 shrink-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03]">
              {/* Column header */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${col.color}`} />
                    <span className="text-sm font-semibold text-white/80">{col.title}</span>
                  </div>
                  <span className="text-[11px] text-white/30">{doneCount}/{col.tasks.length}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${col.color} transition-all duration-500`}
                    style={{ width: col.tasks.length ? `${(doneCount / col.tasks.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Tasks */}
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-2">
                {col.tasks.length === 0 && !addingIn && (
                  <p className="px-2 py-4 text-center text-[11px] text-white/15">Chưa có task</p>
                )}
                {col.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => cycleStatus(col.id, task.id)}
                    className={`cursor-pointer rounded-xl border border-white/5 bg-white/[0.04] p-3 transition-all hover:border-white/10 hover:bg-white/[0.07] ${task.status === 'done' ? 'opacity-50' : ''}`}
                  >
                    <p className={`text-xs leading-relaxed text-white/80 ${task.status === 'done' ? 'line-through' : ''}`}>
                      {task.title}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${STATUS_COLORS[task.status]}`}>
                        {task.status === 'todo' ? 'Todo' : task.status === 'in-progress' ? 'In Progress' : 'Done'}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Add task input */}
                {addingIn === col.id ? (
                  <div className="rounded-xl border border-indigo-500/40 bg-white/5 p-2">
                    <input
                      autoFocus
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addTask(col.id); if (e.key === 'Escape') { setAddingIn(null); setNewTaskTitle('') } }}
                      placeholder="Tên task..."
                      className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/30"
                    />
                    <div className="mt-2 flex gap-1.5">
                      <button onClick={() => addTask(col.id)} className="rounded-lg bg-indigo-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-indigo-700">
                        Thêm
                      </button>
                      <button onClick={() => { setAddingIn(null); setNewTaskTitle('') }} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/40 hover:text-white/60">
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingIn(col.id)}
                    className="flex items-center gap-1.5 rounded-xl px-2 py-2 text-xs text-white/20 transition-colors hover:bg-white/5 hover:text-white/50"
                  >
                    <Plus size={13} /> Thêm task
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="pb-3 text-center text-[10px] text-white/20">
        Click vào task để chuyển trạng thái · AI Break Task tạo task tự động từ mô tả
      </p>
    </div>
  )
}

export default function TodoTasksPage() {
  return (
    <Suspense>
      <TodoTasksContent />
    </Suspense>
  )
}
