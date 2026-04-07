'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Sparkles, Loader2, ChevronDown, ChevronUp,
  AlertCircle, Trash2, Download, FlaskConical,
} from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useAISettings } from '@/hooks/use-ai-settings'
import { TestCaseRow, StatsBar, GRID } from './components'
import { STATUS_ORDER } from './constants'
import type { TestCase, TestStatus } from './types'

/* ──────────────────────── Main Content ──────────────────────── */

function TestCaseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useAISettings()

  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [moduleName, setModuleName] = useState('')

  // AI state
  const [aiInput, setAiInput] = useState('')
  const [coverageMode, setCoverageMode] = useState<'quick' | 'full'>('quick')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(true)

  // Nhận tài liệu từ Document Analyst
  useEffect(() => {
    if (searchParams.get('from') !== 'document') return
    try {
      const content = sessionStorage.getItem('test_case_content')
      const docName = sessionStorage.getItem('test_case_docname')
      if (content) {
        setAiInput(docName ? `[Tài liệu: ${docName}]\n\n${content}` : content)
        sessionStorage.removeItem('test_case_content')
        sessionStorage.removeItem('test_case_docname')
      }
    } catch { /* ignore */ }
  }, [searchParams])

  /* ── AI generate test cases ── */
  const generateTestCases = async () => {
    if (!aiInput.trim()) return
    setIsGenerating(true)
    setAiError(null)

    try {
      const res = await fetch('/api/generate-test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': settings.provider,
          'x-model': settings.modelId,
          ...(settings.apiKey ? { 'x-api-key': settings.apiKey } : {}),
        },
        body: JSON.stringify({ description: aiInput, mode: coverageMode }),
      })

      const data = await res.json()
      if (!res.ok) { setAiError(data.error || 'Lỗi khi gọi AI'); return }

      setModuleName(data.moduleName || 'Test Cases')
      setTestCases(
        data.testCases.map((tc: Omit<TestCase, 'status'> & { status?: string }) => ({
          ...tc,
          platform: tc.platform || 'all',
          status: 'pending' as TestStatus,
        }))
      )
      setShowAiPanel(false)
    } catch {
      setAiError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  /* ── CRUD ── */
  const cycleStatus = (id: string) => {
    setTestCases((prev) =>
      prev.map((tc) =>
        tc.id !== id ? tc : { ...tc, status: STATUS_ORDER[(STATUS_ORDER.indexOf(tc.status) + 1) % STATUS_ORDER.length] }
      )
    )
  }

  const deleteTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id))
  }

  /* ── Export CSV ── */
  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Type', 'Platform', 'Priority', 'Status', 'Precondition', 'Steps', 'Expected Result']
    const rows = testCases.map((tc) => [
      tc.id,
      `"${tc.title}"`,
      tc.type,
      tc.platform,
      tc.priority,
      tc.status,
      `"${tc.precondition}"`,
      `"${tc.steps.map((s, i) => `${i + 1}. ${s}`).join(' | ')}"`,
      `"${tc.expectedResult}"`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${moduleName || 'test-cases'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Stats ── */
  const total = testCases.length

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
        <div className="flex items-center gap-2">
          <FlaskConical size={14} className="text-emerald-400" />
          <h1 className="text-sm font-bold text-white">AI Test Case Generator</h1>
        </div>

        {moduleName && (
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
            {moduleName}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {total > 0 && (
            <>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/40 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
              >
                <Download size={11} /> Export CSV
              </button>
              <button
                onClick={() => { setTestCases([]); setModuleName(''); setShowAiPanel(true) }}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/40 hover:text-red-400 hover:border-red-500/30 transition-colors"
              >
                <Trash2 size={11} /> Clear
              </button>
            </>
          )}
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Sparkles size={12} /> AI Generate
            {showAiPanel ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* AI Panel */}
      {showAiPanel && (
        <div className="border-b border-white/10 bg-[#1e2140] px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-emerald-600/20 p-2.5">
                <FlaskConical size={15} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="mb-2 text-xs font-semibold text-white/80">
                  Mô tả tính năng hoặc dán nội dung tài liệu — AI sẽ sinh bộ test case đầy đủ
                </p>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ví dụ: Tính năng đăng nhập với email/password, hỗ trợ OAuth Google, quên mật khẩu qua email..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 placeholder:text-white/20"
                />
                {/* Coverage mode toggle */}
                <div className="mt-3 flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5 w-fit">
                  <button
                    onClick={() => setCoverageMode('quick')}
                    className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-all ${
                      coverageMode === 'quick'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    Quick (~15 TC)
                  </button>
                  <button
                    onClick={() => setCoverageMode('full')}
                    className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-all ${
                      coverageMode === 'full'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    Full Coverage (~50 TC)
                  </button>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={generateTestCases}
                    disabled={isGenerating || !aiInput.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-40"
                  >
                    {isGenerating
                      ? <><Loader2 size={13} className="animate-spin" /> Đang sinh test case...</>
                      : <><FlaskConical size={13} /> Sinh test case</>
                    }
                  </button>
                  {aiError && (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle size={12} /> {aiError}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test case table */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-5xl space-y-4">
          {/* Stats */}
          <StatsBar testCases={testCases} />

          {/* Table */}
          {total > 0 && (
            <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(255,255,255,.1)' }}>
              {/* Column headers */}
              <div
                className="grid items-center text-[10px] font-semibold uppercase tracking-wider text-white/35 py-2 px-4 bg-white/[0.02]"
                style={{ gridTemplateColumns: GRID }}
              >
                <span />
                <span>ID</span>
                <span>Test Case</span>
                <span className="text-center">Type</span>
                <span className="text-center">Platform</span>
                <span className="text-center">Priority</span>
                <span className="text-center">Status</span>
                <span />
              </div>

              {/* Rows */}
              {testCases.map((tc) => (
                <TestCaseRow
                  key={tc.id}
                  tc={tc}
                  onCycleStatus={() => cycleStatus(tc.id)}
                  onDelete={() => deleteTestCase(tc.id)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {total === 0 && !showAiPanel && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 rounded-2xl bg-white/5 p-6">
                <FlaskConical size={32} className="text-emerald-400/40" />
              </div>
              <p className="text-sm font-medium text-white/40">Chưa có test case nào</p>
              <p className="mt-1 text-xs text-white/20">Dùng AI Generate để tạo tự động từ tài liệu</p>
              <button
                onClick={() => setShowAiPanel(true)}
                className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Mở AI Generate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.05] px-6 py-2">
        <p className="text-center text-[10px] text-white/15">
          Click Status để đổi trạng thái · Click row để xem chi tiết · Export CSV để lưu
        </p>
      </div>
    </div>
  )
}

export default function TestCasePage() {
  return (
    <Suspense>
      <TestCaseContent />
    </Suspense>
  )
}
