'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { DashboardLayout } from '@/components/dashboard-layout'
import { SLATimer } from '@/components/sla-timer'
import { CommentForm } from '@/components/comment-form'
import { EscalationBadge } from '@/components/escalation-badge'
import { StudentCloseDialog } from '@/components/student-close-dialog'
import { useEscalation } from '@/hooks/use-escalation'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  FileTextIcon,
  CheckCircledIcon,
  PersonIcon,
  UpdateIcon,
  ExclamationTriangleIcon,
  ChatBubbleIcon,
  CalendarIcon,
  SewingPinIcon,
  AvatarIcon,
  MixerHorizontalIcon,
  ImageIcon
} from '@radix-ui/react-icons'

type IconType = 'submitted' | 'verified' | 'assigned' | 'progress' | 'resolved' | 'escalated' | 'comment'

// Mock Data - Always used for demo regardless of [id]
const MOCK_COMPLAINT = {
  id: 'CMP-2026-0892',
  title: 'Ceiling Fan Making Loud Grinding Noise',
  description: 'The ceiling fan in the middle of the room is making a very loud grinding noise when turned on. It sounds like the bearings are completely shot. We had to turn it off completely because it feels like it might fall, and it is too hot to study.',
  status: 'in_progress',
  priority: 'high',
  category: 'Electrical',
  building: 'Hostel Block B',
  room: 'Room 412',
  studentName: 'Rahul Verma',
  studentEmail: 'rahul.v@campus.edu',
  createdAt: '2026-07-29T09:30:00Z',
  deadline: '2026-07-30T16:30:00Z',
  images: [
    'https://placehold.co/400x300/e0e0e0/a0a0a0?text=Fan+Photo+1',
    'https://placehold.co/400x300/e0e0e0/a0a0a0?text=Fan+Photo+2'
  ],
  aiAnalysis: {
    category: 'Electrical Maintenance',
    priority: 'High',
    department: 'Facilities - Electrical',
    urgencyScore: 85,
    summary: 'Urgent mechanical failure of ceiling fan posing safety and comfort risks.',
    sentiment: 'Frustrated'
  }
}

const INITIAL_TIMELINE = [
  {
    id: '1',
    action: 'Complaint Submitted',
    user: 'Rahul Verma',
    timestamp: '29 Jul 2026, 09:30 AM',
    iconType: 'submitted' as IconType,
  },
  {
    id: '2',
    action: 'Verified by AI System',
    user: 'System',
    timestamp: '29 Jul 2026, 09:35 AM',
    iconType: 'verified' as IconType,
  },
  {
    id: '3',
    action: 'Assigned to Electrical Dept',
    user: 'Admin (System)',
    timestamp: '29 Jul 2026, 10:00 AM',
    iconType: 'assigned' as IconType,
  },
  {
    id: '4',
    action: 'Status updated to In Progress',
    user: 'Priya Sharma (Staff)',
    timestamp: '29 Jul 2026, 11:30 AM',
    comment: 'Maintenance team dispatched to inspect the fan. Will update shortly.',
    iconType: 'progress' as IconType,
  }
]

// Fallbacks in case config is incomplete
const getStatusBadge = (statusKey: string) => {
  const config = (STATUS_CONFIG as any)?.[statusKey]
  if (config) return config
  return { label: statusKey, bgColor: '#EAEAEA', color: '#111111' }
}

const getPriorityBadge = (priorityKey: string) => {
  const config = (PRIORITY_CONFIG as any)?.[priorityKey]
  if (config) return config
  return { label: priorityKey, bgColor: '#FDEBEC', color: '#9C3238' } // Default high-ish fallback
}

