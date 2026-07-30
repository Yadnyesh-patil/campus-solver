'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
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
  const searchParams = useSearchParams()
  const { user, profile, role: authRole, isLoading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [timeline, setTimeline] = useState<any[]>([])
  const [isEscalated, setIsEscalated] = useState(false)
  const [complaint, setComplaint] = useState<any>(null)
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!params?.id) return
      
      const supabase = createClient()
      setLoading(true)
      
      const { data: compData, error: compErr } = await supabase
        .from('complaints')
        .select('*, student:profiles!student_id(full_name, email)')
        .eq('id', params.id)
        .single()
        
      if (compErr || !compData) {
        setError('Complaint not found')
        setLoading(false)
        return
      }

      setComplaint(compData)
      setIsEscalated(compData.is_escalated || false)

      const { data: logsData } = await supabase
        .from('complaint_logs')
        .select('*, user:profiles!user_id(full_name, role)')
        .eq('complaint_id', params.id)
        .order('created_at', { ascending: true })

      if (logsData) {
        const mappedTimeline = logsData.map(log => {
          let iconType: IconType = 'comment'
          if (log.action === 'status_change') iconType = 'progress'
          else if (log.action === 'comment') iconType = 'comment'
          else if (log.action === 'assignment') iconType = 'assigned'
          else if (log.action === 'escalation') iconType = 'escalated'
          else if (log.action === 'closed_by_student') iconType = 'resolved'

          return {
            id: log.id,
            action: log.action === 'status_change' ? `Status changed to ${log.new_value}` : 
                    log.action === 'comment' ? 'Added a comment' :
                    log.action === 'assignment' ? 'Assigned' :
                    log.action === 'escalation' ? 'Escalated' :
                    log.action === 'closed_by_student' ? 'Closed by student' : log.action,
            user: log.user?.full_name || 'Unknown User',
            timestamp: new Date(log.created_at).toLocaleString(),
            iconType,
            comment: log.comment || '',
            attachments: log.attachment_urls || undefined
          }
        })
        setTimeline(mappedTimeline)
      }

      setLoading(false)
    }

    fetchData()
  }, [params?.id])
  
  const statusBadge = getStatusBadge(complaint?.status || 'submitted')
  const priorityBadge = getPriorityBadge(complaint?.priority || 'medium')

  const handleEscalate = async () => {
    if (!complaint || !user) return
    setIsEscalated(true)
    
    const supabase = createClient()
    const escalatedAt = new Date().toISOString()
    
    await supabase.from('complaints').update({ 
      is_escalated: true, 
      escalated_at: escalatedAt,
      updated_at: escalatedAt
    }).eq('id', complaint.id)

    await supabase.from('complaint_logs').insert({ 
      complaint_id: complaint.id, 
      user_id: user.id, 
      action: 'escalation',
      comment: 'SLA priority timeline breached. Automatically escalated.'
    })
    
    setTimeline(prev => [...prev, {
      id: Date.now().toString(),
      action: 'Escalated',
      user: profile?.full_name || 'System / Admin',
      timestamp: new Date().toLocaleString(),
      iconType: 'escalated' as IconType,
      comment: 'SLA priority timeline breached. Automatically escalated.'
    }])
    toast.error('Complaint escalated to department head')
  }

  const handleCommentSubmit = async (comment: string, file: File | null) => {
    if (!complaint || !user) return
    const supabase = createClient()
    
    let attachmentUrls: string[] = []
    if (file) attachmentUrls.push(file.name)
    
    const { data: insertedLog } = await supabase.from('complaint_logs').insert({
      complaint_id: complaint.id,
      user_id: user.id,
      action: 'comment',
      comment: comment,
      attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null
    }).select().single()
    
    setTimeline(prev => [...prev, {
      id: insertedLog?.id || Date.now().toString(),
      action: 'Added a comment',
      user: profile?.full_name || 'Current User',
      timestamp: new Date().toLocaleString(),
      comment: comment,
      iconType: 'comment' as IconType,
      attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined
    }])
  }

  const handleUpdateStatus = async () => {
    if (!complaint || !user) return
    
    const statusOrder = ['submitted', 'verified', 'in_progress', 'resolved']
    const currentIdx = statusOrder.indexOf(complaint.status)
    const nextStatus = statusOrder[Math.min(currentIdx + 1, statusOrder.length - 1)]
    
    const supabase = createClient()
    const now = new Date().toISOString()
    
    await supabase.from('complaints').update({ 
      status: nextStatus, 
      updated_at: now 
    }).eq('id', complaint.id)
    
    await supabase.from('complaint_logs').insert({ 
      complaint_id: complaint.id, 
      user_id: user.id, 
      action: 'status_change', 
      old_value: complaint.status, 
      new_value: nextStatus 
    })

    setComplaint((prev: any) => ({ ...prev, status: nextStatus }))
    setTimeline(prev => [...prev, {
      id: `t-${Date.now()}`,
      action: `Status changed to ${nextStatus.replace('_', ' ')}`,
      user: profile?.full_name || 'Admin Staff',
      timestamp: new Date().toLocaleString(),
      iconType: 'progress' as IconType
    }])
    toast.success(`Status updated to ${nextStatus.replace('_', ' ')}`)
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

  const roleParam = searchParams.get('role') as 'student' | 'staff' | 'admin' | null
  const role = (authRole as 'student' | 'staff' | 'admin') || roleParam || 'student'

  if (authLoading || loading) {
    return (
      <DashboardLayout role={role} userName="Loading..." userEmail="">
        <div className="flex justify-center items-center h-64">
          <p className="text-[#787774]">Loading complaint...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !complaint) {
    return (
      <DashboardLayout role={role} userName={profile?.full_name || 'User'} userEmail={profile?.email || ''}>
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <p className="text-xl text-[#787774] font-medium">{error || 'Complaint not found'}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={role} userName={profile?.full_name || 'User'} userEmail={profile?.email || ''}>
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
            <h1 className="text-2xl font-bold text-[#111111]">Complaint {complaint.id.substring(0, 8)}</h1>
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
                  {complaint.category}
                </span>
              </div>

              {complaint.status === 'escalated' && (
                <EscalationBadge level={1} escalatedAt={new Date().toISOString()} />
              )}

              <h2 className="text-xl font-bold mb-3">{complaint.title}</h2>
              <p className="text-[#787774] text-sm leading-relaxed mb-6">
                {complaint.description}
              </p>

              {/* Images */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {(complaint.image_urls || []).map((img: string, idx: number) => (
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
                    <p className="text-sm font-medium">{complaint.building}</p>
                    <p className="text-sm text-[#787774]">{complaint.room_number}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5"><AvatarIcon className="w-5 h-5 text-[#787774]" /></div>
                  <div>
                    <p className="text-xs text-[#787774] uppercase tracking-wider font-semibold">Student</p>
                    <p className="text-sm font-medium">{complaint.student?.full_name || 'Unknown Student'}</p>
                    <p className="text-sm text-[#787774]">{complaint.student?.email || 'No email provided'}</p>
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
              deadline={complaint.sla_deadline || new Date(Date.now() + 86400000).toISOString()} 
              createdAt={complaint.created_at}
              priority={complaint.priority} 
            />

            <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MixerHorizontalIcon className="w-5 h-5 text-[#111111]" />
                <h3 className="font-bold text-lg">AI Analysis</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#787774] uppercase tracking-wider font-semibold mb-1">Summary</p>
                  <p className="text-sm">{complaint.ai_summary || 'No AI summary available.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#787774] uppercase tracking-wider font-semibold mb-1">Predicted Dept</p>
                    <p className="text-sm font-medium">{complaint.ai_metadata?.department || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#787774] uppercase tracking-wider font-semibold mb-1">Sentiment</p>
                    <span className="inline-block px-2 py-1 bg-[#FDEBEC] text-[#9C3238] border border-[#EAEAEA] rounded text-xs font-medium">
                      {complaint.ai_sentiment_score > 0 ? 'Positive' : complaint.ai_sentiment_score < 0 ? 'Negative' : 'Neutral'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-[#787774] uppercase tracking-wider font-semibold mb-1">
                    <span>Urgency Score</span>
                    <span>{complaint.ai_metadata?.urgencyScore || 0}/100</span>
                  </div>
                  <div className="w-full h-2 bg-[#F7F6F3] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#111111]" 
                      style={{ width: `${complaint.ai_metadata?.urgencyScore || 0}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-lg mb-2">Actions</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={handleUpdateStatus}
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
            setComplaint((prev: any) => ({ ...prev, status: 'closed' as any }))
          }}
          onReopen={() => {
            setComplaint((prev: any) => ({ ...prev, status: 'in_progress' as any }))
          }}
        />
      </div>
    </DashboardLayout>
  )
}
