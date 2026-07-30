"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ComplaintStatus, ComplaintPriority, STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/types";
import { motion } from "motion/react";
import { toast } from "sonner";
import Link from "next/link";
import { 
  ClockIcon, 
  ChatBubbleIcon, 
  HomeIcon, 
  PersonIcon 
} from "@radix-ui/react-icons";
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';

export default function StaffDashboard() {
  const { user, profile } = useAuth();
  const [filter, setFilter] = useState("All");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const fetchData = async () => {
      const { data } = await supabase
        .from('complaints')
        .select('*, student:profiles!student_id(full_name)')
        .eq('assigned_staff_id', user.id)
        .order('created_at', { ascending: false });
      
      // Calculate deadlines for display
      const withDeadlines = (data || []).map(c => {
        let deadline = 'No deadline';
        let deadlineStatus = 'normal';
        if (c.sla_deadline) {
          const now = new Date();
          const dl = new Date(c.sla_deadline);
          const diff = dl.getTime() - now.getTime();
          if (c.status === 'resolved' || c.status === 'closed') {
            deadline = 'Completed';
            deadlineStatus = 'completed';
          } else if (diff < 0) {
            const hours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
            deadline = `Overdue by ${hours}h`;
            deadlineStatus = 'overdue';
          } else if (diff < 3 * 60 * 60 * 1000) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            deadline = `Due in ${hours}h ${mins}m`;
            deadlineStatus = 'urgent';
          } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            deadline = `Due in ${hours}h`;
            deadlineStatus = 'normal';
          }
        }
        return {
          ...c,
          id: c.id,
          title: c.title,
          category: c.category,
          studentName: c.student?.full_name || 'Unknown',
          status: c.status,
          priority: c.priority,
          building: c.building || 'Unknown',
          room: c.room_number || '',
          createdAt: c.created_at,
          deadline,
          deadlineStatus,
        };
      });
      setComplaints(withDeadlines);
      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel('staff-complaints-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `assigned_staff_id=eq.${user.id}` }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredComplaints = complaints.filter(c => {
    if (filter === "All") return true;
    if (filter === "New") return c.status === "verified" || c.status === "assigned";
    if (filter === "In Progress") return c.status === "in_progress";
    if (filter === "Resolved") return c.status === "resolved";
    return true;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    const supabase = createClient();
    const updateData: any = { status: newStatus };
    if (newStatus === 'resolved') updateData.resolved_at = new Date().toISOString();
    
    // Optimistic UI update
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as ComplaintStatus } : c));
    
    await supabase.from('complaints').update(updateData).eq('id', id);
    if (user) {
      await supabase.from('complaint_logs').insert({
        complaint_id: id,
        user_id: user.id,
        action: 'status_change',
        old_value: complaints.find(c => c.id === id)?.status,
        new_value: newStatus,
      });
    }
    toast.success(`Status updated to ${STATUS_CONFIG[newStatus as ComplaintStatus]?.label || newStatus}`);
  };

  const handleCommentSubmit = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInputs[id]?.trim() || !user) return;
    
    const supabase = createClient();
    await supabase.from('complaint_logs').insert({
      complaint_id: id,
      user_id: user.id,
      action: 'comment',
      comment: commentInputs[id].trim(),
    });
    
    toast.success("Comment added successfully");
    setCommentInputs(prev => ({ ...prev, [id]: "" }));
  };

  return (
    <DashboardLayout role="staff" userName={profile?.full_name || 'Staff'} userEmail={profile?.email || ''}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">Assigned Complaints</h1>
            <span className="px-2.5 py-1 bg-[#EAEAEA] text-sm font-medium rounded-full text-[#111111]">
              {complaints.filter(c => c.status !== "resolved").length} Active
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 border-b border-[#EAEAEA] pb-px overflow-x-auto">
          {["All", "New", "In Progress", "Resolved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap
                ${filter === tab ? "text-[#111111]" : "text-[#787774] hover:text-[#111111]"}`}
            >
              {tab}
              {filter === tab && (
                <motion.div
                  layoutId="staffTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#111111]"
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Complaint Cards List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-[#787774]">Loading...</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-12 text-[#787774]">
              No complaints found for this filter.
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm"
              >
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                  
                  {/* Left content */}
                  <div className="space-y-3 flex-1 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-[#787774]">{complaint.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F7F6F3] text-[#111111] border border-[#EAEAEA]">
                        {complaint.category}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: PRIORITY_CONFIG[complaint.priority as ComplaintPriority]?.bgColor || '#EAEAEA',
                          color: PRIORITY_CONFIG[complaint.priority as ComplaintPriority]?.color || '#111',
                        }}
                      >
                        {PRIORITY_CONFIG[complaint.priority as ComplaintPriority]?.label || complaint.priority}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-[#111111] leading-tight">
                      <Link href={`/dashboard/complaint/${complaint.id}?role=staff`} className="hover:underline">
                        {complaint.title}
                      </Link>
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-[#787774]">
                      <div className="flex items-center gap-1.5">
                        <PersonIcon className="w-4 h-4" />
                        {complaint.studentName}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HomeIcon className="w-4 h-4" />
                        {complaint.building}, Room {complaint.room}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4" />
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    <select
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer outline-none focus:ring-2 focus:ring-[#EAEAEA]"
                      style={{
                        backgroundColor: STATUS_CONFIG[complaint.status as ComplaintStatus]?.bgColor || '#EAEAEA',
                        color: STATUS_CONFIG[complaint.status as ComplaintStatus]?.color || '#111',
                      }}
                    >
                      <option value="verified">Verified</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>

                    {complaint.status !== "resolved" && (
                      <div className={`text-xs font-medium flex items-center gap-1 ${complaint.deadlineStatus === 'overdue' ? 'text-red-600' : complaint.deadlineStatus === 'urgent' ? 'text-amber-600' : 'text-[#787774]'}`}>
                        <ClockIcon className="w-3.5 h-3.5" />
                        {complaint.deadline}
                      </div>
                    )}
                  </div>
                </div>

                {/* Comment Section */}
                <div className="mt-5 pt-4 border-t border-[#EAEAEA]">
                  <form onSubmit={(e) => handleCommentSubmit(complaint.id, e)} className="flex gap-2">
                    <div className="relative flex-1">
                      <ChatBubbleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774]" />
                      <input
                        type="text"
                        placeholder="Add an internal update or note..."
                        value={commentInputs[complaint.id] || ""}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [complaint.id]: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-[#F7F6F3] border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#111111] transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!commentInputs[complaint.id]?.trim()}
                      className="px-4 py-2 bg-[#111111] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-opacity"
                    >
                      Post
                    </button>
                  </form>
                </div>

              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
