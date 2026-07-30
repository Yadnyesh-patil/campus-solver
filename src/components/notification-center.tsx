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
  UpdateIcon,
  ChatBubbleIcon
} from '@radix-ui/react-icons'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

import { toast } from 'sonner'

export function NotificationCenter({ align = 'left', role = 'student' }: { align?: 'left' | 'right'; role?: 'student' | 'staff' | 'admin' }) {
  const { user } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const topNotificationIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    
    const fetchNotifications = async () => {
      let logsData: any[] = []
      
      if (role === 'student') {
        const { data: myComplaints } = await supabase.from('complaints').select('id, title').eq('student_id', user.id)
        if (myComplaints && myComplaints.length > 0) {
          const ids = myComplaints.map(c => c.id)
          const { data } = await supabase.from('complaint_logs').select('*, complaints(title)').in('complaint_id', ids).order('created_at', { ascending: false }).limit(20)
          logsData = data || []
        }
      } else if (role === 'staff') {
        const { data: myComplaints } = await supabase.from('complaints').select('id, title').eq('assigned_staff_id', user.id)
        if (myComplaints && myComplaints.length > 0) {
          const ids = myComplaints.map(c => c.id)
          const { data } = await supabase.from('complaint_logs').select('*, complaints(title)').in('complaint_id', ids).order('created_at', { ascending: false }).limit(20)
          logsData = data || []
        }
      } else {
        // admin
        const { data } = await supabase.from('complaint_logs').select('*, complaints(title)').order('created_at', { ascending: false }).limit(20)
        logsData = data || []
      }

      if (logsData && logsData.length > 0) {
        const formatted = logsData.map((log: any) => {
          let type = "update"
          if (log.action === 'escalation') type = "alert"
          if (log.action === 'assignment') type = "assignment"
          if (log.new_value === 'resolved' || log.new_value === 'closed') type = "success"
          if (log.action === 'comment') type = "comment"

          return {
            id: log.id,
            title: log.action.replace('_', ' ').toUpperCase(),
            message: log.new_value || log.comment || `Activity on complaint`,
            created_at: log.created_at,
            is_read: true, // For demo purposes, we will treat them as read unless we build a full read-tracking system
            type,
            complaint_id: log.complaint_id,
            complaintTitle: log.complaints?.title || `C-${log.complaint_id.slice(0, 4).toUpperCase()}`
          }
        })

        const newTopId = formatted[0].id
        if (topNotificationIdRef.current && topNotificationIdRef.current !== newTopId) {
          toast.info("New Notification", { description: `${formatted[0].title}: ${formatted[0].complaintTitle}` })
          if (!isOpen) setUnreadCount(prev => prev + 1)
        }
        topNotificationIdRef.current = newTopId

        setNotifications(formatted)
      }
    }
    
    fetchNotifications()
    
    const channel = supabase.channel(`notif-center-${role}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaint_logs' }, fetchNotifications)
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [user, role])

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
    }
    
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
    // Demo implementation
  }

  const markAllAsRead = async () => {
    // Demo implementation
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <ExclamationTriangleIcon className="text-red-500 w-4 h-4" />
      case 'update': return <UpdateIcon className="text-blue-500 w-4 h-4" />
      case 'assignment': return <PersonIcon className="text-purple-500 w-4 h-4" />
      case 'success': return <CheckCircledIcon className="text-green-500 w-4 h-4" />
      case 'comment': return <ChatBubbleIcon className="text-blue-400 w-4 h-4" />
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
                      className={`p-4 border-b border-[#EAEAEA] last:border-b-0 cursor-pointer transition-colors hover:bg-[#F7F6F3] flex items-start space-x-3 bg-white`}
                    >
                      <div className="mt-0.5 bg-white p-1.5 rounded-full border border-[#EAEAEA] shadow-sm flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-sm truncate pr-2 font-medium text-[#787774]`}>
                            {notification.title}
                          </p>
                        </div>
                        <p className="text-xs text-[#787774] leading-relaxed line-clamp-2">
                          {notification.message} - {notification.complaintTitle}
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
