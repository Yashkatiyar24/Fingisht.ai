import * as React from 'react'
import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '@/lib/supabase'

export function ClerkProfileSync() {
  const user = useUser()

  useEffect(() => {
    if (!user.user) return
    const u = user.user
    ;(async () => {
      try {
        await supabase.from('profiles').upsert({
          id: u.id,
          email: u.primaryEmailAddress?.emailAddress || null,
          name: u.fullName || null,
          // Clerk types differ between versions; try common properties
          avatar_url: (u as any).profileImageUrl || (u as any).imageUrl || null
        })
      } catch (e) {
        console.warn('profile upsert failed', e)
      }
    })()
  }, [user.user])

  return null
}
