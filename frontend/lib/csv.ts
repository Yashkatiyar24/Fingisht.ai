import Papa from 'papaparse'
import { TransactionRow } from './types'

const normalizeHeader = (h: string) => h.trim().toLowerCase()

export function parseCsvFile(file: File): Promise<{rows: TransactionRow[], errors: string[]}> {
  return new Promise((resolve) => {
    const rows: TransactionRow[] = []
    const errors: string[] = []
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res: { data: any[] }) => {
          res.data.forEach((r: any, i: number) => {
          try {
            const map: Record<string,string> = {}
            Object.keys(r).forEach((k) => map[normalizeHeader(k)] = (r as any)[k])

            // Heuristic header mapping
            const date = map['date'] || map['transaction date'] || map['txn_date'] || map['payment_date']
            const amountRaw = map['amount'] || map['amt'] || map['transaction amount']
            const merchant = map['merchant'] || map['vendor'] || map['payee'] || map['description']?.split(' ')[0]
            const description = map['description'] || map['narration'] || map['memo'] || ''

            if (!date || !amountRaw) {
              errors.push(`row ${i+1}: missing date or amount`)
              return
            }

            const amount = Number(String(amountRaw).replace(/[^0-9.-]+/g, ''))
            if (Number.isNaN(amount)) {
              errors.push(`row ${i+1}: invalid amount ${amountRaw}`)
              return
            }

            const normalizedDate = new Date(date).toISOString().slice(0,10)

            rows.push({
              date: normalizedDate,
              merchant: merchant ? String(merchant).trim() : (String(description).split(' ')[0] || ''),
              description: String(description).trim(),
              amount,
              currency: 'INR'
            })
          } catch (e) {
            errors.push(`row ${i+1}: parse error`)
          }
        })

        // dedupe by date+amount+merchant
        const seen = new Set<string>()
        const deduped = rows.filter((r) => {
          const key = `${r.date}|${r.amount}|${(r.merchant||'').toLowerCase()}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        resolve({rows: deduped, errors})
      }
    })
  })
}
