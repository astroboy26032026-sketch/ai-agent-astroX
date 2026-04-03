'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Plus, Sparkles, Loader2, ChevronDown, ChevronUp, ChevronRight,
  GripVertical, Check, Clock, Circle, AlertCircle, Trash2, Zap,
} from 'lucide-react'
import { useState, useEffect, Suspense, useRef } from 'react'
import { useAISettings } from '@/hooks/use-ai-settings'
import { cn } from '@/lib/utils'

/* ──────────────────────── Types ──────────────────────── */

interface SubTask {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in-progress' | 'done'
  assignee: string
}

interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in-progress' | 'done'
  assignee: string
  subtasks: SubTask[]
}

const ASSIGNEE_COLORS = [
  '#7c5cfc', '#e2445c', '#00c875', '#fdab3d', '#579bfc',
  '#ff642e', '#cab641', '#ff5ac4', '#66ccff', '#9cd326',
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return ASSIGNEE_COLORS[Math.abs(hash) % ASSIGNEE_COLORS.length]
}

interface Column {
  id: string
  title: string
  accent: string
  tasks: Task[]
}

/* ──────────────────────── Constants ──────────────────────── */

const STATUS_CFG = {
  'todo':        { label: 'Todo',          bg: '#c4c4c4', icon: Circle },
  'in-progress': { label: 'Working on it', bg: '#fdab3d', icon: Clock },
  'done':        { label: 'Done',          bg: '#00c875', icon: Check },
} as const

const PRIORITY_CFG = {
  high:   { label: 'Critical', color: '#e2445c' },
  medium: { label: 'Medium',   color: '#fdab3d' },
  low:    { label: 'Low',      color: '#579bfc' },
} as const

const GROUP_ACCENTS: Record<string, string> = {
  devops: '#fdab3d', be: '#579bfc', fe: '#a25ddc', qa: '#00c875',
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
      <Icon size={11} />{cfg.label}
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

function AssigneeCell({ assignee, onChange }: { assignee: string; onChange: (name: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(assignee)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commit = () => {
    onChange(draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(assignee); setEditing(false) } }}
        onBlur={commit}
        placeholder="Tên..."
        className="w-full max-w-[80px] rounded bg-white/10 px-2 py-0.5 text-[11px] text-white outline-none placeholder:text-white/25 text-center"
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  if (!assignee) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setDraft(''); setEditing(true) }}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-white/15 text-white/15 hover:border-white/30 hover:text-white/30 transition-colors"
      >
        <Plus size={10} />
      </button>
    )
  }

  const color = getAvatarColor(assignee)
  const initials = assignee.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setDraft(assignee); setEditing(true) }}
      title={assignee}
      className="flex h-6 min-w-[24px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white transition-opacity hover:opacity-80"
      style={{ backgroundColor: color }}
    >
      {initials}
    </button>
  )
}

/* ──────────────────────── Group Table ──────────────────────── */

