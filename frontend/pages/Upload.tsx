import React, { useState, useRef, useEffect } from 'react'
import { parseBankFile } from '@/lib/fileParsers'
import { supabase } from '@/lib/supabase'
import { TransactionRow } from '@/lib/types'
import { suggestCategory, callMLPredict } from '@/lib/ai'
import { ensureDefaultCategories } from '@/lib/seed'
import { useUser } from '@clerk/clerk-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { 
  Upload as UploadIcon, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  X,
  FileCheck,
  AlertTriangle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type UploadState = 'idle' | 'parsing' | 'uploading' | 'success' | 'error'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [rows, setRows] = useState<TransactionRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [isNextDisabled, setIsNextDisabled] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()
  const navigate = useNavigate()
  const user = useUser()

  const resetUpload = () => {
    setFile(null)
    setRows([])
    setErrors([])
    setWarnings([])
    setProgress(0)
    setUploadState('idle')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = async (f?: File | null) => {
    if (!f) return
    
    setFile(f)
    setUploadState('parsing')
    setProgress(30)
    
    try {
      const result = await parseBankFile(f)
      
      setRows(result.rows)
      setErrors(result.errors)
      
      // Show warnings for large files but still allow proceeding
      if (result.rowCount > 1000) {
        setWarnings([`Large file detected (${result.rowCount} rows). Processing may take longer than usual.`])
      }
      
      if (result.errors.length > 0) {
        setUploadState('error')
      } else if (result.rows.length > 0) {
        setUploadState('success')
        setIsNextDisabled(false)
      } else {
        setUploadState('idle')
      }
    } catch (e: any) {
      setErrors([`Failed to parse file: ${e.message || 'Unknown error'}`])
      setUploadState('error')
    } finally {
      setProgress(100)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const dropped = e.dataTransfer.files?.[0]
    if (!dropped) return
    
    const name = dropped.name.toLowerCase()
    const validExtensions = ['.csv', '.xls', '.xlsx']
    const isValid = validExtensions.some(ext => name.endsWith(ext))
    
    if (isValid) {
      handleFileSelect(dropped)
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a CSV, XLS, or XLSX file.'
      })
    }
  }

  const handleNext = () => {
    // This will be connected to the column mapping step
    navigate('/map-columns', { 
      state: { 
        file: file,
        rows: rows,
        fileName: file?.name || 'bank_statement'
      } 
    })
  }

  // Handle keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && uploadState !== 'idle') {
        resetUpload()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [uploadState])

  // Auto-focus the dropzone for keyboard navigation
  useEffect(() => {
    if (dropZoneRef.current && uploadState === 'idle') {
      dropZoneRef.current.focus()
    }
  }, [uploadState])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      if (f.size > 25 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Maximum file size is 25MB. Please upload a smaller file.'
        })
        return
      }
      handleFileSelect(f)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto" role="main" aria-labelledby="upload-heading">
      <div className="mb-6">
        <h1 id="upload-heading" className="text-3xl md:text-4xl font-bold mb-2">Upload Bank Statement</h1>
        <p className="text-muted-foreground">Import your CSV, XLS, or XLSX files for AI-powered categorization.</p>
      </div>

      {/* Stepper */}
      {/* Stepper */}
      <div className="mb-6 bg-card/50 border-border/40 rounded-2xl p-4 md:p-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 md:gap-4">
              <div 
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-medium
                  ${uploadState !== 'idle' ? 'bg-cyan-800 text-white' : 'bg-border/30 text-muted-foreground'}`}
                aria-current={uploadState !== 'idle' ? 'step' : undefined}
              >
                1
              </div>
              <div className="flex-1 h-2 bg-border/30 rounded">
                <div 
                  className={`h-2 rounded transition-all duration-300 ${uploadState !== 'idle' ? 'bg-cyan-500' : 'bg-transparent'}`}
                  style={{ width: uploadState !== 'idle' ? '100%' : '0%' }}
                />
              </div>
              <div 
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-medium
                  ${uploadState === 'success' ? 'bg-cyan-800 text-white' : 'bg-border/30 text-muted-foreground'}`}
                aria-current={uploadState === 'success' ? 'step' : undefined}
              >
                2
              </div>
              <div className="flex-1 h-2 bg-border/30 rounded">
                <div className="h-2 bg-border/30 rounded w-0" />
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-border/30 text-muted-foreground flex items-center justify-center text-sm md:text-base">
                3
              </div>
            </div>
            <div className="mt-3 text-xs md:text-sm text-muted-foreground flex justify-between px-1">
              <div className="text-center">Upload File</div>
              <div className="text-center">Map Columns</div>
              <div className="text-center">Review & Import</div>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl overflow-hidden">
        <CardContent className="space-y-6 p-0">
          {/* Progress Bar */}
          {uploadState === 'parsing' && (
            <div className="h-1.5 bg-background">
              <Progress value={progress} className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300 ease-in-out" />
            </div>
          )}

          {/* Large Drop Area */}
          <div
            ref={dropZoneRef}
            onDragOver={(e) => { 
              e.preventDefault()
              e.stopPropagation()
              if (uploadState === 'idle') {
                setIsDragging(true)
              }
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => onDrop(e)}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl p-6 md:p-12 transition-all duration-200 ${
              isDragging 
                ? 'border-2 border-cyan-400 bg-cyan-500/5 ring-2 ring-cyan-400/20' 
                : 'border border-dashed border-border/30 hover:border-cyan-400/60 hover:bg-cyan-500/3'
            } ${uploadState !== 'idle' ? 'opacity-80' : ''}`}
            style={{ minHeight: '320px' }}
            role="button"
            tabIndex={0}
            aria-label="Drag and drop your bank statement file here or click to browse"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
          >
            <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center text-center">
              {uploadState === 'idle' && (
                <>
                  <UploadIcon className="w-16 h-16 mx-auto text-cyan-400 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Upload Bank Statement</h2>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    Drag and drop your file here, or click to browse
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>Supports: CSV, XLS, XLSX (Max 25MB)</p>
                  </div>
                </>
              )}

              {uploadState === 'parsing' && (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                  <p className="text-lg font-medium">Processing your file...</p>
                  <p className="text-sm text-muted-foreground">This may take a moment</p>
                </div>
              )}

              {uploadState === 'success' && file && (
                <div className="flex flex-col items-center justify-center space-y-6 py-8">
                  <div className="relative">
                    <FileCheck className="w-16 h-16 text-green-500" />
                    <div className="absolute -right-2 -bottom-2 bg-green-500 text-white rounded-full p-1.5">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium">File Ready</h3>
                    <p className="text-sm text-muted-foreground mt-1">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} • {rows.length} transactions</p>
                  </div>
                  
                  {warnings.length > 0 && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 w-full max-w-md text-left">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-amber-700">{warnings[0]}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {uploadState === 'error' && file && (
                <div className="flex flex-col items-center justify-center space-y-6 py-8">
                  <div className="rounded-full bg-red-100 p-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Error Processing File</h3>
                    <p className="text-sm text-muted-foreground mt-1">{file.name}</p>
                    {errors.length > 0 && (
                      <div className="mt-3 text-sm text-red-600 max-w-md">
                        {errors[0]}
                        {errors.length > 1 && ` (and ${errors.length - 1} more error${errors.length > 2 ? 's' : ''})`}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation()
                      resetUpload()
                    }}
                    className="mt-2"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                  </Button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileInput}
                className="sr-only"
                aria-label="Select file to upload"
              />
            </div>
          </div>

          {/* File Info & Actions */}
          {(uploadState === 'success' || uploadState === 'error' || uploadState === 'parsing') && (
            <div className="px-6 pb-6 -mt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{file?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(file?.size || 0)} • {rows.length} transactions
                  </div>
                  {warnings.length > 0 && (
                    <div className="flex items-center text-amber-600 text-xs mt-1">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span>{warnings[0]}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetUpload()
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    <X className="h-4 w-4 mr-2" /> Change File
                  </Button>
                  
                  <Button 
                    onClick={handleNext}
                    disabled={uploadState === 'parsing' || isNextDisabled}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    {uploadState === 'parsing' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Continue to Mapping'
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Error details */}
              {errors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-800">Issues found in file</h4>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {errors.slice(0, 3).map((error, i) => (
                          <li key={i} className="text-red-700">{error}</li>
                        ))}
                        {errors.length > 3 && (
                          <li className="text-red-700">And {errors.length - 3} more issues</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Keyboard Shortcuts Help */}
      <div className="mt-6 text-xs text-muted-foreground text-center">
        <p>Tip: Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[0.7rem] font-mono">Esc</kbd> to reset the upload</p>
      </div>
    </div>
  )
}
