import React, { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { sha256 } from 'js-sha256'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Loader2 } from 'lucide-react'

// Define which columns are absolutely required for an import
const REQUIRED_COLUMNS = ['date', 'merchant', 'amount', 'description'];
// Define columns that are useful but not strictly necessary
const OPTIONAL_COLUMNS = ['category'];
// Combine them for rendering the preview table
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

export function MapColumns() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { getToken } = useAuth()
  const { file, rows, fileName } = location.state || { rows: [] }

  const headers = useMemo(() => (rows.length > 0 ? Object.keys(rows[0]) : []), [rows])

  // Auto-detect mapping from headers on initial load
  const [mappedHeaders, setMappedHeaders] = useState<Record<string, string>>(() => {
    const initialMapping: Record<string, string> = {}
    const allCols = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
    allCols.forEach(col => {
      // Find a header that includes the column name (e.g., "Transaction Date" for "date")
      const foundHeader = headers.find(h => h.toLowerCase().replace(/[^a-z]/g, '').includes(col))
      if (foundHeader) {
        initialMapping[col] = foundHeader
      }
    })
    return initialMapping
  })

  const mutation = useMutation({
    mutationFn: async (importData: any) => {
      const token = await getToken({ template: 'supabase' });
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(importData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Import Successful',
        description: `Inserted ${data.insertedCount} and skipped ${data.skippedCount} transactions.`,
      })
      navigate(`/transactions?batchId=${data.batchId}`)
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error.message || 'An error occurred while importing your transactions.',
      })
    },
  })

  const handleMappingChange = (column: string, value: string) => {
    setMappedHeaders(prev => ({ ...prev, [column]: value }))
  }

  const handleImport = async () => {
    // Recalculate checksum on the raw file content before sending
    const fileContent = await file.text();
    const checksum = sha256(fileContent);
    mutation.mutate({
      rows,
      mappedHeaders,
      fileMeta: { name: fileName, size: file.size, checksum },
    })
  }

  // The import button should be enabled if all *required* columns have a mapping
  const isMappingComplete = REQUIRED_COLUMNS.every(col => mappedHeaders[col])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/upload')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Map Columns</CardTitle>
          <CardDescription>Match the columns from your file to the required transaction fields.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-semibold text-muted-foreground mb-3">Required Fields</h3>
              <div className="space-y-4">
                {REQUIRED_COLUMNS.map(col => (
                  <div key={col} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{col}</span>
                    <Select onValueChange={(value) => handleMappingChange(col, value)} value={mappedHeaders[col]}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select a column" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-md font-semibold text-muted-foreground mb-3">Optional Fields</h3>
              <div className="space-y-4">
                {OPTIONAL_COLUMNS.map(col => (
                  <div key={col} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{col}</span>
                    <Select onValueChange={(value) => handleMappingChange(col, value)} value={mappedHeaders[col]}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select a column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {headers.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h3 className="mt-8 mb-4 text-lg font-semibold">Preview</h3>
          <Table>
            <TableHeader>
              <TableRow>
                {ALL_COLUMNS.map(col => <TableHead key={col} className="capitalize">{col}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 5).map((row: any, i: number) => (
                <TableRow key={i}>
                  {ALL_COLUMNS.map(col => (
                    <TableCell key={col}>{row[mappedHeaders[col]] || <span className="text-muted-foreground">-</span>}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Button onClick={handleImport} disabled={!isMappingComplete || mutation.isLoading} className="mt-8 w-full">
            {mutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Transactions
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
