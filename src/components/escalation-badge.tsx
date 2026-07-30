'use client'

import React from 'react'
import { motion } from 'motion/react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

interface EscalationBadgeProps {
  level: number
  escalatedAt?: string | null
  compact?: boolean
}

export function EscalationBadge({ level, escalatedAt, compact = false }: EscalationBadgeProps) {
  if (level === 0) return null

  const levelConfig = {
    1: { label: 'Escalated', bg: 'bg-[#FDEBEC]', text: 'text-[#9C3238]', border: 'border-[#fabcc1]' },
    2: { label: 'Escalated L2', bg: 'bg-[#FDEBEC]', text: 'text-[#9C3238]', border: 'border-[#D94C53]' },
    3: { label: 'Critical Escalation', bg: 'bg-[#DC2626]', text: 'text-white', border: 'border-[#DC2626]' },
  }

  const config = levelConfig[level as keyof typeof levelConfig] || levelConfig[1]

  if (compact) {
    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${config.bg} ${config.text} ${config.border}`}
      >
        <ExclamationTriangleIcon className="w-3 h-3" />
        {config.label}
      </motion.span>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${config.bg} ${config.border} flex items-center gap-3`}
    >
      <div className={`w-10 h-10 rounded-lg ${level === 3 ? 'bg-white/20' : 'bg-white'} flex items-center justify-center`}>
        <ExclamationTriangleIcon className={`w-5 h-5 ${config.text}`} />
      </div>
      <div>
        <h4 className={`font-bold text-sm ${config.text}`}>{config.label}</h4>
        <p className={`text-xs ${config.text} opacity-80`}>
          {escalatedAt
            ? `Since ${new Date(escalatedAt).toLocaleString()}`
            : 'SLA deadline breached'}
        </p>
      </div>
      {level < 3 && (
        <div className="ml-auto flex gap-1">
          {[1, 2, 3].map(l => (
            <div
              key={l}
              className={`w-2 h-2 rounded-full ${
                l <= level ? 'bg-[#D94C53]' : 'bg-[#EAEAEA]'
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
