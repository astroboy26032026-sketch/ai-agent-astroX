'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, Trash2, FileCheck } from 'lucide-react'
import { UploadedDocument } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DocumentPanelProps {
  documents: UploadedDocument[]
  selectedDoc: UploadedDocument | null
  isUploading: boolean
  onUpload: (file: File) => void
  onSelect: (doc: UploadedDocument) => void
  onDelete: (id: string) => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentPanel({ documents, selectedDoc, isUploading, onUpload, onSelect, onDelete }: DocumentPanelProps) {
  const onDrop = useCallback((files: File[]) => { if (files[0]) onUpload(files[0]) }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    disabled: isUploading,
  })

  return (
    <div className="flex h-full flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white/80">Tài liệu</h2>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700">
          <Upload size={12} />
          Upload
          <input type="file" className="hidden" accept=".pdf,.doc,.docx" disabled={isUploading}
            onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); e.target.value = '' }} />
        </label>
      </div>

      {/* Drop zone */}
      <div className="px-3 pt-3">
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-6 transition-colors',
            isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:border-indigo-500/30 hover:bg-white/10',
            isUploading && 'cursor-not-allowed opacity-50'
          )}
        >
          <input {...getInputProps()} />
          <FileText size={28} className="mb-2 text-white/20" />
          <p className="text-center text-xs text-white/40 leading-relaxed">
            {isUploading ? 'Đang xử lý...' : 'Kéo thả PDF / Word\nhoặc click để chọn'}
          </p>
        </div>
      </div>

      {/* Doc list */}
      {documents.length > 0 && (
        <div className="mt-3 px-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/30">Đã tải lên</p>
          <div className="flex flex-col gap-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelect(doc)}
                className={cn(
                  'group flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors',
                  selectedDoc?.id === doc.id ? 'bg-indigo-500/20 ring-1 ring-indigo-500/40' : 'hover:bg-white/5'
                )}
              >
                <FileCheck size={16} className={cn('mt-0.5 shrink-0', selectedDoc?.id === doc.id ? 'text-indigo-400' : 'text-white/30')} />
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-xs font-medium leading-tight', selectedDoc?.id === doc.id ? 'text-indigo-300' : 'text-white/70')}>
                    {doc.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/30">
                    {formatSize(doc.size)}{doc.pageCount ? ` · ${doc.pageCount} trang` : ''} · {doc.uploadedAt}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(doc.id) }}
                  className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-white/30 hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && (
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-xs text-white/20">Chưa có tài liệu nào</p>
        </div>
      )}
    </div>
  )
}