function GroupTable({
  column, onCycleStatus, onCyclePriority, onAddTask, onDeleteTask,
  onBreakSubtask, breakingTaskId,
  onCycleSubStatus, onCycleSubPriority, onDeleteSubtask,
  onAssign, onSubAssign,
  collapsed, onToggle,
}: {
  column: Column
  onCycleStatus: (taskId: string) => void
  onCyclePriority: (taskId: string) => void
  onAddTask: (title: string) => void
  onDeleteTask: (taskId: string) => void
  onBreakSubtask: (taskId: string) => void
  breakingTaskId: string | null
  onCycleSubStatus: (taskId: string, subId: string) => void
  onCycleSubPriority: (taskId: string, subId: string) => void
  onDeleteSubtask: (taskId: string, subId: string) => void
  onAssign: (taskId: string, name: string) => void
  onSubAssign: (taskId: string, subId: string, name: string) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  const allItems = column.tasks.reduce((n, t) => n + 1 + t.subtasks.length, 0)
  const allDone = column.tasks.reduce(
    (n, t) => n + (t.status === 'done' ? 1 : 0) + t.subtasks.filter((s) => s.status === 'done').length, 0,
  )
  const pct = allItems ? Math.round((allDone / allItems) * 100) : 0

  useEffect(() => { if (adding) inputRef.current?.focus() }, [adding])

  const commitAdd = () => {
    if (draft.trim()) onAddTask(draft.trim())
    setDraft('')
    setAdding(false)
  }

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }

  // Auto-expand when subtasks arrive
  useEffect(() => {
    column.tasks.forEach((t) => {
      if (t.subtasks.length > 0) {
        setExpandedTasks((prev) => {
          if (prev.has(t.id)) return prev
          const next = new Set(prev)
          next.add(t.id)
          return next
        })
      }
    })
  }, [column.tasks])

  const GRID = '1fr 110px 90px 50px 70px 36px'

  return (
    <div className="mb-5 overflow-hidden rounded-lg" style={{ border: '1px solid rgba(255,255,255,.1)' }}>
      {/* Group header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.02]" style={{ borderLeft: `4px solid ${column.accent}` }}>
        <button onClick={onToggle} className="text-white/50 hover:text-white/80 transition-colors">
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
        <span className="text-[13px] font-bold" style={{ color: column.accent }}>{column.title}</span>
        <span className="text-[11px] text-white/40">{column.tasks.length} tasks</span>
        {allItems > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <div className="h-[5px] w-20 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: column.accent }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: column.accent }}>{pct}%</span>
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          {/* Column headers */}
          <div
            className="grid items-center border-t border-b text-[10px] font-semibold uppercase tracking-wider text-white/35 py-2 px-4"
            style={{ gridTemplateColumns: GRID, borderColor: 'rgba(255,255,255,.08)', borderLeft: `4px solid ${column.accent}` }}
          >
            <span>Task</span>
            <span className="text-center">Status</span>
            <span className="text-center">Priority</span>
            <span className="text-center">Assign</span>
            <span className="text-center">Subtask</span>
            <span />
          </div>

          {/* Empty state */}
          {column.tasks.length === 0 && !adding && (
            <div className="py-8 text-center text-[11px] text-white/15" style={{ borderLeft: `4px solid ${column.accent}` }}>
              Chưa có task nào
            </div>
          )}

          {/* Task rows */}
          {column.tasks.map((task) => {
            const isExpanded = expandedTasks.has(task.id)
            const isBreaking = breakingTaskId === task.id
            const hasSubs = task.subtasks.length > 0
            const subDone = task.subtasks.filter((s) => s.status === 'done').length

            return (
              <div key={task.id}>
                {/* Main task row */}
                <div
                  className={cn(
                    'group grid items-center py-2.5 px-4 transition-colors hover:bg-white/[0.03]',
                    task.status === 'done' && 'opacity-50',
                  )}
                  style={{
                    gridTemplateColumns: GRID,
                    borderLeft: `4px solid ${column.accent}`,
                    borderBottom: '1px solid rgba(255,255,255,.06)',
                  }}
                >
                  {/* Title + expand toggle */}
                  <div className="flex items-center gap-1.5 min-w-0 pr-3">
                    {hasSubs ? (
                      <button onClick={() => toggleExpand(task.id)} className="shrink-0 text-white/40 hover:text-white/70 transition-colors p-0.5">
                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                    ) : (
                      <GripVertical size={12} className="shrink-0 text-white/0 group-hover:text-white/25 transition-colors cursor-grab" />
                    )}
                    <span className={cn(
                      'text-[13px] text-white font-medium truncate',
                      task.status === 'done' && 'line-through text-white/50',
                    )}>
                      {task.title}
                    </span>
                    {hasSubs && (
                      <span className="ml-1.5 shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-white/50 font-medium">
                        {subDone}/{task.subtasks.length}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex justify-center">
                    <StatusPill status={task.status} onClick={() => onCycleStatus(task.id)} />
                  </div>

                  {/* Priority */}
                  <div className="flex justify-center">
                    <PriorityPill priority={task.priority} onClick={() => onCyclePriority(task.id)} />
                  </div>

                  {/* Assign */}
                  <div className="flex justify-center">
                    <AssigneeCell assignee={task.assignee} onChange={(name) => onAssign(task.id, name)} />
                  </div>

                  {/* Break subtask button */}
                  <div className="flex justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); onBreakSubtask(task.id) }}
                      disabled={isBreaking}
                      className={cn(
                        'flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-all',
                        isBreaking
                          ? 'bg-[#6161ff]/20 text-[#6161ff]'
                          : 'text-white/30 hover:text-[#6161ff] hover:bg-[#6161ff]/10',
                      )}
                    >
                      {isBreaking ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                      {isBreaking ? '...' : 'Break'}
                    </button>
                  </div>

                  {/* Delete */}
                  <div className="flex justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id) }}
                      className="text-transparent group-hover:text-white/25 hover:!text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Subtask rows */}
                {isExpanded && task.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className={cn(
                      'group grid items-center py-2 px-4 transition-colors hover:bg-white/[0.015]',
                      sub.status === 'done' && 'opacity-40',
                    )}
                    style={{
                      gridTemplateColumns: GRID,
                      borderLeft: `4px solid ${column.accent}`,
                      borderBottom: '1px solid rgba(255,255,255,.02)',
                      backgroundColor: 'rgba(255,255,255,.01)',
                    }}
                  >
                    {/* Subtask title — indented */}
                    <div className="flex items-center gap-1.5 min-w-0 pr-3 pl-6">
                      <div className="shrink-0 h-3 w-3 rounded-sm border border-white/15 flex items-center justify-center">
                        {sub.status === 'done' && <Check size={8} className="text-[#00c875]" />}
                      </div>
                      <span className={cn(
                        'text-[12px] text-white/60 truncate',
                        sub.status === 'done' && 'line-through text-white/30',
                      )}>
                        {sub.title}
                      </span>
                    </div>

                    <div className="flex justify-center">
                      <StatusPill status={sub.status} onClick={() => onCycleSubStatus(task.id, sub.id)} />
                    </div>

                    <div className="flex justify-center">
                      <PriorityPill priority={sub.priority} onClick={() => onCycleSubPriority(task.id, sub.id)} />
                    </div>

                    <div className="flex justify-center">
                      <AssigneeCell assignee={sub.assignee} onChange={(name) => onSubAssign(task.id, sub.id, name)} />
                    </div>

                    <div />

                    <div className="flex justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSubtask(task.id, sub.id) }}
                        className="text-transparent group-hover:text-white/20 hover:!text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}

          {/* Add task */}
          {adding ? (
            <div
              className="grid items-center py-2 px-4 bg-white/[0.015]"
              style={{ gridTemplateColumns: GRID, borderLeft: `4px solid ${column.accent}` }}
            >
              <div className="flex items-center gap-2 pr-3">
                <Plus size={12} className="shrink-0 text-white/20" />
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitAdd(); if (e.key === 'Escape') { setAdding(false); setDraft('') } }}
                  onBlur={commitAdd}
                  placeholder="Nhập tên task rồi Enter..."
                  className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/20"
                />
              </div>
              <div /><div /><div /><div /><div />
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center gap-2 py-2.5 px-4 text-[12px] text-white/20 hover:text-white/50 hover:bg-white/[0.02] transition-colors"
              style={{ borderLeft: `4px solid ${column.accent}` }}
            >
              <Plus size={13} /> Thêm task
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
