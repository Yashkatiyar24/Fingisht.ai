import * as React from 'react'
import { parseAny as parseCsvFile } from '@/lib/parseFile'
import { TransactionRow } from '@/lib/types'
import { useUser } from '@clerk/clerk-react'
import { useBackend } from '@/lib/backend'
import { useToast } from '@/components/ui/use-toast'
import { Upload, FileText, X, FileUp, FileDown, FileSpreadsheet, FileCheck2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UploadCsv() {
  const [file, setFile] = React.useState<File | null>(null)
  const [rows, setRows] = React.useState<TransactionRow[]>([])
  const [errors, setErrors] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const user = useUser()
  const backend = useBackend()
  const { toast } = useToast()

  const onFile = (f?: File) => {
    if (!f) return
    setFile(f)
    parseCsvFile(f).then(({rows, errors}) => {
      setRows(rows)
      setErrors(errors)
    })
  }

  async function upload() {
    if (!user.user) {
      toast({ variant: 'destructive', title: 'Please sign in first' })
      return
    }
    if (!rows.length) {
      toast({ variant: 'destructive', title: 'No rows to upload' })
      return
    }
    setLoading(true)
    try {
      const prepared = rows.map(r => ({
        date: r.date ?? null,
        description: r.description ?? '',
        amount: r.amount ?? 0,
        merchant: r.merchant ?? '',
        currency: r.currency ?? 'INR',
        category_id: r.category_id ?? null,
        ai_suggested_category: r.ai_suggested_category ?? null,
        ai_confidence: r.ai_confidence ?? null,
        raw_source: r.raw_source ? JSON.stringify(r.raw_source) : null,
      }))

  // call backend transaction import (cast to any because client types are generated at build time)
  const res = await (backend.transaction as any).importTransactions({ rows: prepared })
      toast({ title: `Imported ${res.inserted} rows` })
      setRows([])
      setFile(null)
    } catch (e:any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Upload Transactions</h2>
          <p className="text-muted-foreground">Upload your bank or credit card statements</p>
        </div>
        {file && (
          <Button 
            variant="outline" 
            onClick={() => {
              setFile(null)
              setRows([])
              setErrors([])
            }}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {!file ? (
        <div 
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
          className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-accent/50 transition-colors"
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">Drag and drop your file here</p>
              <p className="text-sm text-muted-foreground">or click to browse files (CSV, XLSX, PDF)</p>
            </div>
            <Button variant="outline" className="mt-2">
              Select File
            </Button>
          </div>
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.pdf"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round(file.size / 1024)} KB • {new Date(file.lastModified).toLocaleDateString()}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
                setFile(null)
                setRows([])
                setErrors([])
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Transactions</p>
                <p className="text-2xl font-bold">{rows.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Status</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Ready to import</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setFile(null)
              setRows([])
              setErrors([])
            }}>
              Cancel
            </Button>
            <Button onClick={upload} disabled={!rows.length || loading}>
              {loading ? 'Uploading...' : 'Import Transactions'}
            </Button>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
          <h3 className="font-medium text-destructive">Errors found in file</h3>
          <ul className="mt-2 text-sm text-destructive">
            {errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
