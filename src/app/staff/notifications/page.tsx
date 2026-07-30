'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { motion } from 'motion/react'
import { BellIcon, UpdateIcon, ExclamationTriangleIcon, CheckCircledIcon, ChatBubbleIcon } from '@radix-ui/react-icons'

type NotificationType = 'update' | 'alert' | 'success' | 'comment' | 'assignment'

interface Notification {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: NotificationType
  complaintId?: string
}

const initialNotifications: Notification[] = [
  { id: '1', title: 'New Assignment', message: 'Complaint COMP-091: Leaking pipe in bathroom has been assigned to you.', timestamp: '10 mins ago', read: false, type: 'assignment', complaintId: '1' },
  { id: '2', title: 'SLA Warning', message: 'COMP-091 is approaching its SLA deadline. 2h 15m remaining.', timestamp: '30 mins ago', read: false, type: 'alert', complaintId: '1' },
  { id: '3', title: 'Status Update', message: 'COMP-092: Fan regulator status changed to In Progress.', timestamp: '1 hour ago', read: false, type: 'update', complaintId: '2' },
  { id: '4', title: 'Student Comment', message: 'Rahul Verma added a comment on COMP-091.', timestamp: '2 hours ago', read: true, type: 'comment', complaintId: '1' },
  { id: '5', title: 'Resolved', message: 'COMP-088: Wi-Fi router issue has been resolved.', timestamp: '1 day ago', read: true, type: 'success', complaintId: '3' },
  { id: '6', title: 'Escalation', message: 'COMP-093 has been escalated to maintenance head.', timestamp: '2 days ago', read: true, type: 'alert', complaintId: '4' },
]

export default function StaffNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.filter(n => !n.read).length
  const filteredNotifications = notifications.filter(n => filter === 'all' || !n.read)

  const handleMarkAsRead = (id: string, complaintId?: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    if (complaintId) {
      router.push(`/dashboard/complaint/${complaintId}?role=staff`)
    }
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'update': return <UpdateIcon className="w-5 h-5 text-[#D97706]" />
      case 'alert': return <ExclamationTriangleIcon className="w-5 h-5 text-[#E53935]" />
      case 'success': return <CheckCircledIcon className="w-5 h-5 text-[#16A34A]" />
      case 'comment': return <ChatBubbleIcon className="w-5 h-5 text-[#3B82F6]" />
      case 'assignment': return <BellIcon className="w-5 h-5 text-[#111111]" />
      default: return <BellIcon className="w-5 h-5 text-[#111111]" />
    }
  }

  return (
    <DashboardLayout role="staff" userName="Priya Sharma" userEmail="priya@campus.edu">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-[#E1F3FE] text-[#3B82F6] px-2.5 py-0.5 rounded-full text-xs font-medium">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button onClick={handleMarkAllAsRead} className="text-sm font-medium text-[#787774] hover:text-[#111111] transition-colors">Mark all as read</button>
        </div>

        <div className="flex gap-2 border-b border-[#EAEAEA] pb-2">
          <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-[#111111] text-[#F7F6F3]' : 'text-[#787774] hover:bg-[#EAEAEA]'}`}>All</button>
          <button onClick={() => setFilter('unread')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-[#111111] text-[#F7F6F3]' : 'text-[#787774] hover:bg-[#EAEAEA]'}`}>Unread</button>
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-[#787774]">No notifications to show.</div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleMarkAsRead(notification.id, notification.complaintId)}
                className={`bg-white border rounded-xl p-4 flex gap-4 cursor-pointer transition-all hover:shadow-sm ${!notification.read ? 'border-l-4 border-l-[#3B82F6] border-y-[#EAEAEA] border-r-[#EAEAEA]' : 'border-[#EAEAEA]'}`}
              >
                <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm font-medium ${!notification.read ? 'text-[#111111]' : 'text-[#787774]'}`}>{notification.title}</p>
                    <span className="text-xs text-[#787774] whitespace-nowrap ml-4">{notification.timestamp}</span>
                  </div>
                  <p className={`text-sm ${!notification.read ? 'text-[#111111]' : 'text-[#787774]'}`}>{notification.message}</p>
                </div>
                {!notification.read && <div className="flex-shrink-0 flex items-center"><div className="w-2 h-2 rounded-full bg-[#3B82F6]" /></div>}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
