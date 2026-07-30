"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { MagnifyingGlassIcon, ClockIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import Link from "next/link";

interface Complaint {
  id: string;
  title: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  location: string;
  slaStatus: string;
  createdAt: string;
}

const mockComplaints: Complaint[] = [
  { id: "C-101", title: "AC Not Cooling", status: "In Progress", category: "Electrical", priority: "High", location: "Block A - Room 302", slaStatus: "On Track", createdAt: "Oct 24, 2023" },
  { id: "C-102", title: "Broken Window Blind", status: "Resolved", category: "Carpentry", priority: "Low", location: "Library - 2nd Floor", slaStatus: "Completed", createdAt: "Oct 22, 2023" },
  { id: "C-103", title: "Water Leakage in Washroom", status: "Open", category: "Plumbing", priority: "Critical", location: "Block B - Ground Floor", slaStatus: "Breach Risk", createdAt: "Oct 25, 2023" },
  { id: "C-104", title: "Projector Bulb Dead", status: "Closed", category: "IT Support", priority: "Medium", location: "Lecture Hall 4", slaStatus: "Completed", createdAt: "Oct 15, 2023" },
  { id: "C-105", title: "Wi-Fi Router Restart Required", status: "Open", category: "IT Support", priority: "Medium", location: "Hostel H1 - Room 112", slaStatus: "On Track", createdAt: "Oct 25, 2023" },
  { id: "C-106", title: "Door Lock Jammed", status: "In Progress", category: "Carpentry", priority: "High", location: "Lab 3", slaStatus: "Escalated", createdAt: "Oct 23, 2023" },
  { id: "C-107", title: "Flickering Tube Light", status: "Resolved", category: "Electrical", priority: "Low", location: "Block A - Corridor", slaStatus: "Completed", createdAt: "Oct 20, 2023" },
];

const STATUS_CONFIG = {
  "Open": { bgColor: "#FDEBEC", color: "#E53935" },
  "In Progress": { bgColor: "#FBF3DB", color: "#D97706" },
  "Resolved": { bgColor: "#EDF3EC", color: "#16A34A" },
  "Closed": { bgColor: "#EAEAEA", color: "#787774" }
};

export default function MyComplaintsPage() {
  const [filter, setFilter] = useState<"All" | "Open" | "Resolved" | "Closed">("All");
  const [search, setSearch] = useState("");

  const filteredComplaints = mockComplaints.filter(c => {
    const matchesFilter = filter === "All" ? true : (filter === "Open" ? (c.status === "Open" || c.status === "In Progress") : c.status === filter);
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <DashboardLayout role="student" userName="Rahul Verma" userEmail="rahul@campus.edu">
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
          {filteredComplaints.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[#787774] bg-white border border-[#EAEAEA] rounded-xl">
              No complaints found matching your criteria.
            </div>
          ) : (
            filteredComplaints.map((complaint, index) => (
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
                      {complaint.id}
                    </span>
                    <span 
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ 
                        backgroundColor: STATUS_CONFIG[complaint.status].bgColor,
                        color: STATUS_CONFIG[complaint.status].color 
                      }}
                    >
                      {complaint.status}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-base mb-1 group-hover:text-[#3B82F6] transition-colors line-clamp-1">
                    {complaint.title}
                  </h3>
                  <p className="text-sm text-[#787774] mb-4 flex items-center gap-1.5">
                    {complaint.location}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs px-2 py-1 bg-[#F7F6F3] text-[#111111] rounded font-medium">
                      {complaint.category}
                    </span>
                    <span className="text-xs px-2 py-1 bg-[#F7F6F3] text-[#111111] rounded font-medium">
                      {complaint.priority}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-[#EAEAEA] flex items-center justify-between text-xs text-[#787774]">
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {complaint.createdAt}
                    </div>
                    <span className={
                      complaint.slaStatus === "Breach Risk" || complaint.slaStatus === "Escalated" 
                        ? "text-[#E53935] font-medium" 
                        : ""
                    }>
                      {complaint.slaStatus}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
