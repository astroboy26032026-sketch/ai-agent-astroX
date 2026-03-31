'use client'

import { useState, useEffect, useCallback } from 'react'

/** Các provider AI được hỗ trợ */
export type AIProvider = 'mistral' | 'groq' | 'anthropic'

/** Thông tin một model AI */
export interface AIModel {
  id: string
  label: string
  provider: AIProvider
  /** true = model miễn phí (không cần billing) */
  free: boolean
}

/** Danh sách toàn bộ model hỗ trợ */
export const AI_MODELS: AIModel[] = [
  // Mistral — dùng MISTRAL_API_KEY từ env nếu không có key người dùng
  { id: 'mistral-large-latest', label: 'Mistral Large', provider: 'mistral', free: false },
  { id: 'mistral-small-latest', label: 'Mistral Small', provider: 'mistral', free: false },
  // Groq — miễn phí, cần key từ console.groq.com
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', provider: 'groq', free: true },
  { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B (nhanh)', provider: 'groq', free: true },
  { id: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B', provider: 'groq', free: true },
  // Anthropic — cần billing tại console.anthropic.com
  { id: 'claude-sonnet-4-6',            label: 'Claude Sonnet 4.6',  provider: 'anthropic', free: false },
  { id: 'claude-haiku-4-5-20251001',    label: 'Claude Haiku 4.5',   provider: 'anthropic', free: false },
]

/** Model mặc định khi chưa có cài đặt */
export const DEFAULT_MODEL = AI_MODELS[0] // mistral-large-latest

/** Cài đặt AI được lưu trong localStorage */
interface AISettings {
  provider: AIProvider
  modelId: string
  /** Trống = dùng API key từ biến môi trường server */
  apiKey: string
}

const STORAGE_KEY = 'ai_doc_settings'

/**
 * Đọc cài đặt từ localStorage.
 * Trả về default nếu chưa có hoặc dữ liệu bị lỗi.
 */
function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AISettings
  } catch (err) {
    console.warn('[useAISettings] Không thể đọc cài đặt từ localStorage:', err)
  }
  return { provider: 'mistral', modelId: DEFAULT_MODEL.id, apiKey: '' }
}

/**
 * Hook quản lý cài đặt AI (provider, model, API key).
 * Dữ liệu được persist trong localStorage với key `ai_doc_settings`.
 */
export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>({
    provider: 'mistral',
    modelId: DEFAULT_MODEL.id,
    apiKey: '',
  })

  // Đồng bộ từ localStorage sau khi component mount (client-side only)
  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  /**
   * Cập nhật một phần cài đặt và lưu vào localStorage ngay lập tức.
   * @param patch - Các field cần thay đổi (partial update)
   */
  const updateSettings = useCallback((patch: Partial<AISettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (err) {
        console.warn('[useAISettings] Không thể lưu cài đặt:', err)
      }
      return next
    })
  }, [])

  /** Model hiện tại đang được chọn */
  const currentModel = AI_MODELS.find((m) => m.id === settings.modelId) ?? DEFAULT_MODEL

  return { settings, updateSettings, currentModel }
}
