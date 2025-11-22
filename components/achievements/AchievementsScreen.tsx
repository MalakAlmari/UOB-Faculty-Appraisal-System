"use client"
import useSWR from 'swr'
import { useMemo, useState, useEffect } from 'react'
import { Trash2, Edit, CheckCircle, FolderOpen, FileText, LogOut, Menu, X, Printer, Upload, Plus, AlertCircle, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) {
    throw new Error(`HTTP error! status: ${r.status}`)
  }
  return r.json()
})

// Types for better type safety
interface Achievement {
  id: number
  [key: string]: any
}

interface AppraisalsData {
  appraisalId: number
  awards: Achievement[]
  courses: Achievement[]
  research: Achievement[]
  scientific: Achievement[]
  university: Achievement[]
  community: Achievement[]
}

// Error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Component error:', error)
      setHasError(true)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-gray-600 text-center max-w-md">
          We encountered an unexpected error while loading the achievements. Please try refreshing the page.
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

// Generic small UI atoms --------------------------------------------------
function SectionBar({ title, onAdd, onRefresh, disabled = false, itemCount = 0 }: { 
  title: string
  onAdd: () => void
  onRefresh: () => void
  disabled?: boolean
  itemCount?: number
}) {
  return (
    <div className="flex items-center justify-between mt-6">
      <div className="flex items-center gap-3">
        <div className="font-medium">{title}</div>
        <span className="text-sm text-gray-500">({itemCount})</span>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onRefresh} 
          disabled={disabled}
          className="px-2 py-1.5 rounded border text-sm disabled:opacity-50" 
          title="Refresh"
        >
          <RefreshCw size={14} className={disabled ? 'animate-spin' : ''} />
        </button>
        <button 
          onClick={onAdd} 
          disabled={disabled}
          className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm disabled:opacity-50"
        >
          + ADD
        </button>
      </div>
    </div>
  )
}

