'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus, Loader2, ChevronDown, ChevronUp, ChevronRight,
  GripVertical, Check, Trash2, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_CFG, PRIORITY_CFG, getAvatarColor } from './constants'
import type { Column, Task } from './types'

/* ──────────────────────── Small components ──────────────────────── */

export function StatusPill({ status, onClick }: { status: Task['status']; onClick: () => void }) {
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

export function PriorityPill({ priority, onClick }: { priority: Task['priority']; onClick: () => void }) {
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

export function AssigneeCell({ assignee, onChange }: { assignee: string; onChange: (name: string) => void }) {
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

export interface GroupTableProps {
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
}

export function GroupTable({
  column, onCycleStatus, onCyclePriority, onAddTask, onDeleteTask,
  onBreakSubtask, breakingTaskId,
  onCycleSubStatus, onCycleSubPriority, onDeleteSubtask,
  onAssign, onSubAssign,
  collapsed, onToggle,
}: GroupTableProps) {
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
