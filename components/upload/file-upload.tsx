"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, CheckCircle, Loader2 } from "lucide-react"

interface FileUploadProps {
  entityId: string
  entityType: "appraisal" | "achievement"
  onUploadComplete?: (filename: string) => void
}

export function FileUpload({ entityId, entityType, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      await uploadFile(file)
    }
  }

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type: ${file.name}. Please upload PDF, images, or Word documents.`)
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`File too large: ${file.name}. Maximum size is 10MB.`)
      return
    }

    setIsUploading(true)
    setError("")
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", entityType)
      formData.append("entityId", entityId)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          setUploadedFiles((prev) => [...prev, response.filename])
          onUploadComplete?.(response.filename)
          setUploadProgress(100)
        } else {
          const error = JSON.parse(xhr.responseText)
          setError(error.error || "Upload failed")
        }
        setIsUploading(false)
      })

      xhr.addEventListener("error", () => {
        setError("Upload failed")
        setIsUploading(false)
      })

      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    } catch (error: any) {
      setError(error.message)
      setIsUploading(false)
    }
  }

  const removeUploadedFile = (filename: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f !== filename))
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Upload className="h-5 w-5" />
          Upload Evidence Files
        </CardTitle>
        <CardDescription>
          Upload supporting documents (PDF, images, Word documents). Maximum file size: 10MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? "border-accent bg-accent/10" : "border-border hover:border-accent hover:bg-accent/5"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-card-foreground mb-2">Drag and drop files here, or click to select</p>
          <p className="text-sm text-muted-foreground mb-4">Supported formats: PDF, JPG, PNG, GIF, DOC, DOCX</p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <File className="mr-2 h-4 w-4" />
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-card-foreground">Uploaded Files:</h4>
            <div className="space-y-2">
              {uploadedFiles.map((filename) => (
                <div key={filename} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{filename}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeUploadedFile(filename)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