export default function ComplaintDetailPage() {
  const params = useParams()
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE)
  const [isEscalated, setIsEscalated] = useState(false)
  const [complaint, setComplaint] = useState(MOCK_COMPLAINT)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  
  const statusBadge = getStatusBadge(complaint.status)
  const priorityBadge = getPriorityBadge(complaint.priority)

  const handleEscalate = () => {
    setIsEscalated(true)
    setTimeline(prev => [...prev, {
      id: Date.now().toString(),
      action: 'Escalated to Department Head',
      user: 'System / Admin',
      timestamp: new Date().toLocaleString(),
      iconType: 'escalated' as IconType,
      comment: 'SLA priority timeline breached. Automatically escalated.'
    }])
    toast.error('Complaint escalated to department head')
  }

  const handleCommentSubmit = (comment: string, file: File | null) => {
    setTimeline(prev => [...prev, {
      id: Date.now().toString(),
      action: 'Added a comment',
      user: 'Current User',
      timestamp: new Date().toLocaleString(),
      comment: comment,
      iconType: 'comment' as IconType,
      attachments: file ? [file.name] : undefined
    }])
  }

  const getIconForType = (type: IconType) => {
    switch (type) {
      case 'submitted': return <FileTextIcon className="w-5 h-5 text-blue-600" />
      case 'verified': return <CheckCircledIcon className="w-5 h-5 text-green-600" />
      case 'assigned': return <PersonIcon className="w-5 h-5 text-orange-500" />
      case 'progress': return <UpdateIcon className="w-5 h-5 text-purple-600" />
      case 'resolved': return <CheckCircledIcon className="w-5 h-5 text-green-600" />
      case 'escalated': return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
      case 'comment': return <ChatBubbleIcon className="w-5 h-5 text-[#787774]" />
      default: return <ChatBubbleIcon className="w-5 h-5 text-[#787774]" />
    }
  }

  return (
    <DashboardLayout role="student" userName="Rahul Verma" userEmail="rahul@campus.edu">
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        
        {/* Escalation Banner */}
        {isEscalated && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FDEBEC] border border-[#D94C53] rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-[#9C3238]" />
              <div>
                <h3 className="font-bold text-[#9C3238]">ESCALATED</h3>
                <p className="text-sm text-[#9C3238]/80">This complaint has breached SLA and has been escalated.</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#111111]">Complaint {MOCK_COMPLAINT.id}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (60%) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-4">
                <span 
                  className="px-3 py-1 text-xs font-semibold rounded-full border border-black/5"
                  style={{ backgroundColor: statusBadge.bgColor, color: statusBadge.color }}
                >
                  {statusBadge.label}
                </span>
                <span 
                  className="px-3 py-1 text-xs font-semibold rounded-full border border-black/5"
                  style={{ backgroundColor: priorityBadge.bgColor, color: priorityBadge.color }}
                >
                  {priorityBadge.label}
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#F7F6F3] text-[#787774] border border-[#EAEAEA]">
                  {MOCK_COMPLAINT.category}
                </span>
              </div>

              {complaint.status === 'escalated' && (
                <EscalationBadge level={1} escalatedAt={new Date().toISOString()} />
              )}

              <h2 className="text-xl font-bold mb-3">{MOCK_COMPLAINT.title}</h2>
              <p className="text-[#787774] text-sm leading-relaxed mb-6">
                {MOCK_COMPLAINT.description}
              </p>

              {/* Images */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {MOCK_COMPLAINT.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-[#EAEAEA] group cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Complaint Image ${idx+1}`} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#EAEAEA] pt-6">
                <div className="flex gap-3">
                  <div className="mt-0.5"><SewingPinIcon className="w-5 h-5 text-[#787774]" /></div>
                  <div>
                    <p className="text-xs text-[#787774] uppercase tracking-wider font-semibold">Location</p>
                    <p className="text-sm font-medium">{MOCK_COMPLAINT.building}</p>
                    <p className="text-sm text-[#787774]">{MOCK_COMPLAINT.room}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5"><AvatarIcon className="w-5 h-5 text-[#787774]" /></div>
                  <div>
                    <p className="text-xs text-[#787774] uppercase tracking-wider font-semibold">Student</p>
                    <p className="text-sm font-medium">{MOCK_COMPLAINT.studentName}</p>
                    <p className="text-sm text-[#787774]">{MOCK_COMPLAINT.studentEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Status Timeline</h3>
              
              <div className="relative pl-6 border-l-2 border-[#EAEAEA] ml-3 space-y-8">
                {timeline.map((entry, index) => (
                  <motion.div 
                    key={entry.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, ease: 'easeOut' }}
                    className="relative"
                  >
                    <div className="absolute -left-[35px] bg-white border border-[#EAEAEA] p-1 rounded-full shadow-sm">
                      {getIconForType(entry.iconType)}
                    </div>
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                        <span className="font-semibold text-[#111111]">{entry.action}</span>
                        <span className="text-xs text-[#787774] flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" /> {entry.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-[#787774] mb-2">by {entry.user}</p>
                      
                      {entry.comment && (
                        <div className="bg-[#F7F6F3] p-3 rounded-lg text-sm border border-[#EAEAEA] text-[#111111]">
                          {entry.comment}
                        </div>
                      )}

                      {(entry as any).attachments && (entry as any).attachments.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          {(entry as any).attachments.map((att: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border border-[#EAEAEA] px-2 py-1 rounded">
                              <ImageIcon className="w-3 h-3 text-[#787774]" /> {att}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <CommentForm onSubmit={handleCommentSubmit} />
            </div>
          </div>

          {/* Right Column (40%) */}
          <div className="lg:col-span-5 space-y-6">
            
            <SLATimer 
              deadline={MOCK_COMPLAINT.deadline} 
              createdAt={MOCK_COMPLAINT.createdAt}
              priority={MOCK_COMPLAINT.priority} 
            />

            <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MixerHorizontalIcon className="w-5 h-5 text-[#111111]" />
                <h3 className="font-bold text-lg">AI Analysis</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#787774] uppercase tracking-wider font-semibold mb-1">Summary</p>
                  <p className="text-sm">{MOCK_COMPLAINT.aiAnalysis.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#787774] uppercase tracking-wider font-semibold mb-1">Predicted Dept</p>
                    <p className="text-sm font-medium">{MOCK_COMPLAINT.aiAnalysis.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#787774] uppercase tracking-wider font-semibold mb-1">Sentiment</p>
                    <span className="inline-block px-2 py-1 bg-[#FDEBEC] text-[#9C3238] border border-[#EAEAEA] rounded text-xs font-medium">
                      {MOCK_COMPLAINT.aiAnalysis.sentiment}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-[#787774] uppercase tracking-wider font-semibold mb-1">
                    <span>Urgency Score</span>
                    <span>{MOCK_COMPLAINT.aiAnalysis.urgencyScore}/100</span>
                  </div>
                  <div className="w-full h-2 bg-[#F7F6F3] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#111111]" 
                      style={{ width: `${MOCK_COMPLAINT.aiAnalysis.urgencyScore}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-lg mb-2">Actions</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    const statusOrder = ['submitted', 'verified', 'in_progress', 'resolved']
                    const currentIdx = statusOrder.indexOf(complaint.status)
                    const nextStatus = statusOrder[Math.min(currentIdx + 1, statusOrder.length - 1)]
                    setComplaint(prev => ({ ...prev, status: nextStatus as any }))
                    setTimeline(prev => [{
                      id: `t-${Date.now()}`,
                      action: `Status changed to ${nextStatus.replace('_', ' ')}`,
                      user: 'Admin Staff',
                      timestamp: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                      iconType: 'progress' as IconType
                    }, ...prev])
                    toast.success(`Status updated to ${nextStatus.replace('_', ' ')}`)
                  }}
                  className="w-full py-2.5 px-4 bg-[#111111] text-white rounded-lg text-sm font-medium hover:bg-black/80 transition-colors"
                >
                  Update Status
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      toast.success('Complaint reassigned to IT/Network department', {
                        description: 'Staff member Priya Sharma has been notified.'
                      })
                    }}
                    className="w-full py-2.5 px-4 bg-white border border-[#EAEAEA] text-[#111111] rounded-lg text-sm font-medium hover:bg-[#F7F6F3] transition-colors"
                  >
                    Reassign
                  </button>
                  <button 
                    onClick={handleEscalate}
                    disabled={isEscalated}
                    className="w-full py-2.5 px-4 bg-[#FDEBEC] border border-[#D94C53]/30 text-[#9C3238] rounded-lg text-sm font-medium hover:bg-[#FDEBEC]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEscalated ? 'Escalated' : 'Escalate'}
                  </button>
                </div>
                {complaint.status === 'resolved' && (
                  <button
                    onClick={() => setShowCloseDialog(true)}
                    className="w-full mt-3 py-2.5 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Verify Resolution
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        <StudentCloseDialog
          isOpen={showCloseDialog}
          onClose={() => setShowCloseDialog(false)}
          complaintTitle={complaint.title}
          onConfirmClose={(rating, feedback) => {
            console.log('Closed with rating:', rating, 'feedback:', feedback)
            setComplaint(prev => ({ ...prev, status: 'closed' as any }))
          }}
          onReopen={() => {
            setComplaint(prev => ({ ...prev, status: 'in_progress' as any }))
          }}
        />
      </div>
    </DashboardLayout>
  )
}
