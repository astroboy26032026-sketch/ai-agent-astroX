'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Plus, Sparkles, Loader2, ChevronDown, ChevronUp,
  GripVertical, Check, Clock, Circle, AlertCircle, Trash2,
} from 'lucide-react'
import { useState, useEffect, Suspense, useRef } from 'react'
import { useAISettings } from '@/hooks/use-ai-settings'
import { cn } from '@/lib/utils'

/* ──────────────────────── Types ──────────────────────── */

interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in-progress' | 'done'
}

interface Column {
  id: string
  title: string
  accent: string
  tasks: Task[]
}

/* ──────────────────────── Constants ──────────────────────── */

const STATUS_CFG = {
  'todo':        { label: 'Todo',       bg: '#c4c4c4', icon: Circle },
  'in-progress': { label: 'Working on it', bg: '#fdab3d', icon: Clock },
  'done':        { label: 'Done',       bg: '#00c875', icon: Check },
} as const

const PRIORITY_CFG = {
  high:   { label: 'Critical', color: '#e2445c' },
  medium: { label: 'Medium',   color: '#fdab3d' },
  low:    { label: 'Low',      color: '#579bfc' },
} as const

const GROUP_ACCENTS: Record<string, string> = {
  devops: '#fdab3d',
  be:     '#579bfc',
  fe:     '#a25ddc',
  qa:     '#00c875',
}

const EMPTY_COLUMNS: Column[] = [
  { id: 'devops', title: 'DevOps',   accent: GROUP_ACCENTS.devops, tasks: [] },
  { id: 'be',     title: 'Backend',  accent: GROUP_ACCENTS.be,     tasks: [] },
  { id: 'fe',     title: 'Frontend', accent: GROUP_ACCENTS.fe,     tasks: [] },
  { id: 'qa',     title: 'QA',       accent: GROUP_ACCENTS.qa,     tasks: [] },
]

/* ──────────────────────── Small components ──────────────────────── */

function StatusPill({ status, onClick }: { status: Task['status']; onClick: () => void }) {
  const cfg = STATUS_CFG[status]
  const Icon = cfg.icon
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="flex items-center justify-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-80"
      style={{ backgroundColor: cfg.bg, minWidth: 100 }}
    >
      <Icon size={11} />
      {cfg.label}
    </button>
  )
}

function PriorityPill({ priority, onClick }: { priority: Task['priority']; onClick: () => void }) {
  const cfg = PRIORITY_CFG[priority]
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="flex items-center justify-center rounded px-2.5 py-1 text-[11px] font-bold transition-opacity hover:opacity-80"
      style={{ border: `2px solid ${cfg.color}`, color: cfg.color, minWidth: 80 }}
    >
      {cfg.label}
    </button>
  )
}

/* ──────────────────────── Group Table ──────────────────────── */

