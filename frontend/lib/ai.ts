import { TransactionRow } from './types'

// Simple rule matcher
export function matchRules(rules: {match_type: string, pattern: string, category_id: string}[], row: TransactionRow) {
  const text = `${row.merchant || ''} ${row.description || ''}`.toLowerCase()
  for (const r of rules) {
    try {
      const mt = (r.match_type || 'contains').toLowerCase()
      const pat = String(r.pattern || '')
      if (mt === 'equals') {
        if (text === pat.toLowerCase()) return { category_id: r.category_id, confidence: 0.98 }
      } else if (mt === 'contains') {
        if (text.includes(pat.toLowerCase())) return { category_id: r.category_id, confidence: 0.95 }
      } else if (mt === 'regex') {
        const rx = new RegExp(pat, 'i')
        if (rx.test(text)) return { category_id: r.category_id, confidence: 0.96 }
      }
    } catch (e) {
      // ignore malformed rule
      continue
    }
  }
  return null
}

// Heuristic map
const HEURISTICS: [RegExp, string][] = [
  [/uber|ola|taxonomy/i, 'Transport'],
  [/zomato|swiggy|uber eats|ubereats|dominos/i, 'Food'],
  [/amazon|flipkart/i, 'Shopping'],
  [/netflix|spotify/i, 'Subscriptions'],
  [/electric|pge|tata power|power/i, 'Utilities'],
  [/starbucks|cafe|caf\u00e9/i, 'Food']
]

export function heuristics(row: TransactionRow) {
  const text = `${row.merchant || ''} ${row.description || ''}`.toLowerCase()
  for (const [rx, cat] of HEURISTICS) {
    if (rx.test(text)) return {category: cat, confidence: 0.7}
  }
  return null
}

// Very small TF-IDF placeholder: compute simple token overlap similarity
export function tfidfSuggest(labeled: {text: string, category: string}[], row: TransactionRow) {
  const targetTokens = `${row.merchant || ''} ${row.description || ''}`.toLowerCase().split(/\W+/).filter(Boolean)
  if (targetTokens.length === 0) return null

  const scores: Record<string, number> = {}
  for (const item of labeled) {
    const tokens = item.text.toLowerCase().split(/\W+/).filter(Boolean)
    const common = tokens.filter(t => targetTokens.includes(t)).length
    scores[item.category] = (scores[item.category] || 0) + common
  }

  const entries = Object.entries(scores)
  if (entries.length === 0) return null
  const [best, val] = entries.sort((a,b) => b[1]-a[1])[0]
  const confidence = Math.min(1, val / Math.max(1, targetTokens.length))
  return {category: best, confidence}
}

// Call the external ML endpoint (FastAPI) to get predictions for multiple texts.
// Returns an array of predicted category names (same order as input) or null on failure.
export async function callMLPredict(texts: string[]): Promise<string[] | null> {
  const base = (import.meta.env.VITE_ML_URL as string) || 'http://localhost:8001'
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    })
    if (!res.ok) return null
    const data = await res.json()
    // expected shape: { predictions: string[] }
    if (!data || !Array.isArray(data.predictions)) return null
    return data.predictions
  } catch (e) {
    // network error or unavailable
    return null
  }
}

export function suggestCategory(rules: {match_type:string, pattern:string, category_id:string}[], labeled: {text:string, category:string}[], row: TransactionRow) {
  const r = matchRules(rules as any, row)
  if (r) return {category_id: r.category_id, confidence: r.confidence}

  const h = heuristics(row)
  if (h) return {category_name: h.category, confidence: h.confidence}

  const t = tfidfSuggest(labeled, row)
  if (t) return {category_name: t.category, confidence: t.confidence}

  return null
}
