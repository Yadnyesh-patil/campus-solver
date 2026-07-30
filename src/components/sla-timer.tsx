'use client'

import React from 'react'
import { useSLATimer } from '@/hooks/use-sla-timer'
import { motion } from 'motion/react'
import { ClockIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'

interface SLATimerProps {
  deadline: string | null
  priority?: string
  createdAt?: string
}

export function SLATimer({ deadline, priority, createdAt }: SLATimerProps) {
  const { timeRemaining, isOverdue, urgencyLevel, percentageUsed } = useSLATimer(deadline, createdAt)

  if (!deadline) return null

  let bgColor = 'bg-[#EDF3EC]'
  let textColor = 'text-[#2B593F]'
  let barColor = 'bg-[#4C9A6A]'

  if (urgencyLevel === 'warning') {
    bgColor = 'bg-[#FBF3DB]'
    textColor = 'text-[#8C6D1F]'
    barColor = 'bg-[#D4A32B]'
  } else if (urgencyLevel === 'critical') {
    bgColor = 'bg-[#FDEBEC]'
    textColor = 'text-[#9C3238]'
    barColor = 'bg-[#D94C53]'
  } else if (urgencyLevel === 'overdue') {
    bgColor = 'bg-[#FDEBEC]'
    textColor = 'text-[#9C3238]'
    barColor = 'bg-[#D94C53]'
  }

  return (
    <div className={`p-4 rounded-xl border border-[#EAEAEA] ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isOverdue ? (
            <ExclamationTriangleIcon className={`w-5 h-5 ${textColor}`} />
          ) : (
            <ClockIcon className={`w-5 h-5 ${textColor}`} />
          )}
          <span className={`font-semibold ${textColor}`}>
            {isOverdue ? 'SLA Overdue' : 'Time Remaining'}
          </span>
        </div>
        {priority && (
          <span className={`text-xs px-2 py-1 rounded bg-white border border-[#EAEAEA] capitalize ${textColor}`}>
            {priority} Priority
          </span>
        )}
      </div>

      <div className={`text-2xl font-bold mb-3 ${textColor}`}>
        {timeRemaining}
      </div>

      <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentageUsed}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full ${barColor}`}
        />
      </div>
      <div className={`text-xs mt-2 text-right opacity-80 font-medium ${textColor}`}>
        {Math.round(percentageUsed)}% of SLA time used
      </div>
    </div>
  )
}