function GroupTable({
  column, onCycleStatus, onCyclePriority, onAddTask, onDeleteTask, collapsed, onToggle,
}: {
  column: Column
  onCycleStatus: (taskId: string) => void
  onCyclePriority: (taskId: string) => void
  onAddTask: (title: string) => void
  onDeleteTask: (taskId: string) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const doneCount = column.tasks.filter((t) => t.status === 'done').length
  const pct = column.tasks.length ? Math.round((doneCount / column.tasks.length) * 100) : 0

  useEffect(() => { if (adding) inputRef.current?.focus() }, [adding])

  const commitAdd = () => {
    if (draft.trim()) onAddTask(draft.trim())
    setDraft('')
    setAdding(false)
  }

  return (
    <div className="mb-5 overflow-hidden rounded-lg" style={{ border: '1px solid rgba(255,255,255,.07)' }}>
      {/* ── Group header ── */}
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ borderLeft: `4px solid ${column.accent}` }}
      >
        <button onClick={onToggle} className="text-white/40 hover:text-white/70 transition-colors">
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
        <span className="text-[13px] font-bold" style={{ color: column.accent }}>{column.title}</span>
        <span className="text-[11px] text-white/30">{column.tasks.length} tasks</span>

        {column.tasks.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <div className="h-[5px] w-20 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: column.accent }}
              />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: column.accent }}>{pct}%</span>
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          {/* ── Column headers row ── */}
          <div
            className="grid items-center border-t border-b text-[10px] font-semibold uppercase tracking-wider text-white/25 py-2 px-4"
            style={{
              gridTemplateColumns: '1fr 110px 90px 36px',
              borderColor: 'rgba(255,255,255,.07)',
              borderLeft: `4px solid ${column.accent}`,
            }}
          >
            <span>Task</span>
            <span className="text-center">Status</span>
            <span className="text-center">Priority</span>
            <span />
          </div>

          {/* ── Rows ── */}
          {column.tasks.length === 0 && !adding && (
            <div
              className="py-8 text-center text-[11px] text-white/15"
              style={{ borderLeft: `4px solid ${column.accent}` }}
            >
              Chưa có task nào
            </div>
          )}

          {column.tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'group grid items-center py-2.5 px-4 transition-colors hover:bg-white/[0.025]',
                task.status === 'done' && 'opacity-40',
              )}
              style={{
                gridTemplateColumns: '1fr 110px 90px 36px',
                borderLeft: `4px solid ${column.accent}`,
                borderBottom: '1px solid rgba(255,255,255,.04)',
              }}
            >
              {/* Title */}
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <GripVertical size={12} className="shrink-0 text-white/0 group-hover:text-white/20 transition-colors cursor-grab" />
                <span className={cn(
                  'text-[13px] text-white/80 truncate',
                  task.status === 'done' && 'line-through text-white/40',
                )}>
                  {task.title}
                </span>
              </div>

              {/* Status */}
              <div className="flex justify-center">
                <StatusPill status={task.status} onClick={() => onCycleStatus(task.id)} />
              </div>

              {/* Priority */}
              <div className="flex justify-center">
                <PriorityPill priority={task.priority} onClick={() => onCyclePriority(task.id)} />
              </div>

              {/* Delete */}
              <div className="flex justify-center">
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id) }}
                  className="text-transparent group-hover:text-white/20 hover:!text-red-400 transition-colors p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* ── Add task ── */}
          {adding ? (
            <div
              className="grid items-center py-2 px-4 bg-white/[0.015]"
              style={{ gridTemplateColumns: '1fr 110px 90px 36px', borderLeft: `4px solid ${column.accent}` }}
            >
              <div className="flex items-center gap-2 pr-3">
                <Plus size={12} className="shrink-0 text-white/20" />
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitAdd()
                    if (e.key === 'Escape') { setAdding(false); setDraft('') }
                  }}
                  onBlur={commitAdd}
                  placeholder="Nhập tên task rồi Enter..."
                  className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/20"
                />
              </div>
              <div /><div /><div />
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center gap-2 py-2.5 px-4 text-[12px] text-white/20 hover:text-white/50 hover:bg-white/[0.02] transition-colors"
              style={{ borderLeft: `4px solid ${column.accent}` }}
            >
              <Plus size={13} />
              Thêm task
            </button>
          )}
        </>
      )}
    </div>
  )
}

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

  /* ── AI generate ── */
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

  /* ── CRUD helpers ── */
  const cycleStatus = (colId: string, taskId: string) => {
    const order: Task['status'][] = ['todo', 'in-progress', 'done']
    setColumns((cols) =>
      cols.map((c) =>
        c.id !== colId ? c : {
          ...c,
          tasks: c.tasks.map((t) =>
            t.id !== taskId ? t : { ...t, status: order[(order.indexOf(t.status) + 1) % 3] },
          ),
        },
      ),
    )
  }

  const cyclePriority = (colId: string, taskId: string) => {
    const order: Task['priority'][] = ['low', 'medium', 'high']
    setColumns((cols) =>
      cols.map((c) =>
        c.id !== colId ? c : {
          ...c,
          tasks: c.tasks.map((t) =>
            t.id !== taskId ? t : { ...t, priority: order[(order.indexOf(t.priority) + 1) % 3] },
          ),
        },
      ),
    )
  }

  const addTask = (colId: string, title: string) => {
    setColumns((cols) =>
      cols.map((c) =>
        c.id !== colId ? c : {
          ...c,
          tasks: [...c.tasks, { id: Math.random().toString(36).slice(2), title, priority: 'medium' as const, status: 'todo' as const }],
        },
      ),
    )
  }

  const deleteTask = (colId: string, taskId: string) => {
    setColumns((cols) =>
      cols.map((c) => c.id !== colId ? c : { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }),
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
      {/* ── Top bar ── */}
      <div className="flex items-center gap-4 border-b border-white/10 px-6 py-3">
        <button
          onClick={() => router.push('/document-analyst')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
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
              <Trash2 size={11} />
              Clear
            </button>
          )}
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="flex items-center gap-1.5 rounded-lg bg-[#6161ff] px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#5050ee]"
          >
            <Sparkles size={12} />
            AI Break Task
            {showAiPanel ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* ── AI Panel ── */}
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
                    <p className="mt-1 text-[11px] text-[#fdab3d]/70">
                      <b>Loại:</b> {notTechnical.documentType}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#fdab3d]/70">{notTechnical.reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Board ── */}
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
              collapsed={collapsedGroups.has(col.id)}
              onToggle={() => toggleGroup(col.id)}
            />
          ))}

          {totalTasks === 0 && !showAiPanel && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 rounded-2xl bg-white/5 p-6"><Sparkles size={32} className="text-[#6161ff]/40" /></div>
              <p className="text-sm font-medium text-white/40">Chưa có task nào</p>
              <p className="mt-1 text-xs text-white/20">Dùng AI Break Task để tạo tự động</p>
              <button
                onClick={() => setShowAiPanel(true)}
                className="mt-4 rounded-lg bg-[#6161ff] px-5 py-2 text-xs font-semibold text-white hover:bg-[#5050ee] transition-colors"
              >
                Mở AI Break Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-white/[0.05] px-6 py-2">
        <p className="text-center text-[10px] text-white/15">
          Click Status / Priority để thay đổi · Hover để xoá task · AI Break Task tạo task tự động
        </p>
      </div>
    </div>
  )
}

/* ──────────────────────── Export ──────────────────────── */

export default function TodoTasksPage() {
  return (
    <Suspense>
      <TodoTasksContent />
    </Suspense>
  )
}
