import type { TestType, TestPriority, TestStatus, TestPlatform } from './types'

export const TYPE_CFG: Record<TestType, { label: string; color: string; bg: string }> = {
  'functional':    { label: 'Functional',    color: '#579bfc', bg: '#579bfc20' },
  'edge-case':     { label: 'Edge Case',     color: '#fdab3d', bg: '#fdab3d20' },
  'negative':      { label: 'Negative',      color: '#e2445c', bg: '#e2445c20' },
  'ui-ux':         { label: 'UI/UX',         color: '#ff5ac4', bg: '#ff5ac420' },
  'compatibility': { label: 'Compat',        color: '#66ccff', bg: '#66ccff20' },
  'api':           { label: 'API',           color: '#cab641', bg: '#cab64120' },
  'performance':   { label: 'Performance',   color: '#a25ddc', bg: '#a25ddc20' },
  'security':      { label: 'Security',      color: '#ff642e', bg: '#ff642e20' },
}

export const PRIORITY_CFG: Record<TestPriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#e2445c' },
  high:     { label: 'High',     color: '#fdab3d' },
  medium:   { label: 'Medium',   color: '#579bfc' },
  low:      { label: 'Low',      color: '#c4c4c4' },
}

export const STATUS_CFG: Record<TestStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#c4c4c4', bg: '#c4c4c420' },
  passed:  { label: 'Passed',  color: '#00c875', bg: '#00c87520' },
  failed:  { label: 'Failed',  color: '#e2445c', bg: '#e2445c20' },
  skipped: { label: 'Skipped', color: '#fdab3d', bg: '#fdab3d20' },
}

export const PLATFORM_CFG: Record<TestPlatform, { label: string; color: string; bg: string; icon: string }> = {
  web:    { label: 'Web',    color: '#579bfc', bg: '#579bfc20', icon: '🖥' },
  mobile: { label: 'Mobile', color: '#00c875', bg: '#00c87520', icon: '📱' },
  api:    { label: 'API',    color: '#cab641', bg: '#cab64120', icon: '⚡' },
  all:    { label: 'All',    color: '#a25ddc', bg: '#a25ddc20', icon: '🌐' },
}

export const STATUS_ORDER: TestStatus[] = ['pending', 'passed', 'failed', 'skipped']
