"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { MagnifyingGlassIcon, ClockIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import Link from "next/link";
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

const STATUS_CONFIG: Record<string, { bgColor: string, color: string }> = {
  submitted: { bgColor: "#FDEBEC", color: "#E53935" }, // Open
  verified: { bgColor: "#FDEBEC", color: "#E53935" },
  assigned: { bgColor: "#FBF3DB", color: "#D97706" }, // In Progress
  in_progress: { bgColor: "#FBF3DB", color: "#D97706" },
  resolved: { bgColor: "#EDF3EC", color: "#16A34A" },
  closed: { bgColor: "#EAEAEA", color: "#787774" },
  rejected: { bgColor: "#EAEAEA", color: "#787774" }
};

const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.submitted;

const getSlaStatus = (c: any) => {
  if (c.is_escalated) return "Escalated";
  if (c.status === "closed" || c.status === "resolved") return "Completed";
  if (c.sla_deadline && new Date() > new Date(c.sla_deadline)) return "Breach Risk";
  return "On Track";
}

export default function MyComplaintsPage() {
  const [filter, setFilter] = useState<"All" | "Open" | "Resolved" | "Closed">("All");
  const [search, setSearch] = useState("");
  
  const { user, profile } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchComplaints = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      
      setComplaints(data || []);
      setLoading(false);
    };
    fetchComplaints();

    const channel = supabase
      .channel('student-complaints-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `student_id=eq.${user.id}` }, () => {
        fetchComplaints();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredComplaints = complaints.filter(c => {
    let statusMapped = "Open";
    if (["resolved"].includes(c.status)) {
      statusMapped = "Resolved";
    } else if (["closed", "rejected"].includes(c.status)) {
      statusMapped = "Closed";
    }

    const matchesFilter = filter === "All" ? true : statusMapped === filter;
    
    const displayId = `CMP-${c.id.slice(0,4)}`.toLowerCase();
    const titleMatch = (c.title || "").toLowerCase().includes(search.toLowerCase());
    const idMatch = displayId.includes(search.toLowerCase());
    
    return matchesFilter && (titleMatch || idMatch);
  });

  return (
    <DashboardLayout role="student" userName={profile?.full_name || 'Student'} userEmail={profile?.email || ''}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">My Complaints</h1>
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787774] w-4 h-4" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#EAEAEA] rounded-lg text-sm focus:outline-none focus:border-[#787774] transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(["All", "Open", "Resolved", "Closed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f ? "bg-[#111111] text-[#F7F6F3]" : "text-[#787774] bg-white border border-[#EAEAEA] hover:bg-[#F7F6F3]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-[#787774] bg-white border border-[#EAEAEA] rounded-xl">
              Loading complaints...
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[#787774] bg-white border border-[#EAEAEA] rounded-xl">
              No complaints found matching your criteria.
            </div>
          ) : (
            filteredComplaints.map((complaint, index) => {
              const displayId = `CMP-${complaint.id.slice(0,4).toUpperCase()}`;
              const slaStatus = getSlaStatus(complaint);
              const config = getStatusConfig(complaint.status);
              
              return (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link 
                    href={`/dashboard/complaint/${complaint.id}`}
                    className="block h-full bg-white border border-[#EAEAEA] rounded-xl p-5 hover:shadow-sm hover:border-[#787774] transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-mono font-medium text-[#787774] bg-[#F7F6F3] px-2 py-1 rounded">
                        {displayId}
                      </span>
                      <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ 
                          backgroundColor: config.bgColor,
                          color: config.color 
                        }}
                      >
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-base mb-1 group-hover:text-[#3B82F6] transition-colors line-clamp-1">
                      {complaint.title}
                    </h3>
                    <p className="text-sm text-[#787774] mb-4 flex items-center gap-1.5 line-clamp-1">
                      {complaint.building}{complaint.room_number ? ` - ${complaint.room_number}` : ''}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs px-2 py-1 bg-[#F7F6F3] text-[#111111] rounded font-medium capitalize">
                        {complaint.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-[#F7F6F3] text-[#111111] rounded font-medium capitalize">
                        {complaint.priority}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-[#EAEAEA] flex items-center justify-between text-xs text-[#787774]">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {new Date(complaint.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <span className={
                        slaStatus === "Breach Risk" || slaStatus === "Escalated" 
                          ? "text-[#E53935] font-medium" 
                          : ""
                      }>
                        {slaStatus}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
