import Papa from 'papaparse'
import * as XLSX from 'xlsx'

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
  } else {
    return { rows: [], errors: ['Unsupported file type'], rowCount: 0 }
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
