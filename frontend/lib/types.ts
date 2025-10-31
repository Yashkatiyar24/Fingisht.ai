export type Profile = {
  id: string
  email?: string
  name?: string
  avatar_url?: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  color?: string
}

export type CategoryRule = {
  id: string
  user_id: string
  category_id: string
  keyword: string
}

export type TransactionRow = {
  id?: string
  user_id?: string
  date: string
  merchant?: string
  description?: string
  amount: number
  currency?: string
  category_id?: string | null
  ai_suggested_category?: string | null
  ai_confidence?: number | null
  raw_source?: string | null
}

export type Budget = {
  id: string
  user_id: string
  period: 'monthly' | 'yearly'
  category_id?: string | null
  amount: number
}
