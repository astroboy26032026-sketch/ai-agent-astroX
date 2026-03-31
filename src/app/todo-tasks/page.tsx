'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { useState } from 'react'

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

const INITIAL_COLUMNS: Column[] = [
  {
    id: 'devops',
    title: 'DevOps',
    color: 'from-orange-500 to-amber-500',
    tasks: [
      { id: 'd1', title: 'Cấu hình CI/CD pipeline', priority: 'high', status: 'todo' },
      { id: 'd2', title: 'Setup Docker Compose cho môi trường dev', priority: 'medium', status: 'in-progress' },
      { id: 'd3', title: 'Cấu hình biến môi trường production', priority: 'high', status: 'todo' },
    ],
  },
  {
    id: 'be',
    title: 'Backend',
    color: 'from-blue-500 to-cyan-500',
    tasks: [
      { id: 'b1', title: 'API nhận và parse file PDF/Word', priority: 'high', status: 'in-progress' },
      { id: 'b2', title: 'Tích hợp Mistral AI streaming', priority: 'high', status: 'in-progress' },
      { id: 'b3', title: 'Route /api/document-chat', priority: 'medium', status: 'done' },
      { id: 'b4', title: 'Xác thực và rate limiting API', priority: 'low', status: 'todo' },
    ],
  },
  {
    id: 'fe',
    title: 'Frontend',
    color: 'from-violet-500 to-purple-500',
    tasks: [
      { id: 'f1', title: 'Giao diện upload tài liệu', priority: 'high', status: 'done' },
      { id: 'f2', title: 'Chat panel với streaming response', priority: 'high', status: 'in-progress' },
      { id: 'f3', title: 'Trang Kanban task management', priority: 'medium', status: 'in-progress' },
      { id: 'f4', title: 'Selector model AI', priority: 'low', status: 'done' },
    ],
  },
  {
    id: 'qa',
    title: 'QA',
    color: 'from-emerald-500 to-teal-500',
    tasks: [
      { id: 'q1', title: 'Test upload file PDF lớn (>10MB)', priority: 'high', status: 'todo' },
      { id: 'q2', title: 'Kiểm tra streaming trên Safari/iOS', priority: 'medium', status: 'todo' },
      { id: 'q3', title: 'Test multi-provider (Mistral/Groq/Anthropic)', priority: 'medium', status: 'todo' },
    ],
  },
]

export default function TodoTasksPage() {
  const router = useRouter()
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS)
  const [addingIn, setAddingIn] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

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
        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-400 ml-1">
          Sample
        </span>
      </div>

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
        Click vào task để chuyển trạng thái · Đây là sample board
      </p>
    </div>
  )
}
