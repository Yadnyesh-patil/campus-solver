'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import Link from 'next/link'
import { FileTextIcon, ClockIcon, CheckCircledIcon, ExclamationTriangleIcon, PlusIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-[#FBF3DB] text-[#111111] border-[#EAEAEA]',
  verified: 'bg-[#E1F3FE] text-[#111111] border-[#EAEAEA]',
  assigned: 'bg-[#E1F3FE] text-[#111111] border-[#EAEAEA]',
  in_progress: 'bg-[#E1F3FE] text-[#111111] border-[#EAEAEA]',
  resolved: 'bg-[#EDF3EC] text-[#111111] border-[#EAEAEA]',
  closed: 'bg-[#EAEAEA] text-[#111111] border-[#EAEAEA]',
  rejected: 'bg-[#FDEBEC] text-[#111111] border-[#EAEAEA]',
  escalated: 'bg-[#FDEBEC] text-[#111111] border-[#EAEAEA]',
  pending: 'bg-[#FBF3DB] text-[#111111] border-[#EAEAEA]',
}

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-[#EDF3EC] text-[#111111]',
  medium: 'bg-[#FBF3DB] text-[#111111]',
  high: 'bg-[#FDEBEC] text-[#111111]',
  critical: 'bg-[#FDEBEC] text-[#111111] font-bold',
}

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  
  const { user, profile, isLoading: authLoading } = useAuth()
  const [complaints, setComplaints] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, escalated: 0 })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    const fetchData = async () => {
      // Fetch recent complaints
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setComplaints(data || [])
      
      // Fetch stats
      const { data: allComplaints } = await supabase
        .from('complaints')
        .select('status, is_escalated')
        .eq('student_id', user.id)
      
      if (allComplaints) {
        setStats({
          total: allComplaints.length,
          pending: allComplaints.filter(c => ['submitted', 'verified', 'assigned', 'in_progress'].includes(c.status)).length,
          resolved: allComplaints.filter(c => ['resolved', 'closed'].includes(c.status)).length,
          escalated: allComplaints.filter(c => c.is_escalated).length,
        })
      }
      setLoading(false)
    }
    fetchData()

    const channel = supabase
      .channel('student-dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `student_id=eq.${user.id}` }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return (
    <DashboardLayout role="student" userName={profile?.full_name || 'Student'} userEmail={profile?.email || ''}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#111111] tracking-tight mb-1">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-[#787774] text-sm">{today}</p>
        </div>
        <Link 
          href="/dashboard/submit"
          className="inline-flex items-center justify-center gap-2 bg-[#111111] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Submit New Complaint
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-[#EAEAEA] flex items-start justify-between">
          <div>
            <p className="text-[#787774] text-sm font-medium mb-1">Total</p>
            <p className="text-2xl font-semibold text-[#111111]">
              {loading ? '-' : stats.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#F7F6F3] flex items-center justify-center">
            <FileTextIcon className="w-5 h-5 text-[#111111]" />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-[#EAEAEA] flex items-start justify-between">
          <div>
            <p className="text-[#787774] text-sm font-medium mb-1">Pending</p>
            <p className="text-2xl font-semibold text-[#111111]">
              {loading ? '-' : stats.pending}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FBF3DB] flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-[#111111]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#EAEAEA] flex items-start justify-between">
          <div>
            <p className="text-[#787774] text-sm font-medium mb-1">Resolved</p>
            <p className="text-2xl font-semibold text-[#111111]">
              {loading ? '-' : stats.resolved}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#EDF3EC] flex items-center justify-center">
            <CheckCircledIcon className="w-5 h-5 text-[#111111]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#EAEAEA] flex items-start justify-between">
          <div>
            <p className="text-[#787774] text-sm font-medium mb-1">Escalated</p>
            <p className="text-2xl font-semibold text-[#111111]">
              {loading ? '-' : stats.escalated}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FDEBEC] flex items-center justify-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-[#111111]" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#EAEAEA] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111111]">Recent Complaints</h2>
          <Link href="/dashboard/complaints" className="text-sm text-[#787774] hover:text-[#111111] font-medium flex items-center">
            View all <ChevronRightIcon className="w-4 h-4 ml-0.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#787774]">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#787774]">No complaints yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F6F3] text-[#787774] border-b border-[#EAEAEA]">
                <tr>
                  <th className="px-6 py-3 font-medium">ID & Title</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {complaints.map((comp) => (
                  <tr key={comp.id} className="hover:bg-[#F7F6F3] transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link href={`/dashboard/complaint/${comp.id}`} className="font-medium text-[#111111] hover:underline">
                          {comp.title}
                        </Link>
                        <span className="text-xs text-[#787774] mt-0.5">CMP-{comp.id.slice(0,4)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded border border-[#EAEAEA] bg-white text-xs font-medium text-[#787774] capitalize">
                        {comp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[comp.status] || STATUS_STYLES.pending}`}>
                        {comp.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs capitalize ${PRIORITY_STYLES[comp.priority] || PRIORITY_STYLES.low}`}>
                        {comp.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#787774]">
                      {new Date(comp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
