import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui/use-toast'
import { parseBankFile, ParseResult } from '@/lib/fileParsers'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Upload as UploadIcon, 
  FileCheck,
  AlertCircle, 
  Loader2, 
  RefreshCw,
  X,
  AlertTriangle
} from 'lucide-react'

type UploadState = 'idle' | 'parsing' | 'success' | 'error'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  const resetUpload = useCallback(() => {
    setFile(null)
    setParseResult(null)
    setUploadState('idle')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setUploadState('parsing')

    try {
      const result = await parseBankFile(selectedFile)
      setParseResult(result)

      if (result.errors.length > 0) {
        setUploadState('error')
        toast({
          variant: 'destructive',
          title: 'Error parsing file',
          description: result.errors[0],
        })
      } else if (result.rows.length > 0) {
        setUploadState('success')
      } else {
        setUploadState('error')
        toast({
          variant: 'destructive',
          title: 'Empty File',
          description: 'The file appears to be empty or could not be read.',
        })
      }
    } catch (e: any) {
      setUploadState('error')
      toast({
        variant: 'destructive',
        title: 'Parsing Failed',
        description: e.message || 'An unknown error occurred.',
      })
    }
  }, [toast])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  const handleNext = () => {
    if (file && parseResult) {
      navigate('/map-columns', {
        state: {
          file: file,
          rows: parseResult.rows,
          fileName: file.name,
        }
      })
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Upload Transactions</h1>
      <p className="text-muted-foreground mb-8">Select a CSV, XLSX, or PDF file to import.</p>

      <Card
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`transition-all duration-300 ${isDragging ? 'border-primary' : ''}`}
      >
        <CardContent className="p-12 text-center cursor-pointer">
          {uploadState === 'idle' && (
            <>
              <UploadIcon className="w-16 h-16 mx-auto text-cyan-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Click or drag & drop to upload</h2>
              <p className="text-sm text-muted-foreground">Supports CSV, XLS, XLSX</p>
            </>
          )}
          {uploadState === 'parsing' && <Loader2 className="w-16 h-16 mx-auto animate-spin text-cyan-400" />}
          {uploadState === 'success' && file && parseResult && (
            <div className="space-y-2">
              <FileCheck className="w-16 h-16 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold">{file.name}</h2>
              <p className="text-sm text-muted-foreground">{formatFileSize(file.size)} • {parseResult.rowCount} rows found</p>
            </div>
          )}
          {uploadState === 'error' && (
            <div className="space-y-2">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
              <h2 className="text-xl font-semibold">Upload Failed</h2>
              <p className="text-sm text-muted-foreground">{parseResult?.errors[0] || 'An error occurred.'}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xls,.xlsx,.pdf"
        onChange={handleFileInput}
        className="hidden"
      />

      {(uploadState === 'success' || uploadState === 'error') && (
        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={resetUpload}>
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
          {uploadState === 'success' && (
            <Button onClick={handleNext}>
              Continue to Mapping
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
