import { Circle, Clock, Check } from 'lucide-react'
import type { Column, Task } from './types'

export const STATUS_CFG: Record<Task['status'], { label: string; bg: string; icon: typeof Circle }> = {
  'todo':        { label: 'Todo',          bg: '#c4c4c4', icon: Circle },
  'in-progress': { label: 'Working on it', bg: '#fdab3d', icon: Clock },
  'done':        { label: 'Done',          bg: '#00c875', icon: Check },
}

export const PRIORITY_CFG: Record<Task['priority'], { label: string; color: string }> = {
  high:   { label: 'Critical', color: '#e2445c' },
  medium: { label: 'Medium',   color: '#fdab3d' },
  low:    { label: 'Low',      color: '#579bfc' },
}

export const GROUP_ACCENTS: Record<string, string> = {
  devops: '#fdab3d', be: '#579bfc', fe: '#a25ddc', qa: '#00c875',
}

export const EMPTY_COLUMNS: Column[] = [
  { id: 'devops', title: 'DevOps',   accent: GROUP_ACCENTS.devops, tasks: [] },
  { id: 'be',     title: 'Backend',  accent: GROUP_ACCENTS.be,     tasks: [] },
  { id: 'fe',     title: 'Frontend', accent: GROUP_ACCENTS.fe,     tasks: [] },
  { id: 'qa',     title: 'QA',       accent: GROUP_ACCENTS.qa,     tasks: [] },
]

export const ASSIGNEE_COLORS = [
  '#7c5cfc', '#e2445c', '#00c875', '#fdab3d', '#579bfc',
  '#ff642e', '#cab641', '#ff5ac4', '#66ccff', '#9cd326',
]

export function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return ASSIGNEE_COLORS[Math.abs(hash) % ASSIGNEE_COLORS.length]
}
