import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FileText, Loader2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>
  acceptedFileTypes?: string
  maxFileSize?: number // in MB
}

export default function FileUpload({ 
  onFileUpload, 
  acceptedFileTypes = ".csv,.xlsx,.xls",
  maxFileSize = 5 
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = acceptedFileTypes.replace(/\./g, '').split(',')
    
    if (!allowedExtensions.includes(fileExtension || '')) {
      alert(`Please select a valid file type: ${acceptedFileTypes}`)
      return
    }

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      alert(`File size must be less than ${maxFileSize}MB`)
      return
    }

    setSelectedFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      await onFileUpload(selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Import Users</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop your file here, or{' '}
            <button
              type="button"
              onClick={handleBrowseClick}
              className="text-primary hover:underline"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            Supported formats: {acceptedFileTypes} (Max {maxFileSize}MB)
          </p>
          
          <Input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {selectedFile && (
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFile(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            >
              Remove
            </Button>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 