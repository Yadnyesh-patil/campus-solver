'use client';

import React from 'react';
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

const categoryData = [
  { name: 'Hostel', count: 15 },
  { name: 'Electricity', count: 12 },
  { name: 'Internet', count: 10 },
  { name: 'Water', count: 8 },
  { name: 'Mess', count: 5 },
  { name: 'Other', count: 4 },
  { name: 'Classroom', count: 3 },
  { name: 'Security', count: 2 },
];

const departmentData = [
  { name: 'Hostel', hours: 12 },
  { name: 'Electrical', hours: 8 },
  { name: 'IT/Network', hours: 24 },
  { name: 'Water', hours: 6 },
  { name: 'Mess', hours: 4 },
];

const timeData = [
  { day: 'Mon', count: 5 },
  { day: 'Tue', count: 8 },
  { day: 'Wed', count: 12 },
  { day: 'Thu', count: 7 },
  { day: 'Fri', count: 15 },
  { day: 'Sat', count: 3 },
  { day: 'Sun', count: 2 },
];

const statusData = [
  { name: 'Submitted', value: 15, color: '#FCA5A5' }, 
  { name: 'Verified', value: 10, color: '#93C5FD' },
  { name: 'Assigned', value: 20, color: '#FDE047' },
  { name: 'In Progress', value: 25, color: '#86EFAC' },
  { name: 'Resolved', value: 25, color: '#6EE7B7' },
  { name: 'Closed', value: 5, color: '#D1D5DB' },
];

const heatmapBuildings = ['Hostel A', 'Hostel B', 'Academic Block A', 'Academic Block B', 'Library', 'Sports Complex'];
const heatmapCategories = ['Electricity', 'Water', 'Internet', 'Hostel', 'Mess'];
const heatmapData = heatmapBuildings.map(building => ({
  building,
  ...heatmapCategories.reduce((acc, cat) => ({ ...acc, [cat]: Math.floor(Math.random() * 15) }), {})
}));

const staffData = [
  { name: 'Amit Sharma', assigned: 45, resolved: 42, avgTime: '4h', rate: 93 },
  { name: 'Priya Patel', assigned: 38, resolved: 35, avgTime: '6h', rate: 92 },
  { name: 'Rahul Kumar', assigned: 52, resolved: 40, avgTime: '12h', rate: 77 },
  { name: 'Neha Singh', assigned: 29, resolved: 28, avgTime: '3h', rate: 96 },
  { name: 'Vikram Reddy', assigned: 61, resolved: 50, avgTime: '18h', rate: 82 },
];

const peakHoursData = [
  { hour: '6AM', count: 2 },
  { hour: '8AM', count: 15 },
  { hour: '10AM', count: 22 },
  { hour: '12PM', count: 8 },
  { hour: '2PM', count: 12 },
  { hour: '4PM', count: 10 },
  { hour: '6PM', count: 18 },
  { hour: '8PM', count: 25 },
  { hour: '10PM', count: 5 },
];

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
  return (
    <DashboardLayout role="admin" userName="Dr. Rajesh Kumar" userEmail="admin@campus.edu">
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

          {/* Chart 5: Heatmap (Full Width) */}
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 lg:col-span-2 overflow-x-auto">
            <h2 className="font-medium text-[#111111] mb-4">Campus Complaint Heatmap</h2>
            <div className="min-w-[600px]">
              <div className="grid grid-cols-6 gap-1 mb-2">
                <div className="text-xs font-medium text-[#787774]">Building</div>
                {heatmapCategories.map(cat => (
                  <div key={cat} className="text-xs font-medium text-[#787774] text-center">{cat}</div>
                ))}
              </div>
              {heatmapData.map((row, i) => (
                <div key={i} className="grid grid-cols-6 gap-1 mb-1 items-center">
                  <div className="text-sm text-[#111111] truncate pr-2">{row.building}</div>
                  {heatmapCategories.map(cat => {
                    const val = (row as any)[cat];
                    const intensity = val / 15;
                    return (
                      <div 
                        key={cat} 
                        className="h-10 rounded flex items-center justify-center text-xs font-medium transition-colors"
                        style={{ 
                          backgroundColor: `rgba(37, 99, 235, ${intensity * 0.8 + 0.05})`,
                          color: intensity > 0.5 ? '#FFFFFF' : '#111111'
                        }}
                      >
                        {val}
                      </div>
                    );
                  })}
                </div>
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
