import { useState } from 'react'

export interface AIPrediction {
  category: string
  priority: string
  department: string
  urgency_score: number
  summary: string
  sentiment: string
  suggested_action: string
}

export interface DuplicateResult {
  isDuplicate: boolean
  duplicateId?: string
  similarity?: number
  reason?: string
}

export interface ExistingComplaint {
  id: string
  title: string
  description: string
  status?: string
}

export function useAICategorize() {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categorize = async (title: string, description: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })

      const data = await res.json()

      if (data.success) {
        setPrediction(data.prediction)
        return data.prediction as AIPrediction
      } else {
        setError(data.error || 'AI categorization failed')
        return null
      }
    } catch (err) {
      setError('Failed to connect to AI service')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { prediction, isLoading, error, categorize }
}

export function useAIDuplicateDetection() {
  const [result, setResult] = useState<DuplicateResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectDuplicate = async (title: string, description: string, existingComplaints: ExistingComplaint[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/detect-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, existingComplaints }),
      })

      const data = await res.json()

      if (data.success) {
        setResult(data.result)
        return data.result as DuplicateResult
      } else {
        setError(data.error || 'AI duplicate detection failed')
        return null
      }
    } catch (err) {
      setError('Failed to connect to AI service')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { result, isLoading, error, detectDuplicate }
}
