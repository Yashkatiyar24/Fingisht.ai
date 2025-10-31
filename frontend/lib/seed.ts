import { supabase } from './supabase'

const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#ef4444', icon: '🍔' },
  { name: 'Groceries', color: '#16a34a', icon: '🛒' },
  { name: 'Transport', color: '#0ea5e9', icon: '🚗' },
  { name: 'Shopping', color: '#7c3aed', icon: '🛍️' },
  { name: 'Entertainment', color: '#f97316', icon: '🎬' },
  { name: 'Bills', color: '#f59e0b', icon: '💡' },
  { name: 'Income', color: '#10b981', icon: '💰' },
  { name: 'Other', color: '#64748b', icon: '📦' },
]

export async function ensureDefaultCategories(userId: string) {
  if (!userId) return []
  const { data: existing } = await supabase.from('categories').select('id,name').eq('user_id', userId).limit(1)
  if (existing && existing.length > 0) {
    // return all categories for mapping
    const { data: all } = await supabase.from('categories').select('id,name').eq('user_id', userId)
    return all || []
  }

  const toInsert = DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: userId }))
  const { data, error } = await supabase.from('categories').insert(toInsert).select('id,name')
  if (error) {
    console.warn('failed to create default categories', error)
    return []
  }
  return data || []
}
