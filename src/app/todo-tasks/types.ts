export interface SubTask {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in-progress' | 'done'
  assignee: string
}

export interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in-progress' | 'done'
  assignee: string
  subtasks: SubTask[]
}

export interface Column {
  id: string
  title: string
  accent: string
  tasks: Task[]
}
