'use client'

/**
 * ModelSelectorBar
 * Thanh chọn AI provider + model hiển thị ở đầu trang AI Document Management.
 * Không yêu cầu nhập API key — key được lưu qua useAISettings (localStorage).
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { useAISettings, AI_MODELS, AIProvider } from '@/hooks/use-ai-settings'
import { cn } from '@/lib/utils'

/** Cấu hình hiển thị cho mỗi provider */
const PROVIDER_CONFIG: Record<AIProvider, { label: string; color: string; badge: string }> = {
  mistral:   { label: 'Mistral',   color: 'text-orange-400', badge: 'Mặc định' },
  groq:      { label: 'Groq',      color: 'text-orange-500', badge: 'Free' },
  anthropic: { label: 'Anthropic', color: 'text-violet-500', badge: 'Paid' },
}

/** Badge màu nền cho provider (dùng trong top bar) */
const PROVIDER_BADGE_CLASS: Record<AIProvider, string> = {
  mistral:   'bg-orange-100 text-orange-600',
  groq:      'bg-emerald-100 text-emerald-600',
  anthropic: 'bg-violet-100 text-violet-600',
}

export default function ModelSelectorBar() {
  const { settings, updateSettings, currentModel } = useAISettings()
  const [isOpen, setIsOpen] = useState(false)

  // Lọc model theo provider đang chọn
  const providerModels = AI_MODELS.filter((m) => m.provider === settings.provider)
  const providerInfo = PROVIDER_CONFIG[settings.provider]

  /**
   * Đổi provider — tự động chọn model đầu tiên của provider đó.
   * Reset apiKey vì key khác nhau theo provider.
   */
  const handleProviderChange = (p: AIProvider) => {
    const firstModel = AI_MODELS.find((m) => m.provider === p)
    updateSettings({ provider: p, modelId: firstModel?.id ?? '' })
  }

  return (
    <div className="border-b border-white/10 bg-black">
      {/* Top bar — click để mở/đóng panel chọn model */}
      <div
        role="button"
        aria-expanded={isOpen}
        aria-label="Chọn AI provider và model"
        className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-white/5"
        onClick={() => setIsOpen((v) => !v)}
      >
        <Zap size={13} className="text-emerald-500" aria-hidden />

        <div className="flex items-center gap-2">
          {/* Provider badge */}
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', PROVIDER_BADGE_CLASS[settings.provider])}>
            {providerInfo.label}
          </span>
          {/* Model hiện tại */}
          <span className="text-xs font-medium text-white/70">{currentModel.label}</span>
          {/* Badge Free nếu model miễn phí */}
          {currentModel.free && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
              Free
            </span>
          )}
        </div>

        <span className="ml-auto text-white/30" aria-hidden>
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </div>

      {/* Panel mở rộng — chọn provider và model */}
      {isOpen && (
        <div className="border-t border-white/10 bg-black px-4 py-4 space-y-4">
          {/* Chọn Provider */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/30">Provider</p>
            <div className="flex gap-2">
              {(Object.keys(PROVIDER_CONFIG) as AIProvider[]).map((p) => {
                const info = PROVIDER_CONFIG[p]
                return (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    aria-pressed={settings.provider === p}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                      settings.provider === p
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    )}
                  >
                    <span className={info.color}>{info.label}</span>
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-[9px]',
                      PROVIDER_BADGE_CLASS[p]
                    )}>
                      {info.badge}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chọn Model */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/30">Model</p>
            <div className="flex flex-wrap gap-2">
              {providerModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateSettings({ modelId: m.id })}
                  aria-pressed={settings.modelId === m.id}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs transition-all',
                    settings.modelId === m.id
                      ? 'border-indigo-300 bg-indigo-50 font-semibold text-indigo-700'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
