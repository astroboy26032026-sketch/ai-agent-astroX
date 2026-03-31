'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import DocumentPanel from '@/components/document-analyst/DocumentPanel'
import ChatPanel from '@/components/document-analyst/ChatPanel'
import ModelSelectorBar from '@/components/ModelSelectorBar'
import { UploadedDocument } from '@/lib/types'

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export default function DocumentAnalystPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true)
    const toastId = toast.loading(`Đang đọc ${file.name}...`)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Lỗi khi tải file', { id: toastId }); return }
      const doc: UploadedDocument = {
        id: generateId(), name: data.fileName, size: file.size,
        pageCount: data.pageCount, content: data.text, uploadedAt: 'hôm nay',
      }
      setDocuments((prev) => [doc, ...prev])
      setSelectedDoc(doc)
      toast.success(`Đã tải lên ${data.fileName}`, { id: toastId })
    } catch { toast.error('Lỗi kết nối', { id: toastId }) }
    finally { setIsUploading(false) }
  }, [])

  const handleSelectDoc = useCallback((doc: UploadedDocument) => {
    setSelectedDoc(doc)
  }, [])

  const handleDeleteDoc = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    if (selectedDoc?.id === id) setSelectedDoc(null)
  }, [selectedDoc])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black">
      {/* Top bar: back button + model selector */}
      <div className="flex items-stretch border-b border-white/10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-2 text-white/50 hover:text-white transition-colors border-r border-white/10 hover:bg-white/5 shrink-0"
        >
          <ArrowLeft size={15} />
          <span className="text-xs font-medium">Home</span>
        </button>
        <div className="flex-1">
          <ModelSelectorBar />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Documents */}
        <div className="w-[200px] shrink-0 border-r border-white/10">
          <DocumentPanel
            documents={documents}
            selectedDoc={selectedDoc}
            isUploading={isUploading}
            onUpload={handleUpload}
            onSelect={handleSelectDoc}
            onDelete={handleDeleteDoc}
          />
        </div>
        {/* Right — Chat (constrained width) */}
        <div className="min-w-0 flex-1 flex justify-center">
          <div className="w-full max-w-2xl">
            <ChatPanel selectedDoc={selectedDoc} />
          </div>
        </div>
      </div>
    </div>
  )
}
