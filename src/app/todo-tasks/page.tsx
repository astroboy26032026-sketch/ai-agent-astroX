'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Sparkles, Loader2, ChevronDown, ChevronUp,
  AlertCircle, Trash2,
} from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useAISettings } from '@/hooks/use-ai-settings'
import { EMPTY_COLUMNS } from './constants'
import { GroupTable } from './components'
import type { Task, SubTask, Column } from './types'

/* ──────────────────────── Main Page ──────────────────────── */

function TodoTasksContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useAISettings()

  const [columns, setColumns] = useState<Column[]>(EMPTY_COLUMNS)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // AI state
  const [aiInput, setAiInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(true)
  const [notTechnical, setNotTechnical] = useState<{ reason: string; documentType: string } | null>(null)
  const [breakingTaskId, setBreakingTaskId] = useState<string | null>(null)

  // Nhận tài liệu từ Document Analyst
  useEffect(() => {
    if (searchParams.get('from') !== 'document') return
    try {
      const content = sessionStorage.getItem('break_task_content')
      const docName = sessionStorage.getItem('break_task_docname')
      if (content) {
        setAiInput(docName ? `[Tài liệu: ${docName}]\n\n${content}` : content)
        sessionStorage.removeItem('break_task_content')
        sessionStorage.removeItem('break_task_docname')
      }
    } catch { /* ignore */ }
  }, [searchParams])

  /* ── AI generate tasks ── */
  const generateTasks = async () => {
    if (!aiInput.trim()) return
    setIsGenerating(true)
    setAiError(null)
    setNotTechnical(null)

    try {
      const res = await fetch('/api/break-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': settings.provider,
          'x-model': settings.modelId,
          ...(settings.apiKey ? { 'x-api-key': settings.apiKey } : {}),
        },
        body: JSON.stringify({ description: aiInput }),
      })

      const data = await res.json()
      if (!res.ok) { setAiError(data.error || 'Lỗi khi gọi AI'); return }

      if (data.isTechnical === false) {
        setNotTechnical({ reason: data.reason, documentType: data.documentType })
        return
      }

      setColumns(
        EMPTY_COLUMNS.map((col) => {
          const aiCol = data.columns?.find((c: { id: string }) => c.id === col.id)
          if (!aiCol) return { ...col, tasks: [] }
          return {
            ...col,
            tasks: aiCol.tasks.map((t: { title: string; priority: string }, i: number) => ({
              id: `${col.id}-${Date.now()}-${i}`,
              title: t.title,
              priority: t.priority as Task['priority'],
              status: 'todo' as Task['status'],
              assignee: '',
              subtasks: [],
            })),
          }
        }),
      )
      setNotTechnical(null)
      setShowAiPanel(false)
    } catch {
      setAiError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  /* ── AI break subtasks ── */
  const breakSubtasks = async (colId: string, taskId: string) => {
    const col = columns.find((c) => c.id === colId)
    const task = col?.tasks.find((t) => t.id === taskId)
    if (!task) return

    setBreakingTaskId(taskId)
    try {
      const res = await fetch('/api/break-subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': settings.provider,
          'x-model': settings.modelId,
          ...(settings.apiKey ? { 'x-api-key': settings.apiKey } : {}),
        },
        body: JSON.stringify({
          taskTitle: task.title,
          groupTitle: col?.title,
          projectContext: aiInput || null,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.subtasks) return

      setColumns((cols) =>
        cols.map((c) =>
          c.id !== colId ? c : {
            ...c,
            tasks: c.tasks.map((t) =>
              t.id !== taskId ? t : {
                ...t,
                subtasks: data.subtasks.map((s: { title: string; priority: string }, i: number) => ({
                  id: `${taskId}-sub-${Date.now()}-${i}`,
                  title: s.title,
                  priority: s.priority as SubTask['priority'],
                  status: 'todo' as SubTask['status'],
                  assignee: '',
                })),
              },
            ),
          },
        ),
      )
    } catch { /* ignore */ }
    finally { setBreakingTaskId(null) }
  }

  /* ── CRUD: tasks ── */
  const cycleStatus = (colId: string, taskId: string) => {
    const order: Task['status'][] = ['todo', 'in-progress', 'done']
    setColumns((cols) =>
      cols.map((c) => c.id !== colId ? c : {
        ...c,
        tasks: c.tasks.map((t) => t.id !== taskId ? t : { ...t, status: order[(order.indexOf(t.status) + 1) % 3] }),
      }),
    )
  }

  const cyclePriority = (colId: string, taskId: string) => {
    const order: Task['priority'][] = ['low', 'medium', 'high']
    setColumns((cols) =>
      cols.map((c) => c.id !== colId ? c : {
        ...c,
        tasks: c.tasks.map((t) => t.id !== taskId ? t : { ...t, priority: order[(order.indexOf(t.priority) + 1) % 3] }),
      }),
    )
  }

  const addTask = (colId: string, title: string) => {
    setColumns((cols) =>
      cols.map((c) => c.id !== colId ? c : {
        ...c,
        tasks: [...c.tasks, { id: Math.random().toString(36).slice(2), title, priority: 'medium' as const, status: 'todo' as const, assignee: '', subtasks: [] }],
      }),
    )
  }

  const deleteTask = (colId: string, taskId: string) => {
    setColumns((cols) =>
      cols.map((c) => c.id !== colId ? c : { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }),
    )
  }

  /* ── CRUD: subtasks ── */
  const cycleSubStatus = (colId: string, taskId: string, subId: string) => {
    const order: SubTask['status'][] = ['todo', 'in-progress', 'done']
    setColumns((cols) =>
      cols.map((c) => c.id !== colId ? c : {
        ...c,
        tasks: c.tasks.map((t) => t.id !== taskId ? t : {
          ...t,
          subtasks: t.subtasks.map((s) => s.id !== subId ? s : { ...s, status: order[(order.indexOf(s.status) + 1) % 3] }),
        }),
      }),
    )
  }

  const cycleSubPriority = (colId: string, taskId: string, subId: string) => {
    const order: SubTask['priority'][] = ['low', 'medium', 'high']
    setColumns((cols) =>
      cols.map((c) => c.id !== colId ? c : {
        ...c,
        tasks: c.tasks.map((t) => t.id !== taskId ? t : {
          ...t,
          subtasks: t.subtasks.map((s) => s.id !== subId ? s : { ...s, priority: order[(order.indexOf(s.priority) + 1) % 3] }),
        }),
      }),
    )
  }

  const deleteSubtask = (colId: string, taskId: string, subId: string) => {
    setColumns((cols) =>
      cols.map((c) => c.id !== colId ? c : {
        ...c,
        tasks: c.tasks.map((t) => t.id !== taskId ? t : {
          ...t,
          subtasks: t.subtasks.filter((s) => s.id !== subId),
        }),
      }),
    )
  }

  const assignTask = (colId: string, taskId: string, name: string) => {
    setColumns((cols) =>
      cols.map((c) => c.id !== colId ? c : {
        ...c,
        tasks: c.tasks.map((t) => t.id !== taskId ? t : { ...t, assignee: name }),
      }),
    )
  }

  const assignSubtask = (colId: string, taskId: string, subId: string, name: string) => {
    setColumns((cols) =>
      cols.map((c) => c.id !== colId ? c : {
        ...c,
        tasks: c.tasks.map((t) => t.id !== taskId ? t : {
          ...t,
          subtasks: t.subtasks.map((s) => s.id !== subId ? s : { ...s, assignee: name }),
        }),
      }),
    )
  }

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  /* ── Stats ── */
  const totalTasks = columns.reduce((s, c) => s + c.tasks.length, 0)
  const totalDone = columns.reduce((s, c) => s + c.tasks.filter((t) => t.status === 'done').length, 0)
  const totalPct = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0

  /* ──────────────────────── Render ──────────────────────── */
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#181b34]">
      {/* Top bar */}
      <div className="flex items-center gap-4 border-b border-white/10 px-6 py-3">
        <button onClick={() => router.push('/document-analyst')} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={15} />
          <span className="text-xs font-medium">Quay lại</span>
        </button>
        <div className="h-4 w-px bg-white/10" />
        <h1 className="text-sm font-bold text-white">Task Board</h1>

        {totalTasks > 0 && (
          <div className="ml-4 flex items-center gap-2.5">
            <span className="text-[11px] text-white/40">{totalDone}/{totalTasks}</span>
            <div className="h-[5px] w-28 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#00c875] transition-all duration-500" style={{ width: `${totalPct}%` }} />
            </div>
            <span className="text-[11px] font-bold text-[#00c875]">{totalPct}%</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {totalTasks > 0 && (
            <button
              onClick={() => { setColumns(EMPTY_COLUMNS); setShowAiPanel(true) }}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/40 hover:text-red-400 hover:border-red-500/30 transition-colors"
            >
              <Trash2 size={11} /> Clear
            </button>
          )}
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="flex items-center gap-1.5 rounded-lg bg-[#6161ff] px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#5050ee]"
          >
            <Sparkles size={12} /> AI Break Task
            {showAiPanel ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* AI Panel */}
      {showAiPanel && (
        <div className="border-b border-white/10 bg-[#1e2140] px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-[#6161ff]/20 p-2.5">
                <Sparkles size={15} className="text-[#6161ff]" />
              </div>
              <div className="flex-1">
                <p className="mb-2 text-xs font-semibold text-white/80">
                  Mô tả dự án hoặc dán nội dung tài liệu — AI sẽ tự phân tách thành task
                </p>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ví dụ: Xây dựng hệ thống e-commerce với Next.js, có tính năng giỏ hàng, thanh toán Stripe..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all focus:border-[#6161ff]/50 focus:ring-1 focus:ring-[#6161ff]/30 placeholder:text-white/20"
                />
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={generateTasks}
                    disabled={isGenerating || !aiInput.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-[#6161ff] px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#5050ee] disabled:opacity-40"
                  >
                    {isGenerating
                      ? <><Loader2 size={13} className="animate-spin" /> Đang phân tích...</>
                      : <><Sparkles size={13} /> Tạo task</>
                    }
                  </button>
                  {aiError && (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle size={12} /> {aiError}
                    </span>
                  )}
                </div>
                {notTechnical && (
                  <div className="mt-3 rounded-xl border border-[#fdab3d]/30 bg-[#fdab3d]/10 px-4 py-3">
                    <p className="text-xs font-semibold text-[#fdab3d]">Không phải tài liệu kỹ thuật phần mềm</p>
                    <p className="mt-1 text-[11px] text-[#fdab3d]/70"><b>Loại:</b> {notTechnical.documentType}</p>
                    <p className="mt-0.5 text-[11px] text-[#fdab3d]/70">{notTechnical.reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-5xl">
          {columns.map((col) => (
            <GroupTable
              key={col.id}
              column={col}
              onCycleStatus={(tid) => cycleStatus(col.id, tid)}
              onCyclePriority={(tid) => cyclePriority(col.id, tid)}
              onAddTask={(title) => addTask(col.id, title)}
              onDeleteTask={(tid) => deleteTask(col.id, tid)}
              onBreakSubtask={(tid) => breakSubtasks(col.id, tid)}
              breakingTaskId={breakingTaskId}
              onCycleSubStatus={(tid, sid) => cycleSubStatus(col.id, tid, sid)}
              onCycleSubPriority={(tid, sid) => cycleSubPriority(col.id, tid, sid)}
              onDeleteSubtask={(tid, sid) => deleteSubtask(col.id, tid, sid)}
              onAssign={(tid, name) => assignTask(col.id, tid, name)}
              onSubAssign={(tid, sid, name) => assignSubtask(col.id, tid, sid, name)}
              collapsed={collapsedGroups.has(col.id)}
              onToggle={() => toggleGroup(col.id)}
            />
          ))}

          {totalTasks === 0 && !showAiPanel && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 rounded-2xl bg-white/5 p-6"><Sparkles size={32} className="text-[#6161ff]/40" /></div>
              <p className="text-sm font-medium text-white/40">Chưa có task nào</p>
              <p className="mt-1 text-xs text-white/20">Dùng AI Break Task để tạo tự động</p>
              <button onClick={() => setShowAiPanel(true)} className="mt-4 rounded-lg bg-[#6161ff] px-5 py-2 text-xs font-semibold text-white hover:bg-[#5050ee] transition-colors">
                Mở AI Break Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.05] px-6 py-2">
        <p className="text-center text-[10px] text-white/15">
          Click Status / Priority để thay đổi · Nút Break để tách subtask · Hover để xoá
        </p>
      </div>
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
