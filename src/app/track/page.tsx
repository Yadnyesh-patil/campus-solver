'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { MagnifyingGlassIcon, ArrowLeftIcon, CubeIcon } from '@radix-ui/react-icons';
import { StatusTimeline, TimelineEntry } from '@/components/status-timeline';
import { createClient } from '@/lib/supabase/client';
// Assuming SlaTimer exists as requested in instructions
// import { SlaTimer } from '@/components/sla-timer';

export default function TrackComplaintPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<'idle' | 'found' | 'not-found'>('idle');
  const [complaint, setComplaint] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResult('idle');

    const supabase = createClient();
    const query = searchQuery.trim().toUpperCase();
    let foundComplaint = null;

    // Try exact UUID match
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
    
    // Check if it's a short ID like CMP-7F81
    const isShortID = query.startsWith('CMP-');

    if (isUUID) {
      const { data } = await supabase.from('complaints').select('*').eq('id', query.toLowerCase()).single();
      if (data) foundComplaint = data;
    } else if (isShortID) {
      const shortIdHash = query.replace('CMP-', '').toLowerCase();
      // Fetch recent complaints and filter in memory since we can't ilike UUIDs directly via postgrest
      const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(1000);
      if (data) {
        foundComplaint = data.find((c: any) => c.id.toLowerCase().startsWith(shortIdHash)) || null;
      }
    } else {
      const { data: searchResults } = await supabase.from('complaints').select('*').ilike('title', `%${query}%`).limit(1);
      foundComplaint = searchResults?.[0] || null;
    }

    if (foundComplaint) {
      const { data: logs } = await supabase.from('complaint_logs').select('*, user:profiles!user_id(full_name, role)').eq('complaint_id', foundComplaint.id).order('created_at');
      
      const tl: TimelineEntry[] = (logs || []).map((log: any) => {
        let iconType = 'progress';
        if (log.action === 'status_change') {
          if (log.new_value === 'verified') iconType = 'verified';
          else if (log.new_value === 'assigned') iconType = 'assigned';
          else if (log.new_value === 'resolved' || log.new_value === 'closed') iconType = 'completed';
        } else if (log.action === 'comment') {
          iconType = 'progress'; // or whatever you like
        }
        
        const actionStr = log.action === 'status_change' ? `Status updated to ${log.new_value}` : 'Comment added';
        return {
          id: log.id,
          action: actionStr,
          user: { name: log.user?.full_name || 'System', role: log.user?.role || 'System' },
          timestamp: new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
          iconType: iconType as any,
          comment: log.comment
        };
      });

      // Add submission entry
      tl.unshift({
        id: `sub-${foundComplaint.id}`,
        action: 'Complaint Logged',
        user: { name: 'Student', role: 'Student' },
        timestamp: new Date(foundComplaint.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
        iconType: 'submitted' as any,
      });

      setComplaint(foundComplaint);
      setTimeline(tl);
      setSearchResult('found');
    } else {
      setSearchResult('not-found');
    }
    setIsSearching(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'medium': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'high': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'urgent': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans text-[#111111] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#EAEAEA] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#111111] hover:opacity-80 transition-opacity">
            <CubeIcon className="w-6 h-6" />
            <span className="font-semibold tracking-tight text-lg">Campus Solver</span>
          </Link>
          <div className="text-sm font-medium text-[#787774]">
            Public Tracking
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#787774] hover:text-[#111111] transition-colors mb-8 self-start w-fit">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3">Track Your Complaint</h1>
          <p className="text-[#787774] max-w-md mx-auto">
            Enter your complaint ID below to check the real-time status and timeline of your request.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl w-full mx-auto mb-12 relative">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-[#787774] group-focus-within:text-[#111111] transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-32 py-4 border border-[#EAEAEA] rounded-2xl leading-5 bg-white placeholder-[#787774] focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-[#111111] transition-all shadow-sm text-lg uppercase"
              placeholder="e.g. CMP-2026-0892"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-1.5 right-1.5 flex items-center">
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-[#111111] hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-50 h-full"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Results Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {searchResult === 'not-found' && (
              <motion.div
                key="not-found"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-16 bg-white rounded-2xl border border-[#EAEAEA] shadow-sm"
              >
                <div className="w-16 h-16 bg-[#F7F6F3] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#EAEAEA]">
                  <MagnifyingGlassIcon className="h-8 w-8 text-[#787774]" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-[#111111]">Complaint Not Found</h3>
                <p className="text-[#787774] max-w-sm mx-auto">
                  We couldn't find a complaint with ID <span className="font-mono text-[#111111] bg-[#F7F6F3] px-1.5 py-0.5 rounded">{searchQuery.toUpperCase()}</span>. 
                  Please check the ID and try again.
                </p>
              </motion.div>
            )}

            {searchResult === 'found' && (
              <motion.div
                key="found"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl border border-[#EAEAEA] shadow-sm overflow-hidden"
              >
                {/* Header Section */}
                <div className="p-6 md:p-8 border-b border-[#EAEAEA]">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#111111]">
                          {complaint?.id}
                        </h2>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusColor(complaint?.status || '')} uppercase tracking-wider`}>
                          {formatStatus(complaint?.status || '')}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getPriorityColor(complaint?.priority || '')} uppercase tracking-wider hidden sm:inline-block`}>
                          {complaint?.priority} Priority
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-[#111111] mb-2">{complaint?.title}</h3>
                      <p className="text-[#787774] text-sm leading-relaxed max-w-2xl">
                        {complaint?.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#F7F6F3]">
                    <div>
                      <p className="text-xs text-[#787774] mb-1 uppercase tracking-wider font-semibold">Category</p>
                      <p className="text-sm font-medium">{complaint?.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#787774] mb-1 uppercase tracking-wider font-semibold">Location</p>
                      <p className="text-sm font-medium">{complaint?.building}, Room {complaint?.room_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#787774] mb-1 uppercase tracking-wider font-semibold">Created On</p>
                      <p className="text-sm font-medium font-mono text-[#111111]">
                        {complaint?.created_at ? new Date(complaint.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#787774] mb-1 uppercase tracking-wider font-semibold">Last Updated</p>
                      <p className="text-sm font-medium font-mono text-[#111111]">
                        {complaint?.updated_at ? new Date(complaint.updated_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline Section */}
                <div className="p-6 md:p-8 bg-[#F7F6F3]/50">
                  <h4 className="text-lg font-semibold mb-8 text-[#111111]">Status Timeline</h4>
                  <StatusTimeline entries={timeline} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
