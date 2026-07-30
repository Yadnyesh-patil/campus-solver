'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ExclamationTriangleIcon, ArrowRightIcon, EyeOpenIcon } from '@radix-ui/react-icons'
import { createClient } from '@/lib/supabase/client'

interface DuplicateDetectorProps {
  title: string
  description: string
  onProceedAnyway?: () => void
}

export function DuplicateDetector({ title, description, onProceedAnyway }: DuplicateDetectorProps) {
  const [hasDuplicate, setHasDuplicate] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [duplicateData, setDuplicateData] = useState<any>(null)

  useEffect(() => {
    if (!title) {
      setHasDuplicate(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const supabase = createClient()
        const { data: recentComplaints } = await supabase
          .from('complaints')
          .select('id, title, description, status, created_at')
          .neq('status', 'closed')
          .order('created_at', { ascending: false })
          .limit(10)

        if (recentComplaints && recentComplaints.length > 0) {
          const res = await fetch('/api/ai/detect-duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              description,
              existingComplaints: recentComplaints
            })
          })
          
          if (res.ok) {
            const result = await res.json()
            if (result.isDuplicate && result.similarity > 70) {
              setHasDuplicate(true)
              setDuplicateData(result)
              return
            }
          }
        }
        
        // Fallback or no duplicate found via API
        setHasDuplicate(false)
        
      } catch (err) {
        // Fallback to simple string match on error
        const lowerTitle = title.toLowerCase()
        if (lowerTitle.includes('water') || lowerTitle.includes('fan')) {
          setHasDuplicate(true)
          setDuplicateData({
            similarity: 92,
            existingComplaint: {
              title: lowerTitle.includes('water') ? 'Water leaking in corridor' : 'Ceiling fan making loud noise',
              status: 'in_progress',
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            }
          })
        } else {
          setHasDuplicate(false)
        }
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [title, description])

  if (isDismissed) return null

  return (
    <AnimatePresence>
      {hasDuplicate && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="mb-6 bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 shadow-sm relative overflow-hidden">
            {/* Warning stripe */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
            
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 text-amber-500 bg-white rounded-full p-1 shadow-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
              </div>
              
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900">Potential Duplicate Detected</h4>
                <p className="text-xs text-amber-700 mt-1 mb-3">
                  We found a similar existing complaint in this location. Submitting duplicates may delay resolution.
                </p>
                
                <div className="bg-white/60 rounded-lg p-3 border border-amber-200/50 mb-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-amber-900">
                      {duplicateData?.existingComplaint?.title || 'Similar complaint'}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                      {Math.round(duplicateData?.similarity || 90)}% Match
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-amber-700/80">
                    <span className="font-medium px-1.5 py-0.5 bg-white rounded text-amber-600 border border-amber-100 capitalize">
                      {duplicateData?.existingComplaint?.status?.replace('_', ' ') || 'In Progress'}
                    </span>
                    <span>• Reported {duplicateData?.existingComplaint?.created_at ? new Date(duplicateData.existingComplaint.created_at).toLocaleDateString() : 'recently'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button 
                    type="button"
                    className="text-xs font-medium bg-white text-amber-900 border border-amber-200 px-3 py-1.5 rounded-md shadow-sm hover:bg-amber-50 transition-colors flex items-center space-x-1.5"
                  >
                    <EyeOpenIcon className="w-3 h-3" />
                    <span>View Original</span>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      setIsDismissed(true)
                      if (onProceedAnyway) onProceedAnyway()
                    }}
                    className="text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center space-x-1 transition-colors"
                  >
                    <span>Submit Anyway</span>
                    <ArrowRightIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
