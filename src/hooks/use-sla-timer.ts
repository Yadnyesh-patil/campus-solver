import { useState, useEffect } from 'react'

export interface SLATimerResult {
  timeRemaining: string
  isOverdue: boolean
  urgencyLevel: 'normal' | 'warning' | 'critical' | 'overdue'
  percentageUsed: number
}

export function useSLATimer(deadline: string | null, createdAt?: string): SLATimerResult {
  const [result, setResult] = useState<SLATimerResult>({
    timeRemaining: 'Calculating...',
    isOverdue: false,
    urgencyLevel: 'normal',
    percentageUsed: 0,
  })

  useEffect(() => {
    if (!deadline) {
      setResult({
        timeRemaining: 'No deadline',
        isOverdue: false,
        urgencyLevel: 'normal',
        percentageUsed: 0,
      })
      return
    }

    const calculate = () => {
      const now = new Date().getTime()
      const end = new Date(deadline).getTime()
      
      const start = createdAt ? new Date(createdAt).getTime() : end - (24 * 60 * 60 * 1000)
      
      const totalMs = end - start
      const elapsedMs = now - start
      const remainingMs = end - now

      const isOverdue = remainingMs < 0
      const absRemaining = Math.abs(remainingMs)

      const hours = Math.floor(absRemaining / (1000 * 60 * 60))
      const minutes = Math.floor((absRemaining % (1000 * 60 * 60)) / (1000 * 60))

      let timeRemaining = `${hours}h ${minutes}m`
      if (isOverdue) {
        timeRemaining = `Overdue by ${timeRemaining}`
      }

      let percentageUsed = (elapsedMs / totalMs) * 100
      if (percentageUsed < 0) percentageUsed = 0
      if (percentageUsed > 100) percentageUsed = 100

      let urgencyLevel: 'normal' | 'warning' | 'critical' | 'overdue' = 'normal'
      if (isOverdue) urgencyLevel = 'overdue'
      else if (percentageUsed >= 75) urgencyLevel = 'critical'
      else if (percentageUsed >= 50) urgencyLevel = 'warning'

      setResult({
        timeRemaining,
        isOverdue,
        urgencyLevel,
        percentageUsed,
      })
    }

    calculate()
    const interval = setInterval(calculate, 60000)

    return () => clearInterval(interval)
  }, [deadline, createdAt])

  return result
}
