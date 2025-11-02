import React, { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { sha256 } from 'js-sha256'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Loader2 } from 'lucide-react'

const REQUIRED_COLUMNS = ['date', 'merchant', 'amount', 'description', 'type']

export function MapColumns() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { getToken } = useAuth()
  const { file, rows, fileName } = location.state || { rows: [] }

  const headers = useMemo(() => (rows.length > 0 ? Object.keys(rows[0]) : []), [rows])
  const [mappedHeaders, setMappedHeaders] = useState<Record<string, string>>(() => {
    const initialMapping: Record<string, string> = {}
    REQUIRED_COLUMNS.forEach(col => {
      const foundHeader = headers.find(h => h.toLowerCase().includes(col))
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
        throw new Error('Import failed');
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
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: 'An error occurred while importing your transactions.',
      })
    },
  })

  const handleMappingChange = (column: string, value: string) => {
    setMappedHeaders(prev => ({ ...prev, [column]: value }))
  }

  const handleImport = async () => {
    const checksum = sha256(await file.text())
    mutation.mutate({
      rows,
      mappedHeaders,
      fileMeta: { name: fileName, size: file.size, checksum },
    })
  }

  const isMappingComplete = REQUIRED_COLUMNS.every(col => mappedHeaders[col])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/upload')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Map Columns</CardTitle>
        </CardHeader>
        <CardContent>
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

          <h3 className="mt-8 mb-4 text-lg font-semibold">Preview</h3>
          <Table>
            <TableHeader>
              <TableRow>
                {REQUIRED_COLUMNS.map(col => <TableHead key={col} className="capitalize">{col}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 5).map((row, i) => (
                <TableRow key={i}>
                  {REQUIRED_COLUMNS.map(col => (
                    <TableCell key={col}>{row[mappedHeaders[col]]}</TableCell>
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
