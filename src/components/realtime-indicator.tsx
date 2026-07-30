'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'

interface RealtimeIndicatorProps {
  isConnected?: boolean
  showLabel?: boolean
}

export function RealtimeIndicator({ isConnected = true, showLabel = true }: RealtimeIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.div
          animate={isConnected ? {
            scale: [1, 1.5, 1],
            opacity: [0.7, 0, 0.7],
          } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute inset-0 rounded-full ${
            isConnected ? 'bg-emerald-400' : 'bg-[#EAEAEA]'
          }`}
        />
        <div className={`relative w-2.5 h-2.5 rounded-full ${
          isConnected ? 'bg-emerald-500' : 'bg-[#787774]'
        }`} />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-[#787774]">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      )}
    </div>
  )
}
