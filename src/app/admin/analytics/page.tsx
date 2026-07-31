'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';

const STATUS_COLORS: Record<string, string> = {
  submitted: '#FCA5A5', 
  verified: '#93C5FD',
  assigned: '#FDE047',
  in_progress: '#86EFAC',
  resolved: '#6EE7B7',
  closed: '#D1D5DB',
  rejected: '#FCA5A5'
};

const getZoneColor = (count: number) => {
  if (count === 0) return 'bg-[#E7F3F1] border-[#0D7A5E]/20 text-[#0D7A5E]';
  if (count <= 2) return 'bg-[#E7F3F1] border-[#0D7A5E]/20 text-[#0D7A5E]';
  if (count <= 5) return 'bg-[#FDF3E1] border-[#A05E03]/20 text-[#A05E03]';
  if (count <= 8) return 'bg-[#FAECEC] border-[#973C38]/20 text-[#973C38]';
  return 'bg-[#F4E0E0] border-[#C93C37]/20 text-[#C93C37]';
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#EAEAEA] rounded-lg p-3 shadow-sm text-sm font-[family-name:var(--font-geist-sans)]">
        <p className="font-medium text-[#111111] mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color || '#111111' }}>
            {entry.name}: <span className="font-medium">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      const [compRes, staffRes] = await Promise.all([
        supabase.from('complaints').select('*, department:departments!assigned_dept_id(name)'),
        supabase.from('profiles').select('*').eq('role', 'staff')
      ]);

      if (compRes.data) setComplaints(compRes.data);
      if (staffRes.data) setStaffProfiles(staffRes.data);
      
      setLoading(false);
    };
    fetchData();
  }, []);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => {
      const cat = c.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
      .sort((a, b) => b.count - a.count);
  }, [complaints]);

  const timeData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { day: days[d.getDay()], date: d.toISOString().split('T')[0], count: 0 };
    });
    
    complaints.forEach(c => {
      const dateStr = c.created_at.split('T')[0];
      const dayEntry = last7Days.find(d => d.date === dateStr);
      if (dayEntry) dayEntry.count++;
    });
    return last7Days;
  }, [complaints]);

  const departmentData = useMemo(() => {
    const deptStats: Record<string, { totalTime: number, count: number }> = {};
    complaints.forEach(c => {
      if (c.status === 'resolved' && c.resolved_at && c.department) {
        const timeDiff = new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime();
        const hours = timeDiff / (1000 * 60 * 60);
        const dName = c.department.name;
        if (!deptStats[dName]) deptStats[dName] = { totalTime: 0, count: 0 };
        deptStats[dName].totalTime += hours;
        deptStats[dName].count++;
      }
    });
    return Object.entries(deptStats).map(([name, stats]) => ({
      name,
      hours: Math.round(stats.totalTime / stats.count)
    }));
  }, [complaints]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    const total = complaints.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
      value: Math.round((count / total) * 100),
      color: STATUS_COLORS[name] || '#D1D5DB'
    }));
  }, [complaints]);

  const campusZones = useMemo(() => {
    const zones = ['Hostel A', 'Hostel B', 'Hostel C', 'Academic Block A', 'Academic Block B', 'Library', 'Sports Complex', 'Medical Center', 'Main Canteen', 'Admin Block', 'Computer Center', 'Workshop'];
    const counts: Record<string, number> = {};
    zones.forEach(z => counts[z] = 0);
    
    complaints.forEach(c => {
      if (c.building) {
        const b = c.building;
        if (counts[b] !== undefined) counts[b]++;
        else {
          const match = zones.find(z => b.includes(z) || z.includes(b));
          if (match) counts[match]++;
        }
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [complaints]);

  const staffData = useMemo(() => {
    return staffProfiles.map(staff => {
      const assigned = complaints.filter(c => c.assigned_staff_id === staff.id);
      const resolved = assigned.filter(c => c.status === 'resolved');
      const rate = assigned.length ? Math.round((resolved.length / assigned.length) * 100) : 0;
      
      let avgTime = 0;
      if (resolved.length) {
        const totalTime = resolved.reduce((acc, c) => {
          if (c.resolved_at) return acc + (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime());
          return acc;
        }, 0);
        avgTime = Math.round(totalTime / resolved.length / (1000 * 60 * 60));
      }
      
      return {
        name: staff.full_name,
        assigned: assigned.length,
        resolved: resolved.length,
        avgTime: `${avgTime}h`,
        rate
      };
    }).sort((a, b) => b.assigned - a.assigned).slice(0, 5);
  }, [complaints, staffProfiles]);

  const peakHoursData = useMemo(() => {
    const hours = Array.from({length: 24}, (_, i) => ({ hour: `${i}:00`, count: 0 }));
    complaints.forEach(c => {
      const h = new Date(c.created_at).getHours();
      hours[h].count++;
    });
    const grouped = [];
    for(let i = 6; i <= 22; i+=2) {
      const count = hours[i].count + (hours[i+1]?.count || 0);
      const ampm = i < 12 ? 'AM' : (i === 12 ? 'PM' : 'PM');
      const hr = i > 12 ? i - 12 : i;
      grouped.push({ hour: `${hr}${ampm}`, count });
    }
    return grouped;
  }, [complaints]);

  return (
    <DashboardLayout role="admin" userName={profile?.full_name || 'Admin'} userEmail={profile?.email || ''}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F7F6F3] min-h-[100dvh] font-[family-name:var(--font-geist-sans)]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#111111]">Analytics Overview</h1>
          <p className="text-sm text-[#787774] mt-1">Monitor campus issues and resolution performance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Complaints by Category */}
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-5">
            <h2 className="font-medium text-[#111111] mb-4">Complaints by Category</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#787774', fontSize: 12, fontFamily: 'var(--font-geist-sans)' }} angle={-45} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#787774', fontSize: 12, fontFamily: 'var(--font-geist-sans)' }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Complaints Over Time */}
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-5">
            <h2 className="font-medium text-[#111111] mb-4">Complaints Over Time (Last 7 Days)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#787774', fontSize: 12, fontFamily: 'var(--font-geist-sans)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#787774', fontSize: 12, fontFamily: 'var(--font-geist-sans)' }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Resolution Time by Department */}
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-5">
            <h2 className="font-medium text-[#111111] mb-4">Avg Resolution Time (Hours)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAEAEA" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#787774', fontSize: 12, fontFamily: 'var(--font-geist-sans)' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#787774', fontSize: 12, fontFamily: 'var(--font-geist-sans)' }} width={80} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563EB' : '#60A5FA'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Status Distribution */}
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-5">
            <h2 className="font-medium text-[#111111] mb-4">Status Distribution</h2>
            <div className="h-72 flex flex-col">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-4 h-16 overflow-y-auto">
                {statusData.map((item, i) => (
                  <div key={i} className="flex items-center text-xs text-[#787774]">
                    <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: item.color }} />
                    {item.name} ({item.value}%)
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Chart 7: Peak Hours */}
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 lg:col-span-2">
            <h2 className="font-medium text-[#111111] mb-4">Submission Peak Hours</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#787774', fontSize: 12, fontFamily: 'var(--font-geist-sans)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#787774', fontSize: 12, fontFamily: 'var(--font-geist-sans)' }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Campus Zone Heatmap */}
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="font-medium text-[#111111]">Campus Complaint Heatmap</h2>
                <p className="text-sm text-[#787774] mt-1">Live density of reported issues across campus zones</p>
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#E7F3F1] border border-[#0D7A5E]/20"></div><span className="text-[#787774]">0-2</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#FDF3E1] border border-[#A05E03]/20"></div><span className="text-[#787774]">3-5</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#FAECEC] border border-[#973C38]/20"></div><span className="text-[#787774]">6-8</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#F4E0E0] border border-[#C93C37]/20"></div><span className="text-[#787774]">9+</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {campusZones.map((zone, idx) => (
                <motion.div
                  key={zone.name}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
                  className={`p-4 rounded-xl border flex flex-col justify-between aspect-[4/3] ${getZoneColor(zone.count)}`}
                >
                  <span className="font-medium text-sm leading-tight">{zone.name}</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-3xl font-semibold tracking-tight">{zone.count}</span>
                    <span className="text-xs opacity-80 mb-1 font-medium">issues</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Chart 6: Staff Performance (Full Width) */}
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 lg:col-span-2 overflow-x-auto">
            <h2 className="font-medium text-[#111111] mb-4">Staff Performance</h2>
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAEAEA]">
                  <th className="py-3 px-2 text-sm font-medium text-[#787774]">Staff Name</th>
                  <th className="py-3 px-2 text-sm font-medium text-[#787774]">Assigned</th>
                  <th className="py-3 px-2 text-sm font-medium text-[#787774]">Resolved</th>
                  <th className="py-3 px-2 text-sm font-medium text-[#787774]">Avg Time</th>
                  <th className="py-3 px-2 text-sm font-medium text-[#787774] w-48">Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {staffData.map((staff, i) => (
                  <tr key={i} className="border-b border-[#EAEAEA] last:border-0 hover:bg-[#F7F6F3] transition-colors">
                    <td className="py-3 px-2 text-sm text-[#111111] font-medium">{staff.name}</td>
                    <td className="py-3 px-2 text-sm text-[#787774]">{staff.assigned}</td>
                    <td className="py-3 px-2 text-sm text-[#787774]">{staff.resolved}</td>
                    <td className="py-3 px-2 text-sm text-[#787774]">{staff.avgTime}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all" 
                            style={{ 
                              width: `${staff.rate}%`,
                              backgroundColor: staff.rate >= 90 ? '#10B981' : staff.rate >= 80 ? '#3B82F6' : '#F59E0B'
                            }} 
                          />
                        </div>
                        <span className="text-xs text-[#787774] w-8">{staff.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
