'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { PersonIcon, PlusIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

export default function AdminStaffPage() {
  const { user, profile } = useAuth()
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    
    const fetchStaffData = async () => {
      // Fetch all profiles with role = 'staff'
      const { data: staffProfiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, department, role')
        .eq('role', 'staff')

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      // Fetch all complaints assigned to these staff members to calculate stats
      const { data: complaintsData } = await supabase
        .from('complaints')
        .select('id, status, assigned_staff_id, created_at')
        .in('assigned_staff_id', staffProfiles.map(s => s.id))

      const staffWithStats = staffProfiles.map(s => {
        const staffComplaints = (complaintsData || []).filter(c => c.assigned_staff_id === s.id)
        const active = staffComplaints.filter(c => ['assigned', 'in_progress'].includes(c.status)).length
        const resolved = staffComplaints.filter(c => c.status === 'resolved' || c.status === 'closed').length
        
        return {
          id: s.id,
          name: s.full_name || 'Unknown',
          email: s.email || '',
          department: s.department || 'Unassigned',
          role: s.role,
          activeComplaints: active,
          resolved: resolved,
          status: 'active', // For demo, all are active
        }
      })

      setStaff(staffWithStats)
      setLoading(false)
    }

    fetchStaffData()
    // Optionally add postgres_changes for realtime updates
    const channel = supabase.channel('staff-sync-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStaffData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, fetchStaffData)
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const toggleStatus = (id: string) => {
    toast.info("Status toggling is disabled for demo purposes.")
  }

  const activeCount = staff.filter(s => s.status === 'active').length
  const totalResolved = staff.reduce((sum, s) => sum + s.resolved, 0)

  return (
    <DashboardLayout role="admin" userName={profile?.full_name || 'Admin'} userEmail={profile?.email || ''}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">Manage Staff</h1>
            <p className="text-sm text-[#787774] mt-1">Manage maintenance and support team members</p>
          </div>
          <button onClick={() => toast.info('Add Staff form coming soon')} className="px-4 py-2 bg-[#111111] text-white text-sm font-medium rounded-lg hover:bg-black transition-colors flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Add Staff Member
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-5">
            <div className="text-sm text-[#787774] mb-1">Total Staff</div>
            <div className="text-3xl font-semibold text-[#111111]">{loading ? '-' : staff.length}</div>
          </div>
          <div className="bg-[#EDF3EC] border border-[#cce1c9] rounded-xl p-5">
            <div className="text-sm text-[#787774] mb-1">Active</div>
            <div className="text-3xl font-semibold text-[#111111]">{loading ? '-' : activeCount}</div>
          </div>
          <div className="bg-[#E1F3FE] border border-[#b6e0fe] rounded-xl p-5">
            <div className="text-sm text-[#787774] mb-1">Total Resolved</div>
            <div className="text-3xl font-semibold text-[#111111]">{loading ? '-' : totalResolved}</div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white border border-[#EAEAEA] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#787774]">Loading staff...</div>
            ) : staff.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#787774]">No staff found.</div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#F7F6F3] text-[#787774] font-medium border-b border-[#EAEAEA]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Department</th>
                    <th className="px-5 py-3 font-medium">Active</th>
                    <th className="px-5 py-3 font-medium">Resolved</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {staff.map((member, index) => (
                    <motion.tr key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-[#F7F6F3]/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F7F6F3] border border-[#EAEAEA] flex items-center justify-center"><PersonIcon className="w-4 h-4 text-[#787774]" /></div>
                          <div>
                            <div className="font-medium text-[#111111]">{member.name}</div>
                            <div className="text-xs text-[#787774]">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#111111]">{member.department}</td>
                      <td className="px-5 py-3"><span className={`font-medium ${member.activeComplaints > 3 ? 'text-red-600' : 'text-[#111111]'}`}>{member.activeComplaints}</span></td>
                      <td className="px-5 py-3 text-[#111111]">{member.resolved}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${member.status === 'active' ? 'bg-[#EDF3EC] text-green-700' : 'bg-[#F7F6F3] text-[#787774]'}`}>
                          {member.status === 'active' ? <CheckCircledIcon className="w-3 h-3" /> : <CrossCircledIcon className="w-3 h-3" />}
                          {member.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => toggleStatus(member.id)} className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${member.status === 'active' ? 'border-[#EAEAEA] text-[#787774] hover:bg-[#FDEBEC] hover:text-red-700 hover:border-[#fabcc1]' : 'border-[#cce1c9] text-green-700 bg-[#EDF3EC] hover:bg-green-100'}`}>
                          {member.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
