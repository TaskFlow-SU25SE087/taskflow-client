import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FileText, Loader2, RefreshCw, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface FileUploadProps {
  onFileUpload: (file: File, onProgress?: (progress: number) => void) => Promise<void>
  acceptedFileTypes?: string
  maxFileSize?: number // in MB
  timeout?: number // in milliseconds
}

export default function FileUpload({
  onFileUpload,
  acceptedFileTypes = '.csv,.xlsx,.xls',
  maxFileSize = 5,
  timeout = 60000 // 60 seconds default timeout - increased for Excel processing
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stuckProgress, setStuckProgress] = useState<number | null>(null)
  const [stuckStartTime, setStuckStartTime] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stuckCheckRef = useRef<NodeJS.Timeout | null>(null)

  const handleFileSelect = (file: File) => {
    // Clear previous error
    setError(null)
    
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = acceptedFileTypes.replace(/\./g, '').split(',')

    if (!allowedExtensions.includes(fileExtension || '')) {
      setError(`Please select a valid file type: ${acceptedFileTypes}`)
      return
    }

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`File size must be less than ${maxFileSize}MB`)
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
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
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

    const startTime = Date.now()
    console.log(`🚀 Upload started at: ${new Date().toLocaleTimeString()}`)
    console.log(`📁 File: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`)
    console.log(`⏱️ Timeout set to: ${timeout/1000}s`)

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    
    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (isUploading) {
        const elapsedTime = Date.now() - startTime
        console.log(`⏰ Upload timeout after ${elapsedTime}ms (${(elapsedTime/1000).toFixed(1)}s)`)
        setIsUploading(false)
        setError('Upload timeout. Please try again.')
        setUploadProgress(0)
      }
    }, timeout)
    
    try {
      // Create progress callback
      const onProgress = (progress: number) => {
        const elapsedTime = Date.now() - startTime
        const clampedProgress = Math.max(0, Math.min(100, progress))
        setUploadProgress(clampedProgress)
        
        console.log(`📊 Progress: ${clampedProgress}% | Time: ${elapsedTime}ms (${(elapsedTime/1000).toFixed(1)}s)`)
        
        // Check for stuck progress
        if (stuckProgress === null) {
          setStuckProgress(clampedProgress)
          setStuckStartTime(Date.now())
        } else if (clampedProgress === stuckProgress) {
          // Progress is stuck, check how long
          const stuckTime = Date.now() - (stuckStartTime || startTime)
          if (stuckTime > 10000) { // 10 seconds stuck
            console.warn(`⚠️ Progress stuck at ${clampedProgress}% for ${(stuckTime/1000).toFixed(1)}s`)
            if (stuckTime > 30000) { // 30 seconds stuck - auto retry
              console.error(`🚨 Progress stuck for too long (${(stuckTime/1000).toFixed(1)}s), auto-retrying...`)
              handleAutoRetry()
              return
            }
          }
        } else {
          // Progress changed, reset stuck detection
          setStuckProgress(clampedProgress)
          setStuckStartTime(Date.now())
        }
        
        // Log specific milestones
        if (clampedProgress === 25) console.log(`🎯 Quarter complete at ${(elapsedTime/1000).toFixed(1)}s`)
        if (clampedProgress === 50) console.log(`🎯 Halfway complete at ${(elapsedTime/1000).toFixed(1)}s`)
        if (clampedProgress === 75) console.log(`🎯 Three-quarters complete at ${(elapsedTime/1000).toFixed(1)}s`)
        if (clampedProgress === 100) console.log(`🎯 Complete at ${(elapsedTime/1000).toFixed(1)}s`)
      }
      
      await onFileUpload(selectedFile, onProgress)
      
      // Clear timeout since upload completed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      // Ensure we reach 100% before completing
      setUploadProgress(100)
      
      const totalTime = Date.now() - startTime
      console.log(`✅ Upload completed successfully in ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`)
      
      // Wait a bit to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Reset progress sau 1.5 giây
      setTimeout(() => {
        setUploadProgress(0)
      }, 1500)
      
    } catch (error) {
      const elapsedTime = Date.now() - startTime
      console.error(`❌ Upload failed after ${elapsedTime}ms (${(elapsedTime/1000).toFixed(1)}s):`, error)
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.')
      setUploadProgress(0)
    } finally {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setIsUploading(false)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    // Cancel upload and reset all state
    setIsUploading(false)
    setSelectedFile(null)
    setError(null)
    setUploadProgress(0)
    setStuckProgress(null)
    setStuckStartTime(null)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (stuckCheckRef.current) {
      clearTimeout(stuckCheckRef.current)
      stuckCheckRef.current = null
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRetry = () => {
    setError(null)
    if (selectedFile) {
      handleUpload()
    }
  }

  const handleAutoRetry = () => {
    console.log('🔄 Auto-retrying upload due to stuck progress...')
    setError('Upload stuck for too long. Auto-retrying...')
    setUploadProgress(0)
    setStuckProgress(null)
    setStuckStartTime(null)
    
    // Clear all timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (stuckCheckRef.current) {
      clearTimeout(stuckCheckRef.current)
      stuckCheckRef.current = null
    }
    
    // Wait a bit then retry
    setTimeout(() => {
      if (selectedFile) {
        handleUpload()
      }
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <Upload className='h-5 w-5' />
          <span>Import Users</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className='h-8 w-8 mx-auto text-muted-foreground mb-2' />
          <p className='text-sm text-muted-foreground mb-2'>
            Drag and drop your file here, or{' '}
            <button type='button' onClick={handleBrowseClick} className='text-primary hover:underline'>
              browse
            </button>
            .
          </p>
          <Button type='button' onClick={handleBrowseClick} variant='outline' className='mb-2'>
            Choose File
          </Button>
          <p className='text-xs text-muted-foreground'>
            Supported formats: {acceptedFileTypes} (Max {maxFileSize}MB)
          </p>

          <Input
            ref={fileInputRef}
            type='file'
            accept={acceptedFileTypes}
            onChange={handleFileInputChange}
            className='hidden'
          />
        </div>

        {selectedFile && (
          <div className='flex items-center space-x-3 p-3 bg-muted/50 rounded-lg'>
            <FileText className='h-5 w-5 text-primary' />
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium truncate'>{selectedFile.name}</p>
              <p className='text-xs text-muted-foreground'>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              Remove
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className='flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg'>
            <X className='h-5 w-5 text-red-500' />
            <div className='flex-1'>
              <p className='text-sm text-red-700'>{error}</p>
            </div>
          </div>
        )}

        <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className='w-full'>
          {isUploading ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin mr-2' />
              {uploadProgress > 0 ? `Progressing... ${uploadProgress}%` : 'Progressing...'}
            </>
          ) : (
            <>
              <Upload className='h-4 w-4 mr-2' />
              Upload File
            </>
          )}
        </Button>

        {/* Cancel button for stuck uploads */}
        {isUploading && stuckProgress !== null && (
          <Button 
            onClick={handleRemoveFile} 
            variant='destructive' 
            className='w-full'
          >
            <X className='h-4 w-4 mr-2' />
            🚨 Cancel Upload
          </Button>
        )}

        {/* Progress bar */}
        {isUploading && (
          <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
            <div 
              className={`bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out relative ${
                uploadProgress === 100 ? 'animate-pulse' : ''
              }`}
              style={{ width: `${uploadProgress}%` }}
            >
              {/* Shimmer effect */}
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse'></div>
              
              {/* Success indicator when reaching 100% */}
              {uploadProgress === 100 && (
                <div className='absolute right-0 top-0 w-2 h-2 bg-green-400 rounded-full animate-bounce'></div>
              )}
            </div>
          </div>
        )}

        {/* Upload status */}
        {isUploading && (
          <div className='text-center text-sm text-muted-foreground'>
            {uploadProgress === 0 ? 'Preparing upload...' : 
             uploadProgress < 100 ? `Progressing... ${uploadProgress}%` : 
             'Finalizing upload...'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}