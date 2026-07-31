"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ComplaintStatus, ComplaintPriority, STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/types";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import Link from "next/link";
import { 
  MagnifyingGlassIcon, 
  MixerHorizontalIcon,
  Cross2Icon
} from "@radix-ui/react-icons";
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [complaints, setComplaints] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  
  const [assignDept, setAssignDept] = useState("");
  const [assignStaff, setAssignStaff] = useState("");

  const supabase = createClient();

  const fetchDashboardData = async () => {
    if (!user) return;
    
    // Fetch complaints
    const { data: complaintsData } = await supabase
      .from('complaints')
      .select('*, student:profiles!student_id(full_name), staff:profiles!assigned_staff_id(full_name), department:departments!assigned_dept_id(name)')
      .order('created_at', { ascending: false });
    
    const items = complaintsData || [];
    setComplaints(items);
    
    // Compute stats
    const open = items.filter(c => ['submitted', 'verified'].includes(c.status)).length;
    const inProgress = items.filter(c => ['assigned', 'in_progress'].includes(c.status)).length;
    const resolvedToday = items.filter(c => c.status === 'resolved' && c.resolved_at && new Date(c.resolved_at).toDateString() === new Date().toDateString()).length;
    const escalated = items.filter(c => c.is_escalated).length;
    
    setStats([
      { label: 'Total Complaints', value: String(items.length), bg: 'bg-white', border: 'border-[#EAEAEA]' },
      { label: 'Open', value: String(open), bg: 'bg-[#E1F3FE]', border: 'border-[#b6e0fe]' },
      { label: 'In Progress', value: String(inProgress), bg: 'bg-[#FBF3DB]', border: 'border-[#f4e0aa]' },
      { label: 'Resolved Today', value: String(resolvedToday), bg: 'bg-[#EDF3EC]', border: 'border-[#cce1c9]' },
      { label: 'Escalated', value: String(escalated), bg: 'bg-[#FDEBEC]', border: 'border-[#fabcc1]' },
      { label: 'Avg Resolution Time', value: '—', bg: 'bg-white', border: 'border-[#EAEAEA]' },
    ]);
    
    // Fetch departments
    const { data: deptData } = await supabase.from('departments').select('*').eq('is_active', true);
    setDepartments(deptData || []);
    
    // Fetch staff members
    const { data: staffData } = await supabase.from('profiles').select('id, full_name, department').eq('role', 'staff');
    setStaffMembers(staffData || []);
    
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();

    const channel = supabase
      .channel('admin-complaints-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredComplaints = complaints.filter(c => {
    const studentName = c.student?.full_name || '';
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          studentName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAssignClick = (id: string) => {
    setSelectedComplaint(id);
    setAssignDept("");
    setAssignStaff("");
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!assignDept || !assignStaff) {
      toast.error("Please select both department and staff");
      return;
    }

    const dept = departments.find(d => d.id === assignDept);
    const staff = staffMembers.find(s => s.id === assignStaff);

    if (!dept || !staff) {
      toast.error("Invalid department or staff selected");
      return;
    }

    // Update in Supabase
    const { error } = await supabase.from('complaints').update({
      assigned_dept_id: dept.id,
      assigned_staff_id: staff.id,
      status: 'assigned',
    }).eq('id', selectedComplaint);

    if (error) {
      toast.error("Failed to assign complaint");
      console.error(error);
      return;
    }

    // Insert log
    await supabase.from('complaint_logs').insert({
      complaint_id: selectedComplaint,
      user_id: user?.id,
      action: 'assignment',
      new_value: `Assigned to ${staff.full_name} in ${dept.name}`,
    });
    
    toast.success(`Complaint assigned to ${staff.full_name} in ${dept.name}`);
    setAssignModalOpen(false);
    fetchDashboardData();
  };

  const handleEscalate = async (id: string) => {
    const { error } = await supabase.from('complaints').update({
      is_escalated: true,
      escalated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
      toast.error("Failed to escalate complaint");
      return;
    }

    await supabase.from('complaint_logs').insert({
      complaint_id: id,
      user_id: user?.id,
      action: 'escalation',
      new_value: 'Complaint escalated to higher authority',
    });

    toast.success(`Complaint ${id} escalated to higher authority`);
    fetchDashboardData();
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <DashboardLayout role="admin" userName={profile?.full_name || 'Admin'} userEmail={profile?.email || ''}>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">Admin Dashboard</h1>
            <p className="text-sm text-[#787774] mt-1">{todayStr}</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={async () => {
                const toastId = toast.loading("AI is scanning for duplicates...");
                try {
                  const res = await fetch("/api/admin/clean-duplicates", { method: "POST" });
                  const data = await res.json();
                  if (data.success) {
                    if (data.deletedCount > 0) {
                      toast.success(`Removed ${data.deletedCount} duplicate complaints`, { id: toastId });
                      fetchDashboardData();
                    } else {
                      toast.success("No duplicates found. Database is clean!", { id: toastId });
                    }
                  } else {
                    toast.error(data.error || "Failed to clean duplicates", { id: toastId });
                  }
                } catch (e) {
                  toast.error("An error occurred during cleanup", { id: toastId });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors whitespace-nowrap"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              AI Clean Duplicates
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-[#787774] py-10">Loading dashboard...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className={`p-5 rounded-xl border ${stat.bg} ${stat.border}`}>
                  <div className="text-sm font-medium text-[#787774] mb-1">{stat.label}</div>
                  <div className="text-3xl font-semibold text-[#111111]">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Department Performance */}
              <div className="lg:col-span-1 bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm h-fit">
                <h2 className="text-lg font-semibold text-[#111111] mb-4">Department Performance</h2>
                <div className="space-y-0">
                  <div className="flex justify-between text-xs font-medium text-[#787774] pb-2 border-b border-[#EAEAEA]">
                    <span>Department</span>
                    <div className="flex gap-4">
                      <span className="w-12 text-center">Open</span>
                      <span className="w-12 text-right">Avg SLA</span>
                    </div>
                  </div>
                  {departments.map((dept, i) => {
                    const deptComplaints = complaints.filter(c => c.assigned_dept_id === dept.id);
                    const openComplaints = deptComplaints.filter(c => ['assigned', 'in_progress'].includes(c.status)).length;
                    return (
                      <div key={i} className="flex justify-between items-center py-3 border-b border-[#EAEAEA] last:border-0">
                        <span className="text-sm font-medium text-[#111111]">{dept.name}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="w-12 text-center text-[#787774]">{openComplaints}</span>
                          <span className="w-12 text-right text-[#787774]">—</span>
                        </div>
                      </div>
                    );
                  })}
                  {departments.length === 0 && (
                    <div className="py-3 text-sm text-[#787774]">No departments found.</div>
                  )}
                </div>
              </div>

              {/* All Complaints Table */}
              <div className="lg:col-span-2 bg-white border border-[#EAEAEA] rounded-xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-5 border-b border-[#EAEAEA] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-lg font-semibold text-[#111111]">All Complaints</h2>
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                      <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774]" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-[#F7F6F3] border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none pl-8 pr-8 py-1.5 text-sm bg-white border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#111111] cursor-pointer"
                      >
                        <option value="all">All Status</option>
                        <option value="submitted">Submitted</option>
                        <option value="verified">Verified</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <MixerHorizontalIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774] pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#F7F6F3] text-[#787774] font-medium border-b border-[#EAEAEA]">
                      <tr>
                        <th className="px-5 py-3 font-medium">Title & ID</th>
                        <th className="px-5 py-3 font-medium">Student</th>
                        <th className="px-5 py-3 font-medium">Dept / Staff</th>
                        <th className="px-5 py-3 font-medium">Status / Priority</th>
                        <th className="px-5 py-3 font-medium">Created</th>
                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {filteredComplaints.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-[#787774]">
                            No complaints match your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredComplaints.map((c) => (
                          <tr key={c.id} className="hover:bg-[#F7F6F3]/50 transition-colors">
                            <td className="px-5 py-3">
                              <div className="font-medium text-[#111111]">{c.title}</div>
                              <div className="text-xs text-[#787774] mt-0.5">{c.id.split('-')[0]}...</div>
                            </td>
                            <td className="px-5 py-3 text-[#111111]">{c.student?.full_name || 'Unknown'}</td>
                            <td className="px-5 py-3">
                              <div className="text-[#111111]">{c.department?.name || 'Unassigned'}</div>
                              <div className="text-xs text-[#787774] mt-0.5">{c.staff?.full_name || 'Unassigned'}</div>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex flex-col gap-1.5 items-start">
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide border"
                                  style={{ backgroundColor: STATUS_CONFIG[c.status as ComplaintStatus]?.bgColor || '#f3f4f6', color: STATUS_CONFIG[c.status as ComplaintStatus]?.color || '#374151' }}
                                >
                                  {STATUS_CONFIG[c.status as ComplaintStatus]?.label || c.status}
                                </span>
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide border"
                                  style={{ backgroundColor: PRIORITY_CONFIG[c.priority as ComplaintPriority]?.bgColor || '#f3f4f6', color: PRIORITY_CONFIG[c.priority as ComplaintPriority]?.color || '#374151' }}
                                >
                                  {PRIORITY_CONFIG[c.priority as ComplaintPriority]?.label || c.priority}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-[#787774]">{new Date(c.created_at).toLocaleDateString()}</td>
                            <td className="px-5 py-3 text-right space-x-2">
                              {(!c.assigned_staff_id) && c.status !== "resolved" && c.status !== "closed" && (
                                <button
                                  onClick={() => handleAssignClick(c.id)}
                                  className="px-3 py-1 bg-[#111111] text-white text-xs font-medium rounded hover:bg-black transition-colors"
                                >
                                  Assign
                                </button>
                              )}
                              {!c.is_escalated && (
                                <button 
                                  onClick={() => handleEscalate(c.id)}
                                  className="px-3 py-1 bg-white border border-[#EAEAEA] text-[#111111] text-xs font-medium rounded hover:bg-[#FDEBEC] hover:border-[#fabcc1] hover:text-red-700 transition-colors"
                                >
                                  Escalate
                                </button>
                              )}
                              <Link href={`/dashboard/complaint/${c.id}?role=admin`} className="px-3 py-1 text-[#787774] hover:text-[#111111] text-xs font-medium underline underline-offset-2 transition-colors">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Assignment Modal Overlay */}
      <AnimatePresence>
        {assignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0 bg-[#111111]/20 backdrop-blur-sm"
              onClick={() => setAssignModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-white rounded-xl shadow-xl border border-[#EAEAEA] w-full max-w-sm overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-[#EAEAEA] bg-[#F7F6F3]">
                <h3 className="font-semibold text-[#111111]">Assign Complaint</h3>
                <button 
                  onClick={() => setAssignModalOpen(false)}
                  className="text-[#787774] hover:text-[#111111] transition-colors"
                >
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#111111]">Department</label>
                  <select
                    value={assignDept}
                    onChange={(e) => setAssignDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-lg text-sm focus:outline-none focus:border-[#111111]"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#111111]">Staff Member</label>
                  <select
                    value={assignStaff}
                    onChange={(e) => setAssignStaff(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-lg text-sm focus:outline-none focus:border-[#111111]"
                  >
                    <option value="" disabled>Select Staff</option>
                    {staffMembers.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleAssignSubmit}
                    className="w-full py-2 bg-[#111111] text-white font-medium rounded-lg hover:bg-black transition-colors"
                  >
                    Confirm Assignment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
