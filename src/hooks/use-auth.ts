'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'student' | 'staff' | 'admin'
  department: string | null
  avatar_url: string | null
  created_at: string
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  role: 'student' | 'staff' | 'admin'
  isLoading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: 'student',
    isLoading: true,
  })

  useEffect(() => {
    const supabase = createClient()

    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setState({ user: null, profile: null, role: 'student', isLoading: false })
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        const p = profile as UserProfile | null
        setState({
          user,
          profile: p,
          role: (p?.role as 'student' | 'staff' | 'admin') || 'student',
          isLoading: false,
        })
      } catch {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    fetchProfile()
  }, [])

  return state
}