function Table({ columns, rows, isLoading = false }: { 
  columns: Array<{ key: string; label: string; render?: (v: any, row: any) => any }>
  rows: any[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-white overflow-auto p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-white overflow-auto">
      <table className="w-full text-sm min-w-[860px]">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(c => <th key={c.key} className="p-2 text-left">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows?.length ? rows.map((r: any) => (
            <tr key={r.id} className="border-t hover:bg-gray-50">
              {columns.map(c => (
                <td key={c.key} className="p-2">
                  {c.render ? c.render(r[c.key], r) : (r[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td className="p-3 text-gray-500 text-center" colSpan={columns.length}>
                No achievements found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Modal({ open, title, onClose, children }: { 
  open: boolean
  title: string
  onClose: () => void
  children: any 
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-white rounded-2xl p-4 max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-lg">{title}</div>
            <div className="text-xs text-gray-500">Add achievement</div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, required = false }: { 
  label: string
  children: any
  required?: boolean
}) {
  return (
    <label className="block mb-3">
      <div className="text-sm mb-1 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      {children}
    </label>
  )
}

function Input(props: any) { 
  return (
    <input 
      {...props} 
      className={`border rounded px-3 py-2 w-full ${props.className || ''} ${
        props.error ? 'border-red-500' : ''
      }`} 
    /> 
  ) 
}

// Enhanced FileInput with better error handling and progress tracking
function FileInput({ 
  label, 
  value, 
  onChange, 
  entityType, 
  entityId, 
  achievementType,
  required = false
}: { 
  label: string
  value?: string
  onChange: (fileData: { url: string; filename: string; fileKey: string }) => void
  entityType: string
  entityId: string
  achievementType?: string
  required?: boolean
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const resetUploadState = () => {
    setIsUploading(false)
    setUploadProgress(0)
    setUploadError(null)
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', entityType)
      formData.append('entityId', entityId)
      if (achievementType) {
        formData.append('achievementType', achievementType)
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const data = await response.json()
        onChange({
          url: data.url,
          filename: data.filename,
          fileKey: data.fileKey
        })
        resetUploadState()
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Upload failed with status ${response.status}`
        setUploadError(errorMessage)
        console.error('Upload error:', errorMessage)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Failed to upload the file. Please check your internet connection and try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await handleFileSelect(file)
    }
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      await handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleRemoveFile = () => {
    onChange({ url: '', filename: '', fileKey: '' })
    resetUploadState()
  }
  
  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadError(`File type ${fileExtension} is not supported. Please use: ${allowedTypes.join(', ')}`)
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB')
      return
    }

    if (value) {
      // Clear existing file first, then upload new one
      onChange({ url: '', filename: '', fileKey: '' })
      setTimeout(() => {
        handleFileUpload(file)
      }, 100)
    } else {
      // No existing file, just upload
      handleFileUpload(file)
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      
      {uploadError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">
            {uploadError}
          </AlertDescription>
        </Alert>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            {isDragOver ? 'Drop file here' : 'Drag & drop a file here, or click to select'}
          </div>
          {isUploading && (
            <div className="space-y-2">
              <div className="text-sm text-blue-600">Uploading...</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          <input
            type="file"
            onChange={handleInputChange}
            disabled={isUploading}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            id={`file-input-${label}`}
          />
          <label
            htmlFor={`file-input-${label}`}
            className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer text-sm disabled:opacity-50"
          >
            Choose File
          </label>
        </div>
      </div>

      {value && (
        <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-blue-600 underline flex items-center"
          >
            <FolderOpen size={14} className="inline mr-1" />
            View uploaded file
          </a>
          <button
            onClick={handleRemoveFile}
            disabled={isUploading}
            className="text-red-500 hover:text-red-700 text-sm underline disabled:opacity-50"
            type="button"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

// Main screen -------------------------------------------------------------
export default function AchievementsScreen() {
  const { data, error, isLoading, mutate } = useSWR<AppraisalsData>('/api/appraisals/current', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000
  })

  const [modal, setModal] = useState<null | { 
    key: string
    title: string
    editData?: any
    editId?: number
  }>(null)

  const [actionStates, setActionStates] = useState<Record<string, boolean>>({})

  // Extract appraisal ID from API response with fallbacks
  const appraisalId = data?.appraisalId

  // Error state handling
  if (error) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">
            Failed to load achievements: {error.message}
          </AlertDescription>
        </Alert>
        <Button onClick={() => mutate()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  // Helper function to set action state
  const setActionState = (action: string, isLoading: boolean) => {
    setActionStates(prev => ({ ...prev, [action]: isLoading }))
  }

  async function add(resource: string, payload: any) {
    setActionState(`add-${resource}`, true)
    try {
      // Validate required fields
      const validationResult = validateResourceData(resource, payload)
      if (!validationResult.isValid) {
        alert(`Validation error: ${validationResult.errors.join(', ')}`)
        return
      }

      const res = await fetch(`/api/appraisals/current/${resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to add ${resource} (${res.status})`
        console.error('Add error:', errorMessage)
        alert(errorMessage)
        return
      }

      await mutate()
      setModal(null)
      setActionStates({}) // Clear all action states
    } catch (error) {
      console.error('Error adding achievement:', error)
      alert('Failed to add achievement. Please try again.')
    } finally {
      setActionState(`add-${resource}`, false)
    }
  }

  async function edit(resource: string, id: number, payload: any) {
    setActionState(`edit-${resource}-${id}`, true)
    try {
      // Validate required fields
      const validationResult = validateResourceData(resource, payload)
      if (!validationResult.isValid) {
        alert(`Validation error: ${validationResult.errors.join(', ')}`)
        return
      }

      const res = await fetch(`/api/appraisals/current/${resource}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to update ${resource} (${res.status})`
        console.error('Edit error:', errorMessage)
        alert(errorMessage)
        return
      }

      await mutate()
      setModal(null)
      setActionStates({}) // Clear all action states
    } catch (error) {
      console.error('Error updating achievement:', error)
      alert('Failed to update achievement. Please try again.')
    } finally {
      setActionState(`edit-${resource}-${id}`, false)
    }
  }

  async function del(resource: string, id: number) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return

    setActionState(`delete-${resource}-${id}`, true)
    try {
      const res = await fetch(`/api/appraisals/current/${resource}/${id}`, { 
        method: 'DELETE' 
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to delete ${resource} (${res.status})`
        console.error('Delete error:', errorMessage)
        alert(errorMessage)
        return
      }

      await mutate()
    } catch (error) {
      console.error('Error deleting achievement:', error)
      alert('Failed to delete the achievement. Please try again.')
    } finally {
      setActionState(`delete-${resource}-${id}`, false)
    }
  }

  // Validation function
  function validateResourceData(resource: string, data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    switch (resource) {
      case 'awards':
        if (!data.name?.trim()) errors.push('Name is required')
        if (!data.organization?.trim()) errors.push('Organization is required')
        break
      
      case 'courses':
        if (!data.academicYear?.trim()) errors.push('Academic Year is required')
        if (!data.semester?.trim()) errors.push('Semester is required')
        if (!data.courseCode?.trim()) errors.push('Course Code is required')
        if (!data.courseTitle?.trim()) errors.push('Course Title is required')
        if (data.credit !== null && (isNaN(Number(data.credit)) || Number(data.credit) <= 0)) {
          errors.push('Valid course credit is required')
        }
        break
      
      case 'research':
        if (!data.title?.trim()) errors.push('Title is required')
        if (!data.type?.trim()) errors.push('Type is required')
        if (!data.journalOrPublisher?.trim()) errors.push('Journal/Publisher is required')
        break
      
      case 'scientific':
        if (!data.title?.trim()) errors.push('Title is required')
        if (!data.type?.trim()) errors.push('Type is required')
        if (!data.date) errors.push('Date is required')
        if (!data.participation?.trim()) errors.push('Participation type is required')
        break
      
      case 'university':
      case 'community':
        if (!data.committeeOrTask?.trim()) errors.push('Committee/Task is required')
        if (!data.authority?.trim()) errors.push('Authority is required')
        if (!data.participation?.trim()) errors.push('Participation type is required')
        if (!data.dateFrom) errors.push('Date From is required')
        if (!data.dateTo) errors.push('Date To is required')
        if (data.dateFrom && data.dateTo && new Date(data.dateFrom) > new Date(data.dateTo)) {
          errors.push('Date From must be before Date To')
        }
        break
    }

    return { isValid: errors.length === 0, errors }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading achievements...</span>
        </div>
      </div>
    )
  }

  // Helpers to render action column
  const link = (url?: string) => url ? (
    <a 
      className="underline cursor-pointer text-blue-600 hover:text-blue-800" 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
    >
      <FolderOpen size={15} />
    </a>
  ) : '—'

  const editBtn = (res: string) => (value: any, row: any) => (
    <button
      onClick={() => setModal({
        key: res,
        title: `Edit ${res.toUpperCase()}`,
        editData: row,
        editId: row.id
      })}
      className="text-blue-600 underline mr-2 disabled:opacity-50"
      disabled={actionStates[`edit-${res}-${row.id}`]}
      title="Edit"
    >
      {actionStates[`edit-${res}-${row.id}`] ? (
        <RefreshCw size={15} className="animate-spin" />
      ) : (
        <Edit size={15} />
      )}
    </button>
  )

  const delBtn = (res: string) => (value: any, row: any) => (
    <button
      onClick={() => del(res, row.id)}
      className="text-red-600 underline disabled:opacity-50"
      disabled={actionStates[`delete-${res}-${row.id}`]}
      title="Delete"
    >
      {actionStates[`delete-${res}-${row.id}`] ? (
        <RefreshCw size={15} className="animate-spin" />
      ) : (
        <Trash2 size={15} />
      )}
    </button>
  )

  // ------------------ Awards ------------------
  const awardsCols = [
    { key: 'name', label: 'Name' },
    { key: 'area', label: 'Generated Area' },
    { key: 'organization', label: 'Generating Organization' },
    { key: 'dateObtained', label: 'Date Obtained', render: (v: any) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'fileUrl', label: 'Attachment', render: (v: any, row: any) => link(row.fileUrl) },
    { key: 'action', label: 'Action', render: (v: any, row: any) => (
      <div className="flex gap-2">
        {editBtn('awards')(v, row)}
        {delBtn('awards')(v, row)}
      </div>
    ) },
  ]

  // ------------------ Courses -----------------
  const coursesCols = [
    { key: 'academicYear', label: 'Academic Year' },
    { key: 'semester', label: 'Semester' },
    { key: 'courseCode', label: 'Course Code' },
    { key: 'section', label: 'Section' },
    { key: 'courseTitle', label: 'Course Title' },
    { key: 'credit', label: 'Course Credit' },
    { key: 'studentsCount', label: 'Number Of Students' },
    { key: 'studentsEvalAvg', label: 'Student Evaluation' },
    { key: 'action', label: 'Action', render: (v: any, row: any) => (
      <div className="flex gap-2">
        {editBtn('courses')(v, row)}
        {delBtn('courses')(v, row)}
      </div>
    ) },
  ]

  // -------- Research (Published Paper) --------
  const published = (data?.research || []).filter((r: any) => (r.kind || '').toUpperCase() === 'PUBLISHED')
  const publishedCols = [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'journalOrPublisher', label: 'Name Of The Journal' },
    { key: 'participation', label: 'Nature Of Participation' },
    { key: 'publicationDate', label: 'Date Of Publication', render: (v: any) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'fileUrl', label: 'Attachment', render: (v: any, row: any) => link(row.fileUrl) },
    { key: 'action', label: 'Action', render: (v: any, row: any) => (
      <div className="flex gap-2">
        <button
          onClick={() => {
            setModal({ 
              key: 'research_published', 
              title: 'Edit RESEARCH ACTIVITIES (PUBLISHED PAPER)', 
              editData: row, 
              editId: row.id 
            })
          }}
          className="text-blue-600 underline mr-2 disabled:opacity-50"
          disabled={actionStates[`edit-research_published-${row.id}`]}
          title="Edit"
        >
          {actionStates[`edit-research_published-${row.id}`] ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <Edit size={15} />
          )}
        </button>
        {delBtn('research')(v, row)}
      </div>
    ) },
  ]

  // ------------- Research (Article) ------------
  const articles = (data?.research || []).filter((r: any) => (r.kind || '').toUpperCase() === 'REFEREED_PAPER')
  const articlesCols = [
    { key: 'title', label: 'Title' },
    { key: 'refereedArticleRef', label: 'Refereed Article Reference', render: (v: any, r: any) => r.refereedArticleRef || '—' },
    { key: 'journalOrPublisher', label: 'Name Of The Journal' },
    { key: 'publicationDate', label: 'Date Of Submitting', render: (v: any) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'fileUrl', label: 'Attachment', render: (v: any, row: any) => link(row.fileUrl) },
    { key: 'action', label: 'Action', render: (v: any, row: any) => (
      <div className="flex gap-2">
        <button
          onClick={() => {
            setModal({ 
              key: 'research_article', 
              title: 'Edit RESEARCH ACTIVITIES (ARTICLE)', 
              editData: row, 
              editId: row.id 
            })
          }}
          className="text-blue-600 underline mr-2 disabled:opacity-50"
          disabled={actionStates[`edit-research_article-${row.id}`]}
          title="Edit"
        >
          {actionStates[`edit-research_article-${row.id}`] ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <Edit size={15} />
          )}
        </button>
        {delBtn('research')(v, row)}
      </div>
    ) },
  ]

  // --------------- Scientific -----------------
  const scientificCols = [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'date', label: 'Date', render: (v: any) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'participation', label: 'Type Of Participation' },
    { key: 'organizingAuth', label: 'Organizing Authority' },
    { key: 'venue', label: 'Venue' },
    { key: 'fileUrl', label: 'Attachment', render: (v: any, row: any) => link(row.fileUrl) },
    { key: 'action', label: 'Action', render: (v: any, row: any) => (
      <div className="flex gap-2">
        {editBtn('scientific')(v, row)}
        {delBtn('scientific')(v, row)}
      </div>
    ) },
  ]

  // --------------- University Service ----------
  const univCols = [
    { key: 'committeeOrTask', label: 'Committee Or Task' },
    { key: 'authority', label: 'Authority' },
    { key: 'participation', label: 'Nature Of Participation' },
    { key: 'dateTo', label: 'Date To', render: (v: any) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'dateFrom', label: 'Date From', render: (v: any) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'attachment', label: 'Attachment', render: (v: any) => link(v) },
    { key: 'action', label: 'Action', render: (v: any, row: any) => (
      <div className="flex gap-2">
        {editBtn('university')(v, row)}
        {delBtn('university')(v, row)}
      </div>
    ) },
  ]

  // --------------- Community Service ----------
  const commCols = [
    { key: 'committeeOrTask', label: 'Committee Or Task' },
    { key: 'authority', label: 'Authority' },
    { key: 'participation', label: 'Nature Of Participation' },
    { key: 'dateTo', label: 'Date To', render: (v: any) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'dateFrom', label: 'Date From', render: (v: any) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'attachment', label: 'Attachment', render: (v: any) => link(v) },
    { key: 'action', label: 'Action', render: (v: any, row: any) => (
      <div className="flex gap-2">
        {editBtn('community')(v, row)}
        {delBtn('community')(v, row)}
      </div>
    ) },
  ]

  return (
    <ErrorBoundary>
      <div className="space-y-3">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data?.awards?.length || 0}</div>
            <div className="text-sm text-gray-600">Awards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data?.courses?.length || 0}</div>
            <div className="text-sm text-gray-600">Courses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{published.length}</div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{articles.length}</div>
            <div className="text-sm text-gray-600">Articles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{data?.university?.length || 0}</div>
            <div className="text-sm text-gray-600">University</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">{data?.community?.length || 0}</div>
            <div className="text-sm text-gray-600">Community</div>
          </div>
        </div>

        {/* Awards */}
        <SectionBar 
          title="Awards And Acknowledging Certificates" 
          onAdd={() => setModal({ key: 'awards', title: 'AWARDS AND ACKNOWLEDGING CERTIFICATES' })} 
          onRefresh={() => mutate()}
          disabled={isLoading}
          itemCount={data?.awards?.length || 0}
        />
        <Table columns={awardsCols} rows={data?.awards || []} isLoading={isLoading} />

        {/* Courses Taught */}
        <SectionBar 
          title="Courses Taught" 
          onAdd={() => setModal({ key: 'courses', title: 'COURSES TAUGHT' })} 
          onRefresh={() => mutate()}
          disabled={isLoading}
          itemCount={data?.courses?.length || 0}
        />
        <Table columns={coursesCols} rows={data?.courses || []} isLoading={isLoading} />

        {/* Research Published */}
        <SectionBar 
          title="Research Activities (Published Paper)" 
          onAdd={() => setModal({ key: 'research_published', title: 'RESEARCH ACTIVITIES (PUBLISHED PAPER)' })} 
          onRefresh={() => mutate()}
          disabled={isLoading}
          itemCount={published.length}
        />
        <Table columns={publishedCols} rows={published} isLoading={isLoading} />

        {/* Research Articles */}
        <SectionBar 
          title="Research Activities (Article)" 
          onAdd={() => setModal({ key: 'research_article', title: 'RESEARCH ACTIVITIES (ARTICLE)' })} 
          onRefresh={() => mutate()}
          disabled={isLoading}
          itemCount={articles.length}
        />
        <Table columns={articlesCols} rows={articles} isLoading={isLoading} />

        {/* Scientific */}
        <SectionBar 
          title="Scientific Activities" 
          onAdd={() => setModal({ key: 'scientific', title: 'SCIENTIFIC ACTIVITIES' })} 
          onRefresh={() => mutate()}
          disabled={isLoading}
          itemCount={data?.scientific?.length || 0}
        />
        <Table columns={scientificCols} rows={data?.scientific || []} isLoading={isLoading} />

        {/* University Service */}
        <SectionBar 
          title="University Service Achievements" 
          onAdd={() => setModal({ key: 'university', title: 'UNIVERSITY SERVICE ACHIEVEMENTS' })} 
          onRefresh={() => mutate()}
          disabled={isLoading}
          itemCount={data?.university?.length || 0}
        />
        <Table columns={univCols} rows={data?.university || []} isLoading={isLoading} />

        {/* Community Service */}
        <SectionBar 
          title="Community Service Achievements" 
          onAdd={() => setModal({ key: 'community', title: 'COMMUNITY SERVICE ACHIEVEMENTS' })} 
          onRefresh={() => mutate()}
          disabled={isLoading}
          itemCount={data?.community?.length || 0}
        />
        <Table columns={commCols} rows={data?.community || []} isLoading={isLoading} />

        {/* Modals */}
        <AwardModal
          open={modal?.key === 'awards'}
          title={modal?.title || ''}
          onClose={() => setModal(null)}
          onSubmit={(p) => {
            if (modal?.editId) {
              edit('awards', modal.editId, p)
            } else {
              add('awards', p)
            }
          }}
          editData={modal?.editData}
          appraisalId={appraisalId}
          isLoading={actionStates[`add-awards`] || actionStates[`edit-awards-${modal?.editId}`]}
        />
        <CourseModal
          open={modal?.key === 'courses'}
          title={modal?.title || ''}
          onClose={() => setModal(null)}
          onSubmit={(p) => {
            if (modal?.editId) {
              edit('courses', modal.editId, p)
            } else {
              add('courses', p)
            }
          }}
          editData={modal?.editData}
          appraisalId={appraisalId}
          isLoading={actionStates[`add-courses`] || actionStates[`edit-courses-${modal?.editId}`]}
        />
        <ResearchModalPublished
          open={modal?.key === 'research_published'}
          title={modal?.title || ''}
          onClose={() => setModal(null)}
          onSubmit={(p) => {
            if (modal?.editId) {
              edit('research', modal.editId, { ...p, kind: 'PUBLISHED' })
            } else {
              add('research', { ...p, kind: 'PUBLISHED' })
            }
          }}
          editData={modal?.editData}
          appraisalId={appraisalId}
          isLoading={actionStates[`add-research_published`] || actionStates[`edit-research_published-${modal?.editId}`]}
        />
        <ResearchModalArticle
          open={modal?.key === 'research_article'}
          title={modal?.title || ''}
          onClose={() => setModal(null)}
          onSubmit={(p) => {
            if (modal?.editId) {
              edit('research', modal.editId, { ...p, kind: 'REFEREED_PAPER' })
            } else {
              add('research', { ...p, kind: 'REFEREED_PAPER' })
            }
          }}
          editData={modal?.editData}
          appraisalId={appraisalId}
          isLoading={actionStates[`add-research_article`] || actionStates[`edit-research_article-${modal?.editId}`]}
        />
        <ScientificModal
          open={modal?.key === 'scientific'}
          title={modal?.title || ''}
          onClose={() => setModal(null)}
          onSubmit={(p) => {
            if (modal?.editId) {
              edit('scientific', modal.editId, p)
            } else {
              add('scientific', p)
            }
          }}
          editData={modal?.editData}
          appraisalId={appraisalId}
          isLoading={actionStates[`add-scientific`] || actionStates[`edit-scientific-${modal?.editId}`]}
        />
        <ServiceModal
          open={modal?.key === 'university'}
          title={modal?.title || ''}
          onClose={() => setModal(null)}
          onSubmit={(p) => {
            if (modal?.editId) {
              edit('university', modal.editId, p)
            } else {
              add('university', p)
            }
          }}
          editData={modal?.editData}
          appraisalId={appraisalId}
          achievementType="university"
          isLoading={actionStates[`add-university`] || actionStates[`edit-university-${modal?.editId}`]}
        />
        <ServiceModal
          open={modal?.key === 'community'}
          title={modal?.title || ''}
          onClose={() => setModal(null)}
          onSubmit={(p) => {
            if (modal?.editId) {
              edit('community', modal.editId, p)
            } else {
              add('community', p)
            }
          }}
          editData={modal?.editData}
          appraisalId={appraisalId}
          achievementType="community"
          isLoading={actionStates[`add-community`] || actionStates[`edit-community-${modal?.editId}`]}
        />
      </div>
    </ErrorBoundary>
  )
}

// -------------------- MODALS ------------------------------

function Actions({ 
  onCancel, 
  onSubmit, 
  isLoading = false,
  submitText = "Save" 
}: { 
  onCancel: () => void
  onSubmit: () => void
  isLoading?: boolean
  submitText?: string
}) {
  return (
    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
      <button 
        onClick={onCancel} 
        className="px-3 py-1.5 rounded border disabled:opacity-50" 
        disabled={isLoading}
        type="button"
      >
        Cancel
      </button>
      <button 
        type="submit" 
        onClick={onSubmit}
        disabled={isLoading}
        className="px-3 py-1.5 rounded bg-gray-900 text-white disabled:opacity-50 flex items-center"
      >
        {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
        {isLoading ? 'Saving...' : submitText}
      </button>
    </div>
  )
}

// Enhanced form states
interface FormState {
  [key: string]: any
  errors: Record<string, string>
}

// AWARDS
function AwardModal({ 
  open, 
  title, 
  onClose, 
  onSubmit, 
  editData, 
  appraisalId,
  isLoading = false 
}: { 
  open: boolean
  title: string
  onClose: () => void
  onSubmit: (p: any) => void
  editData?: any
  appraisalId?: number
  isLoading?: boolean
}) {
  const [p, setP] = useState<FormState>({ errors: {} })
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // When modal opens, initialize from editData or reset for Add
  useEffect(() => {
    if (open) {
      if (editData) {
        setP({
          ...editData,
          credit: editData.credit != null ? String(editData.credit) : '',
          studentsCount: editData.studentsCount != null ? String(editData.studentsCount) : '',
          studentsEvalAvg: editData.studentsEvalAvg != null ? String(editData.studentsEvalAvg) : '',
          errors: {}
        })
      } else {
        setP({ errors: {} })
      }
    }
  }, [open, editData])

  // On close via backdrop/X/Cancel, clear local state and propagate
  const handleClose = () => {
    setP({ errors: {} })
    onClose()
  }

  // Field validation
  const validateField = (field: string, value: any) => {
    const errors: Record<string, string> = {}
    
    switch (field) {
      case 'name':
        if (!value?.trim()) errors[field] = 'Name is required'
        break
      case 'organization':
        if (!value?.trim()) errors[field] = 'Organization is required'
        break
      case 'dateObtained':
        if (!value) errors[field] = 'Date is required'
        break
    }
    
    return errors
  }

  // Update form data
  const updateField = (field: string, value: any) => {
    setP(prev => {
      const newP = { ...prev, [field]: value }
      // Clear field error when user starts typing
      if (prev.errors[field] && value?.trim()) {
        newP.errors = { ...prev.errors, [field]: '' }
      }
      return newP
    })
  }

  // Handle blur to mark field as touched
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Validate field on blur
    const fieldErrors = validateField(field, p[field])
    if (Object.keys(fieldErrors).length > 0) {
      setP(prev => ({ ...prev, errors: { ...prev.errors, ...fieldErrors } }))
    }
  }

  return (
    <Modal open={open} title={title} onClose={handleClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        
        // Validate all fields before submit
        const allErrors: Record<string, string> = {}
        Object.keys(p).forEach(key => {
          if (key !== 'errors' && key !== 'fileKey' && key !== 'attachment') {
            const fieldErrors = validateField(key, p[key])
            Object.assign(allErrors, fieldErrors)
          }
        })
        
        if (Object.keys(allErrors).length > 0) {
          setP(prev => ({ ...prev, errors: allErrors }))
          return
        }
        
        onSubmit(p)
      }}>
        <Field label="Name" required>
          <Input 
            value={p.name || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            error={touched.name && p.errors.name}
            placeholder="Enter award name"
          />
        </Field>
        <Field label="Generated Area">
          <Input 
            value={p.area || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('area', e.target.value)}
            placeholder="Area where award was generated"
          />
        </Field>
        <Field label="Generating Organization" required>
          <Input 
            value={p.organization || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('organization', e.target.value)}
            onBlur={() => handleBlur('organization')}
            error={touched.organization && p.errors.organization}
            placeholder="Organization that generated the award"
          />
        </Field>
        <Field label="Date Obtained" required>
          <Input 
            type="date" 
            value={p.dateObtained ? new Date(p.dateObtained).toISOString().split('T')[0] : ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('dateObtained', e.target.value)}
            onBlur={() => handleBlur('dateObtained')}
            error={touched.dateObtained && p.errors.dateObtained}
          />
        </Field>
        <FileInput 
          label="Attachment" 
          value={p.fileUrl} 
          onChange={(fileData) => updateField('fileUrl', fileData.url)} 
          entityType="achievement" 
          entityId={appraisalId?.toString() || ''} 
          achievementType="awards" 
        />
        <Actions onCancel={handleClose} onSubmit={() => {}} isLoading={isLoading} />
      </form>
    </Modal>
  )
}

// COURSES
function CourseModal({ 
  open, 
  title, 
  onClose, 
  onSubmit, 
  editData, 
  appraisalId,
  isLoading = false 
}: { 
  open: boolean
  title: string
  onClose: () => void
  onSubmit: (p: any) => void
  editData?: any
  appraisalId?: number
  isLoading?: boolean
}) {
  const [p, setP] = useState<FormState>({ errors: {} })
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (open) {
      if (editData) {
        setP({
          ...editData,
          credit: editData.credit != null ? String(editData.credit) : '',
          studentsCount: editData.studentsCount != null ? String(editData.studentsCount) : '',
          studentsEvalAvg: editData.studentsEvalAvg != null ? String(editData.studentsEvalAvg) : '',
          errors: {}
        })
      } else {
        setP({ errors: {} })
      }
    }
  }, [open, editData])

  const handleClose = () => {
    setP({ errors: {} })
    onClose()
  }

  const updateField = (field: string, value: any) => {
    setP(prev => {
      const newP = { ...prev, [field]: value }
      if (prev.errors[field] && (typeof value === 'string' ? value.trim() : value)) {
        newP.errors = { ...prev.errors, [field]: '' }
      }
      return newP
    })
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  return (
    <Modal open={open} title={title} onClose={handleClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          
          const payload = {
            academicYear: p.academicYear || null,
            semester: p.semester || null,
            courseCode: p.courseCode || null,
            section: p.section || null,
            courseTitle: p.courseTitle || null,
            credit: p.credit !== '' && p.credit != null ? Number(p.credit) : null,
            studentsCount: p.studentsCount !== '' && p.studentsCount != null ? Number(p.studentsCount) : null,
            studentsEvalAvg: p.studentsEvalAvg !== '' && p.studentsEvalAvg != null ? Number(p.studentsEvalAvg) : null,
          }
          
          onSubmit(payload)
        }}
      >
        <Field label="Academic Year" required>
          <Input 
            placeholder="2024/2025" 
            value={p.academicYear != null ? String(p.academicYear) : ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('academicYear', e.target.value)}
            onBlur={() => handleBlur('academicYear')}
            error={touched.academicYear && !p.academicYear?.trim()}
            placeholderText="e.g., 2024/2025"
          />
        </Field>
        <Field label="Semester" required>
          <Select 
            value={p.semester != null ? String(p.semester) : ''} 
            onValueChange={(value) => updateField('semester', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="First">First</SelectItem>
              <SelectItem value="Second">Second</SelectItem>
              <SelectItem value="Summer">Summer</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Course Code" required>
          <Input 
            placeholder="CS101" 
            value={p.courseCode != null ? String(p.courseCode) : ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('courseCode', e.target.value)}
            onBlur={() => handleBlur('courseCode')}
            error={touched.courseCode && !p.courseCode?.trim()}
          />
        </Field>
        <Field label="Section">
          <Input 
            placeholder="A" 
            value={p.section != null ? String(p.section) : ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('section', e.target.value)}
          />
        </Field>
        <Field label="Course Title" required>
          <Input 
            value={p.courseTitle != null ? String(p.courseTitle) : ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('courseTitle', e.target.value)}
            onBlur={() => handleBlur('courseTitle')}
            error={touched.courseTitle && !p.courseTitle?.trim()}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Course Credit">
            <Input 
              type="number" 
              step="0.5" 
              min="0" 
              value={p.credit || ''} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('credit', e.target.value)}
              placeholder="e.g., 3.0"
            />
          </Field>
          <Field label="Number Of Students">
            <Input 
              type="number" 
              min="0" 
              value={p.studentsCount || ''} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('studentsCount', e.target.value)}
              placeholder="e.g., 30"
            />
          </Field>
        </div>
        <Field label="Student Evaluation Average">
          <Input 
            type="number" 
            step="0.01" 
            min="0" 
            max="5" 
            placeholder="4.5" 
            value={p.studentsEvalAvg || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('studentsEvalAvg', e.target.value)}
          />
        </Field>
        <Actions onCancel={handleClose} onSubmit={() => {}} isLoading={isLoading} />
      </form>
    </Modal>
  )
}

// RESEARCH (PUBLISHED)
function ResearchModalPublished({ 
  open, 
  title, 
  onClose, 
  onSubmit, 
  editData, 
  appraisalId,
  isLoading = false 
}: { 
  open: boolean
  title: string
  onClose: () => void
  onSubmit: (p: any) => void
  editData?: any
  appraisalId?: number
  isLoading?: boolean
}) {
  const [p, setP] = useState<FormState>({ errors: {} })

  useEffect(() => {
    if (open) {
      if (editData) {
        setP({ ...editData, errors: {} })
      } else {
        setP({ errors: {} })
      }
    }
  }, [open, editData])

  const handleClose = () => {
    setP({ errors: {} })
    onClose()
  }

  const updateField = (field: string, value: any) => {
    setP(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal open={open} title={title} onClose={handleClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...p, kind: 'PUBLISHED' }) }}>
        <Field label="Title" required>
          <Input 
            value={p.title || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('title', e.target.value)}
            placeholder="Research paper title"
          />
        </Field>
        <Field label="Type" required>
          <Select value={p.type || ''} onValueChange={(value) => updateField('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select research activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JOURNAL">Journal</SelectItem>
              <SelectItem value="CONFERENCE">Conference</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Name Of The Journal" required>
          <Input 
            value={p.journalOrPublisher || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('journalOrPublisher', e.target.value)}
            placeholder="Journal or conference name"
          />
        </Field>
        <Field label="Nature Of Participation">
          <Input 
            value={p.participation || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('participation', e.target.value)}
            placeholder="e.g., Author, Co-author, etc."
          />
        </Field>
        <Field label="Date Of Publication">
          <Input 
            type="date" 
            value={p.publicationDate ? new Date(p.publicationDate).toISOString().split('T')[0] : ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('publicationDate', e.target.value)}
          />
        </Field>
        <FileInput 
          label="Attachment" 
          value={p.fileUrl} 
          onChange={(fileData) => updateField('fileUrl', fileData.url)} 
          entityType="achievement" 
          entityId={appraisalId?.toString() || ''} 
          achievementType="research" 
        />
        <Actions onCancel={handleClose} onSubmit={() => {}} isLoading={isLoading} />
      </form>
    </Modal>
  )
}

// RESEARCH (ARTICLE)
function ResearchModalArticle({ 
  open, 
  title, 
  onClose, 
  onSubmit, 
  editData, 
  appraisalId,
  isLoading = false 
}: { 
  open: boolean
  title: string
  onClose: () => void
  onSubmit: (p: any) => void
  editData?: any
  appraisalId?: number
  isLoading?: boolean
}) {
  const [p, setP] = useState<FormState>({ errors: {} })

  useEffect(() => {
    if (open) {
      if (editData) {
        setP({ ...editData, errors: {} })
      } else {
        setP({ errors: {} })
      }
    }
  }, [open, editData])

  const handleClose = () => {
    setP({ errors: {} })
    onClose()
  }

  const updateField = (field: string, value: any) => {
    setP(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal open={open} title={title} onClose={handleClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(p) }}>
        <Field label="Title" required>
          <Input 
            value={p.title || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('title', e.target.value)}
            placeholder="Research article title"
          />
        </Field>
        <Field label="Type" required>
          <Select value={p.type || ''} onValueChange={(value) => updateField('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select research activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JOURNAL">Journal</SelectItem>
              <SelectItem value="CONFERENCE">Conference</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Refereed Article Reference">
          <Input 
            value={p.refereedArticleRef || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('refereedArticleRef', e.target.value)}
            placeholder="DOI or reference number"
          />
        </Field>
        <Field label="Name Of The Journal" required>
          <Input 
            value={p.journalOrPublisher || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('journalOrPublisher', e.target.value)}
            placeholder="Journal name"
          />
        </Field>
        <Field label="Date Of Submitting">
          <Input 
            type="date" 
            value={p.publicationDate ? new Date(p.publicationDate).toISOString().split('T')[0] : ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('publicationDate', e.target.value)}
          />
        </Field>
        <FileInput 
          label="Attachment" 
          value={p.fileUrl} 
          onChange={(fileData) => updateField('fileUrl', fileData.url)} 
          entityType="achievement" 
          entityId={appraisalId?.toString() || ''} 
          achievementType="research" 
        />
        <Actions onCancel={handleClose} onSubmit={() => {}} isLoading={isLoading} />
      </form>
    </Modal>
  )
}

// SCIENTIFIC
function ScientificModal({ 
  open, 
  title, 
  onClose, 
  onSubmit, 
  editData, 
  appraisalId,
  isLoading = false 
}: { 
  open: boolean
  title: string
  onClose: () => void
  onSubmit: (p: any) => void
  editData?: any
  appraisalId?: number
  isLoading?: boolean
}) {
  const [p, setP] = useState<FormState>({ errors: {} })

  useEffect(() => {
    if (open) {
      if (editData) {
        setP({ ...editData, errors: {} })
      } else {
        setP({ errors: {} })
      }
    }
  }, [open, editData])

  const handleClose = () => {
    setP({ errors: {} })
    onClose()
  }

  const updateField = (field: string, value: any) => {
    setP(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal open={open} title={title} onClose={handleClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(p) }}>
        <Field label="Title" required>
          <Input 
            value={p.title || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('title', e.target.value)}
            placeholder="Scientific activity title"
          />
        </Field>
        <Field label="Type" required>
          <Select value={p.type || ''} onValueChange={(value) => updateField('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select scientific activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONFERENCE">Conference</SelectItem>
              <SelectItem value="SEMINAR">Seminar</SelectItem>
              <SelectItem value="WORKSHOP">Workshop</SelectItem>
              <SelectItem value="TRAINING">Training</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date" required>
          <Input 
            type="date" 
            value={p.date ? new Date(p.date).toISOString().split('T')[0] : ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('date', e.target.value)}
          />
        </Field>
        <Field label="Type Of Participation" required>
          <Select value={p.participation || ''} onValueChange={(value) => updateField('participation', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select participation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MODERATOR">Moderator</SelectItem>
              <SelectItem value="COORDINATOR">Coordinator</SelectItem>
              <SelectItem value="PRESENTER">Presenter</SelectItem>
              <SelectItem value="PARTICIPANT">Participant</SelectItem>
              <SelectItem value="PAPER">Paper</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Organizing Authority">
          <Input 
            value={p.organizingAuth || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('organizingAuth', e.target.value)}
            placeholder="Organizing authority/organization"
          />
        </Field>
        <Field label="Venue">
          <Input 
            value={p.venue || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('venue', e.target.value)}
            placeholder="Event venue"
          />
        </Field>
        <FileInput 
          label="Attachment" 
          value={p.fileUrl} 
          onChange={(fileData) => updateField('fileUrl', fileData.url)} 
          entityType="achievement" 
          entityId={appraisalId?.toString() || ''} 
          achievementType="scientific" 
        />
        <Actions onCancel={handleClose} onSubmit={() => {}} isLoading={isLoading} />
      </form>
    </Modal>
  )
}

// SERVICE (University/Community)
function ServiceModal({ 
  open, 
  title, 
  onClose, 
  onSubmit, 
  editData, 
  appraisalId, 
  achievementType,
  isLoading = false 
}: { 
  open: boolean
  title: string
  onClose: () => void
  onSubmit: (p: any) => void
  editData?: any
  appraisalId?: number
  achievementType?: string
  isLoading?: boolean
}) {
  const [p, setP] = useState<FormState>({ errors: {} })

  useEffect(() => {
    if (open) {
      if (editData) {
        setP({ ...editData, errors: {} })
      } else {
        setP({ errors: {} })
      }
    }
  }, [open, editData])

  const handleClose = () => {
    setP({ errors: {} })
    onClose()
  }

  const updateField = (field: string, value: any) => {
    setP(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal open={open} title={title} onClose={handleClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(p) }}>
        <Field label="Committee Or Task" required>
          <Input 
            value={p.committeeOrTask || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('committeeOrTask', e.target.value)}
            placeholder="Name of committee or task"
          />
        </Field>
        <Field label="Authority" required>
          <Input 
            value={p.authority || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('authority', e.target.value)}
            placeholder="Authority or organization"
          />
        </Field>
        <Field label="Nature Of Participation" required>
          <Input 
            value={p.participation || ''} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('participation', e.target.value)}
            placeholder="e.g., Member, Chair, etc."
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date From" required>
            <Input 
              type="date" 
              value={p.dateFrom ? new Date(p.dateFrom).toISOString().split('T')[0] : ''} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('dateFrom', e.target.value)}
            />
          </Field>
          <Field label="Date To" required>
            <Input 
              type="date" 
              value={p.dateTo ? new Date(p.dateTo).toISOString().split('T')[0] : ''} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('dateTo', e.target.value)}
            />
          </Field>
        </div>
        <FileInput 
          label="Attachment" 
          value={p.fileUrl} 
          onChange={(fileData) => updateField('fileUrl', fileData.url)} 
          entityType="achievement" 
          entityId={appraisalId?.toString() || ''} 
          achievementType={achievementType || 'university'} 
        />
        <Actions onCancel={handleClose} onSubmit={() => {}} isLoading={isLoading} />
      </form>
    </Modal>
  )
}
