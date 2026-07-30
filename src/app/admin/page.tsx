"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ComplaintStatus, ComplaintPriority, STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/types";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  MagnifyingGlassIcon, 
  MixerHorizontalIcon,
  Cross2Icon
} from "@radix-ui/react-icons";

// Mock Data
const STATS = [
  { label: "Total Complaints", value: "47", bg: "bg-white", border: "border-[#EAEAEA]" },
  { label: "Open", value: "12", bg: "bg-[#E1F3FE]", border: "border-[#b6e0fe]" },
  { label: "In Progress", value: "8", bg: "bg-[#FBF3DB]", border: "border-[#f4e0aa]" },
  { label: "Resolved Today", value: "5", bg: "bg-[#EDF3EC]", border: "border-[#cce1c9]" },
  { label: "Escalated", value: "3", bg: "bg-[#FDEBEC]", border: "border-[#fabcc1]" },
  { label: "Avg Resolution Time", value: "18.5h", bg: "bg-white", border: "border-[#EAEAEA]" }
];

const DEPARTMENTS = [
  { name: "Hostel Management", open: 5, avgTime: "12h" },
  { name: "Electrical", open: 3, avgTime: "8h" },
  { name: "IT/Network", open: 2, avgTime: "24h" },
  { name: "Water Supply", open: 1, avgTime: "6h" },
  { name: "Mess/Canteen", open: 1, avgTime: "4h" },
];

const MOCK_COMPLAINTS = [
  { id: "C-101", title: "No internet in Block B", student: "Arjun K.", dept: "IT/Network", staff: "Unassigned", status: "verified" as ComplaintStatus, priority: "high" as ComplaintPriority, created: "2024-03-15" },
  { id: "C-102", title: "Geyser not working", student: "Priya S.", dept: "Electrical", staff: "Ramesh M.", status: "in_progress" as ComplaintStatus, priority: "medium" as ComplaintPriority, created: "2024-03-15" },
  { id: "C-103", title: "Water leakage", student: "Rahul V.", dept: "Water Supply", staff: "Unassigned", status: "submitted" as ComplaintStatus, priority: "low" as ComplaintPriority, created: "2024-03-14" },
  { id: "C-104", title: "Food quality issue", student: "Neha M.", dept: "Mess/Canteen", staff: "Sunita K.", status: "resolved" as ComplaintStatus, priority: "high" as ComplaintPriority, created: "2024-03-14" },
  { id: "C-105", title: "Broken chair", student: "Vikram P.", dept: "Hostel Mgmt", staff: "Unassigned", status: "verified" as ComplaintStatus, priority: "low" as ComplaintPriority, created: "2024-03-13" },
  { id: "C-106", title: "Fan making noise", student: "Aditi S.", dept: "Electrical", staff: "Ramesh M.", status: "assigned" as ComplaintStatus, priority: "medium" as ComplaintPriority, created: "2024-03-13" },
  { id: "C-107", title: "Server downtime", student: "John D.", dept: "IT/Network", staff: "Admin", status: "in_progress" as ComplaintStatus, priority: "critical" as ComplaintPriority, created: "2024-03-12" },
  { id: "C-108", title: "Cleaning not done", student: "Sara L.", dept: "Hostel Mgmt", staff: "Unassigned", status: "submitted" as ComplaintStatus, priority: "medium" as ComplaintPriority, created: "2024-03-12" },
];

const STAFF_MEMBERS = ["Ramesh M.", "Sunita K.", "Amit T.", "Deepak S."];

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  
  const [assignDept, setAssignDept] = useState("");
  const [assignStaff, setAssignStaff] = useState("");

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.student.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAssignClick = (id: string) => {
    setSelectedComplaint(id);
    setAssignDept("");
    setAssignStaff("");
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = () => {
    if (!assignDept || !assignStaff) {
      toast.error("Please select both department and staff");
      return;
    }
    
    setComplaints(prev => prev.map(c => 
      c.id === selectedComplaint 
        ? { ...c, staff: assignStaff, dept: assignDept, status: "assigned" as ComplaintStatus } 
        : c
    ));
    
    toast.success(`Complaint assigned to ${assignStaff} in ${assignDept}`);
    setAssignModalOpen(false);
  };

  const handleEscalate = (id: string) => {
    toast.error(`Complaint ${id} escalated to higher authority`);
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <DashboardLayout role="admin" userName="Dr. Rajesh Kumar" userEmail="admin@campus.edu">
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">Admin Dashboard</h1>
            <p className="text-sm text-[#787774] mt-1">{todayStr}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATS.map((stat, i) => (
            <div key={i} className={\`p-5 rounded-xl border \${stat.bg} \${stat.border}\`}>
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
              {DEPARTMENTS.map((dept, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-[#EAEAEA] last:border-0">
                  <span className="text-sm font-medium text-[#111111]">{dept.name}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="w-12 text-center text-[#787774]">{dept.open}</span>
                    <span className="w-12 text-right text-[#787774]">{dept.avgTime}</span>
                  </div>
                </div>
              ))}
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
                          <div className="text-xs text-[#787774] mt-0.5">{c.id}</div>
                        </td>
                        <td className="px-5 py-3 text-[#111111]">{c.student}</td>
                        <td className="px-5 py-3">
                          <div className="text-[#111111]">{c.dept}</div>
                          <div className="text-xs text-[#787774] mt-0.5">{c.staff}</div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide border
                              \${STATUS_CONFIG[c.status].bg} \${STATUS_CONFIG[c.status].text} \${STATUS_CONFIG[c.status].border}
                            \`}>
                              {STATUS_CONFIG[c.status].label}
                            </span>
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide border
                              \${PRIORITY_CONFIG[c.priority].bg} \${PRIORITY_CONFIG[c.priority].text} \${PRIORITY_CONFIG[c.priority].border}
                            \`}>
                              {PRIORITY_CONFIG[c.priority].label}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[#787774]">{c.created}</td>
                        <td className="px-5 py-3 text-right space-x-2">
                          {c.staff === "Unassigned" && c.status !== "resolved" && (
                            <button
                              onClick={() => handleAssignClick(c.id)}
                              className="px-3 py-1 bg-[#111111] text-white text-xs font-medium rounded hover:bg-black transition-colors"
                            >
                              Assign
                            </button>
                          )}
                          <button 
                            onClick={() => handleEscalate(c.id)}
                            className="px-3 py-1 bg-white border border-[#EAEAEA] text-[#111111] text-xs font-medium rounded hover:bg-[#FDEBEC] hover:border-[#fabcc1] hover:text-red-700 transition-colors"
                          >
                            Escalate
                          </button>
                          <button className="px-3 py-1 text-[#787774] hover:text-[#111111] text-xs font-medium underline underline-offset-2 transition-colors">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
                    {DEPARTMENTS.map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
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
                    {STAFF_MEMBERS.map(s => (
                      <option key={s} value={s}>{s}</option>
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
