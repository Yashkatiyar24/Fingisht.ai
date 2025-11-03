import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import pdf from 'pdf-parse'

export interface ParseResult {
  rows: Record<string, string>[]
  errors: string[]
  rowCount: number
}

export const parseBankFile = async (file: File): Promise<ParseResult> => {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'csv') {
    return parseCsv(file)
  } else if (extension === 'xls' || extension === 'xlsx') {
    return parseXlsx(file)
  } else if (extension === 'pdf') {
    return parsePdf(file)
  } else {
    return { rows: [], errors: ['Unsupported file type'], rowCount: 0 }
  }
}

const parsePdf = async (file: File): Promise<ParseResult> => {
  const data = await file.arrayBuffer()
  const pdfData = await pdf(data)
  const textContent = pdfData.text

  const rows: Record<string, string>[] = []
  const lines = textContent.split('\n')

  // Regex to capture a date, a description, and a final number (amount)
  // This is a more robust way to handle descriptions with spaces
  const transactionRegex = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,.-]+)$/

  for (const line of lines) {
    const match = line.match(transactionRegex)
    if (match) {
      rows.push({
        date: match[1],
        description: match[2].trim(),
        amount: match[3],
      })
    }
  }

  // Fallback for simpler formats if regex fails
  if (rows.length === 0) {
    for (const line of lines) {
        const parts = line.split(/\s+/).filter(p => p) // Split by whitespace and remove empty strings
        if (parts.length >= 3) {
            rows.push({
                date: parts[0],
                description: parts.slice(1, -1).join(' '),
                amount: parts[parts.length - 1],
            });
        }
    }
  }

  return {
    rows,
    errors: rows.length === 0 ? ['Could not automatically parse the PDF structure. Please check the column mapping.'] : [],
    rowCount: rows.length,
  }
}

const parseCsv = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          rows: results.data as Record<string, string>[],
          errors: results.errors.map((e) => e.message),
          rowCount: results.data.length,
        })
      },
    })
  })
}

const parseXlsx = async (file: File): Promise<ParseResult> => {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet)
  return {
    rows,
    errors: [],
    rowCount: rows.length,
  }
}
