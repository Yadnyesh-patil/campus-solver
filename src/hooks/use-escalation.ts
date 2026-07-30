import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface EscalationResult {
  isEscalated: boolean
  escalatedAt: string | null
  escalationLevel: number
  canEscalate: boolean
  escalate: () => void
  checkAutoEscalation: (deadline: string | null, currentStatus: string) => boolean
}

export function useEscalation(complaintId: string, initialEscalated = false): EscalationResult {
  const [isEscalated, setIsEscalated] = useState(initialEscalated)
  const [escalatedAt, setEscalatedAt] = useState<string | null>(null)
  const [escalationLevel, setEscalationLevel] = useState(initialEscalated ? 1 : 0)

  const canEscalate = !isEscalated || escalationLevel < 3

  const escalate = useCallback(() => {
    const now = new Date().toISOString()
    setIsEscalated(true)
    setEscalatedAt(now)
    setEscalationLevel(prev => Math.min(prev + 1, 3))
    toast.error(`Complaint ${complaintId} escalated to Level ${escalationLevel + 1}`, {
      description: 'Department head has been notified.',
    })
  }, [complaintId, escalationLevel])

  const checkAutoEscalation = useCallback((deadline: string | null, currentStatus: string): boolean => {
    if (!deadline || isEscalated) return false
    if (['resolved', 'closed', 'rejected'].includes(currentStatus)) return false
    
    const now = new Date().getTime()
    const end = new Date(deadline).getTime()
    return now > end
  }, [isEscalated])

  return {
    isEscalated,
    escalatedAt,
    escalationLevel,
    canEscalate,
    escalate,
    checkAutoEscalation,
  }
}
