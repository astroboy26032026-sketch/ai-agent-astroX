'use client'

import { useState } from 'react'
import {
  ChevronDown, ChevronRight, Check, X, Minus, Clock, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TYPE_CFG, PRIORITY_CFG, STATUS_CFG, PLATFORM_CFG, STATUS_ORDER } from './constants'
import type { TestCase, TestStatus } from './types'

/* ──────────────────────── Badges ──────────────────────── */

export function TypeBadge({ type }: { type: TestCase['type'] }) {
  const cfg = TYPE_CFG[type]
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TestCase['priority'] }) {
  const cfg = PRIORITY_CFG[priority]
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold"
      style={{ border: `2px solid ${cfg.color}`, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

export function PlatformBadge({ platform }: { platform: TestCase['platform'] }) {
  const cfg = PLATFORM_CFG[platform]
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <span className="text-[9px]">{cfg.icon}</span>{cfg.label}
    </span>
  )
}

export function StatusBadge({ status, onClick }: { status: TestStatus; onClick: () => void }) {
  const cfg = STATUS_CFG[status]
  const Icon = status === 'passed' ? Check : status === 'failed' ? X : status === 'skipped' ? Minus : Clock
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-semibold transition-opacity hover:opacity-80"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <Icon size={10} />{cfg.label}
    </button>
  )
}

/* ──────────────────────── Test Case Row ──────────────────────── */

const GRID = '32px 60px 1fr 85px 70px 65px 75px 32px'

export { GRID }

export interface TestCaseRowProps {
  tc: TestCase
  onCycleStatus: () => void
  onDelete: () => void
}

export function TestCaseRow({ tc, onCycleStatus, onDelete }: TestCaseRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        'border-b border-white/[0.06] transition-colors',
        tc.status === 'passed' && 'opacity-50',
      )}
    >
      {/* Main row */}
      <div
        className="group grid items-center py-2.5 px-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
        style={{ gridTemplateColumns: GRID }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand icon */}
        <div className="flex justify-center text-white/30">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>

        {/* ID */}
        <span className="text-[11px] font-mono font-semibold text-indigo-400">{tc.id}</span>

        {/* Title */}
        <span className={cn(
          'text-[13px] text-white font-medium truncate pr-3',
          tc.status === 'passed' && 'line-through text-white/50',
        )}>
          {tc.title}
        </span>

        {/* Type */}
        <div className="flex justify-center"><TypeBadge type={tc.type} /></div>

        {/* Platform */}
        <div className="flex justify-center"><PlatformBadge platform={tc.platform} /></div>

        {/* Priority */}
        <div className="flex justify-center"><PriorityBadge priority={tc.priority} /></div>

        {/* Status */}
        <div className="flex justify-center"><StatusBadge status={tc.status} onClick={onCycleStatus} /></div>

        {/* Delete */}
        <div className="flex justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-transparent group-hover:text-white/20 hover:!text-red-400 transition-colors p-1"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 bg-white/[0.01]">
          <div className="ml-[32px] grid grid-cols-1 gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            {/* Precondition */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1">
                Điều kiện tiên quyết
              </p>
              <p className="text-[12px] text-white/70 leading-relaxed">{tc.precondition}</p>
            </div>

            {/* Steps */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">
                Các bước thực hiện
              </p>
              <ol className="space-y-1">
                {tc.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-white/70 leading-relaxed">
                    <span className="shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-500/20 text-[9px] font-bold text-indigo-400 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Expected result */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1">
                Kết quả mong đợi
              </p>
              <p className="text-[12px] text-emerald-400/80 leading-relaxed">{tc.expectedResult}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────── Stats Bar ──────────────────────── */

export function StatsBar({ testCases }: { testCases: TestCase[] }) {
  const total = testCases.length
  if (total === 0) return null

  const passed = testCases.filter((t) => t.status === 'passed').length
  const failed = testCases.filter((t) => t.status === 'failed').length
  const pending = testCases.filter((t) => t.status === 'pending').length
  const skipped = testCases.filter((t) => t.status === 'skipped').length
  const passRate = Math.round((passed / total) * 100)

  // Platform stats
  const webCount = testCases.filter((t) => t.platform === 'web').length
  const mobileCount = testCases.filter((t) => t.platform === 'mobile').length
  const apiCount = testCases.filter((t) => t.platform === 'api').length
  const allCount = testCases.filter((t) => t.platform === 'all').length

  return (
    <div className="flex flex-col gap-2">
      {/* Status row */}
      <div className="flex items-center gap-4 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/40">Total:</span>
          <span className="text-[12px] font-bold text-white">{total}</span>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <div className="flex items-center gap-3 text-[11px]">
          <span style={{ color: '#00c875' }}>Passed: {passed}</span>
          <span style={{ color: '#e2445c' }}>Failed: {failed}</span>
          <span style={{ color: '#c4c4c4' }}>Pending: {pending}</span>
          <span style={{ color: '#fdab3d' }}>Skipped: {skipped}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-[5px] w-24 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${passRate}%`,
                backgroundColor: passRate >= 80 ? '#00c875' : passRate >= 50 ? '#fdab3d' : '#e2445c',
              }}
            />
          </div>
          <span className="text-[11px] font-bold" style={{
            color: passRate >= 80 ? '#00c875' : passRate >= 50 ? '#fdab3d' : '#e2445c',
          }}>
            {passRate}% passed
          </span>
        </div>
      </div>

      {/* Platform coverage row */}
      <div className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Coverage</span>
        <div className="flex items-center gap-3 text-[11px]">
          <span style={{ color: '#579bfc' }}>🖥 Web: {webCount}</span>
          <span style={{ color: '#00c875' }}>📱 Mobile: {mobileCount}</span>
          <span style={{ color: '#cab641' }}>⚡ API: {apiCount}</span>
          <span style={{ color: '#a25ddc' }}>🌐 All: {allCount}</span>
        </div>
      </div>
    </div>
  )
}
