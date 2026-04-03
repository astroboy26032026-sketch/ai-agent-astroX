export interface UploadedDocument {
  id: string
  name: string
  size: number
  pageCount?: number
  content: string
  uploadedAt: string
}
