export type TaskStatus = 'done' | 'todo' | 'overdue' | 'in_progress'

export interface ExtractedTask {
  id: string
  title: string
  status: TaskStatus
  dueDate?: string | null
  page?: string | null
}

export interface UploadedDocument {
  id: string
  name: string
  size: number
  pageCount?: number
  content: string
  uploadedAt: string
}
