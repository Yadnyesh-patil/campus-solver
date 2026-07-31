'use client'

import React from 'react'
import { motion } from 'motion/react'

export function RealtimeIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-emerald-400"
        />
        <div className="relative w-2.5 h-2.5 rounded-full bg-emerald-500" />
      </div>
      <span className="text-xs font-medium text-[#787774]">
        Live
      </span>
    </div>
  )
}
