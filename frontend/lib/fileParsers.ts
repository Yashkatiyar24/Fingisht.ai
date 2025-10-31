import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { TransactionRow } from './types'

const MAX_FILE_SIZE_MB = 25
const MAX_ROWS = 10000

type ParseResult = {
  rows: TransactionRow[]
  errors: string[]
  fileName: string
  fileSize: number
  rowCount: number
}

const normalizeHeader = (h: string) => h.trim().toLowerCase()

const parseCsv = async (file: File): Promise<ParseResult> => {
  const result: ParseResult = {
    rows: [],
    errors: [],
    fileName: file.name,
    fileSize: file.size,
    rowCount: 0
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    result.errors.push(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`)
    return result
  }

  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res: { data: any[] }) => {
        if (res.data.length > MAX_ROWS) {
          result.errors.push(`File contains too many rows (max ${MAX_ROWS})`)
          return resolve(result)
        }

        res.data.forEach((r: any, i: number) => {
          try {
            const map: Record<string, string> = {}
            Object.keys(r).forEach((k) => (map[normalizeHeader(k)] = (r as any)[k]))

            // Heuristic header mapping
            const date = map['date'] || map['transaction date'] || map['txn_date'] || map['payment_date']
            const amountRaw = map['amount'] || map['amt'] || map['transaction amount']
            const merchant = map['merchant'] || map['vendor'] || map['payee'] || map['description']?.split(' ')[0]
            const description = map['description'] || map['narration'] || map['memo'] || ''

            if (!date || !amountRaw) {
              result.errors.push(`Row ${i + 1}: Missing date or amount`)
              return
            }

            const amount = Number(String(amountRaw).replace(/[^0-9.-]+/g, ''))
            if (Number.isNaN(amount)) {
              result.errors.push(`Row ${i + 1}: Invalid amount format (${amountRaw})`)
              return
            }

            let normalizedDate: string
            try {
              const dateObj = new Date(date)
              if (isNaN(dateObj.getTime())) throw new Error('Invalid date')
              normalizedDate = dateObj.toISOString().slice(0, 10)
            } catch (e) {
              result.errors.push(`Row ${i + 1}: Invalid date format (${date})`)
              return
            }

            result.rows.push({
              date: normalizedDate,
              merchant: merchant ? String(merchant).trim() : String(description).split(' ')[0] || '',
              description: String(description).trim(),
              amount,
              currency: 'INR'
            })
          } catch (e) {
            result.errors.push(`Row ${i + 1}: Parse error - ${e instanceof Error ? e.message : String(e)}`)
          }
        })

        // Dedupe by date+amount+merchant
        const seen = new Set<string>()
        result.rows = result.rows.filter((r) => {
          const key = `${r.date}|${r.amount}|${(r.merchant || '').toLowerCase()}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        result.rowCount = result.rows.length
        resolve(result)
      },
      error: (error: Error) => {
        result.errors.push(`CSV parsing failed: ${error.message}`)
        resolve(result)
      }
    })
  })
}

const parseExcel = async (file: File): Promise<ParseResult> => {
  const result: ParseResult = {
    rows: [],
    errors: [],
    fileName: file.name,
    fileSize: file.size,
    rowCount: 0
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    result.errors.push(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`)
    return result
  }

  try {
    const data = await file.arrayBuffer()
    // @ts-ignore - The type definitions are incorrect, the function accepts a second options parameter
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (jsonData.length <= 1) {
      result.errors.push('Excel file is empty or has no data rows')
      return result
    }

    if (jsonData.length > MAX_ROWS + 1) {
      result.errors.push(`File contains too many rows (max ${MAX_ROWS})`)
      return result
    }

    // Get headers (first row)
    const headers = (jsonData[0] as string[]).map(h => String(h).trim())
    
    // Process data rows
    for (let i = 1; i < jsonData.length; i++) {
      try {
        const row = jsonData[i] as any[]
        if (!row || row.length === 0) continue

        const rowObj: Record<string, any> = {}
        headers.forEach((header, idx) => {
          rowObj[header] = row[idx] !== undefined ? String(row[idx]) : ''
        })

        const map: Record<string, string> = {}
        Object.entries(rowObj).forEach(([key, value]) => {
          map[normalizeHeader(key)] = value
        })

        const date = map['date'] || map['transaction date'] || map['txn_date'] || map['payment_date']
        const amountRaw = map['amount'] || map['amt'] || map['transaction amount']
        const merchant = map['merchant'] || map['vendor'] || map['payee'] || map['description']?.split(' ')[0]
        const description = map['description'] || map['narration'] || map['memo'] || ''

        if (!date || !amountRaw) {
          result.errors.push(`Row ${i + 1}: Missing date or amount`)
          continue
        }

        const amount = Number(String(amountRaw).replace(/[^0-9.-]+/g, ''))
        if (Number.isNaN(amount)) {
          result.errors.push(`Row ${i + 1}: Invalid amount format (${amountRaw})`)
          continue
        }

        let normalizedDate: string
        try {
          const dateObj = new Date(date)
          if (isNaN(dateObj.getTime())) throw new Error('Invalid date')
          normalizedDate = dateObj.toISOString().slice(0, 10)
        } catch (e) {
          result.errors.push(`Row ${i + 1}: Invalid date format (${date})`)
          continue
        }

        result.rows.push({
          date: normalizedDate,
          merchant: merchant ? String(merchant).trim() : String(description).split(' ')[0] || '',
          description: String(description).trim(),
          amount,
          currency: 'INR'
        })
      } catch (e) {
        result.errors.push(`Row ${i + 1}: Parse error - ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    // Dedupe by date+amount+merchant
    const seen = new Set<string>()
    result.rows = result.rows.filter((r) => {
      const key = `${r.date}|${r.amount}|${(r.merchant || '').toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    result.rowCount = result.rows.length
  } catch (e) {
    result.errors.push(`Excel parsing failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  return result
}

export const parseBankFile = async (file: File): Promise<ParseResult> => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  
  try {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return {
        rows: [],
        errors: [`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`],
        fileName: file.name,
        fileSize: file.size,
        rowCount: 0
      }
    }

    if (ext === 'csv') {
      return await parseCsv(file)
    } else if (ext === 'xls' || ext === 'xlsx') {
      return await parseExcel(file)
    } else {
      return {
        rows: [],
        errors: ['Unsupported file format. Please upload a CSV, XLS, or XLSX file.'],
        fileName: file.name,
        fileSize: file.size,
        rowCount: 0
      }
    }
  } catch (error) {
    return {
      rows: [],
      errors: [`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      fileName: file.name,
      fileSize: file.size,
      rowCount: 0
    }
  }
}
