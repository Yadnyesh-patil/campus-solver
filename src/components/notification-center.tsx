'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { 
  BellIcon, 
  CheckIcon, 
  ClockIcon, 
  ExclamationTriangleIcon, 
  CheckCircledIcon, 
  PersonIcon,
  UpdateIcon
} from '@radix-ui/react-icons'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export function NotificationCenter({ align = 'left', role = 'student' }: { align?: 'left' | 'right'; role?: 'student' | 'staff' | 'admin' }) {
  const { user } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setNotifications(data || []))
  }, [user])

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    if (!user) return
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'sla_warning': return <ClockIcon className="text-amber-500 w-4 h-4" />
      case 'escalation': return <ExclamationTriangleIcon className="text-red-500 w-4 h-4" />
      case 'status_update': return <UpdateIcon className="text-blue-500 w-4 h-4" />
      case 'assignment': return <PersonIcon className="text-purple-500 w-4 h-4" />
      case 'closed': return <CheckCircledIcon className="text-green-500 w-4 h-4" />
      default: return <BellIcon className="text-gray-500 w-4 h-4" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] rounded-full transition-colors"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-80 bg-white rounded-xl border border-[#EAEAEA] shadow-lg overflow-hidden z-50 ${align === 'right' ? 'origin-top-right' : 'origin-top-left'}`}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#EAEAEA] bg-[#F7F6F3]/50">
              <h3 className="font-semibold text-sm text-[#111111]">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-[#787774] hover:text-[#111111] flex items-center space-x-1 transition-colors"
                >
                  <CheckIcon className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="flex flex-col">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => {
                        markAsRead(notification.id)
                        if (notification.complaint_id) {
                          const roleParam = role !== 'student' ? `?role=${role}` : ''
                          router.push(`/dashboard/complaint/${notification.complaint_id}${roleParam}`)
                          setIsOpen(false)
                        }
                      }}
                      className={`p-4 border-b border-[#EAEAEA] last:border-b-0 cursor-pointer transition-colors hover:bg-[#F7F6F3] flex items-start space-x-3 ${!notification.is_read ? 'bg-[#F7F6F3]/50' : 'bg-white'}`}
                    >
                      <div className="mt-0.5 bg-white p-1.5 rounded-full border border-[#EAEAEA] shadow-sm flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-sm truncate pr-2 ${!notification.is_read ? 'font-semibold text-[#111111]' : 'font-medium text-[#787774]'}`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[#787774] leading-relaxed line-clamp-2">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-[#787774]/70 mt-2 block font-medium">
                          {notification.created_at ? new Date(notification.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center">
                  <BellIcon className="w-8 h-8 text-[#EAEAEA] mb-2" />
                  <p className="text-sm text-[#787774]">No notifications right now.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
