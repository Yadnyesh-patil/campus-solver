'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircledIcon, 
  FileTextIcon, 
  PersonIcon, 
  UpdateIcon, 
  ExclamationTriangleIcon, 
  ChatBubbleIcon, 
  LockClosedIcon,
  CheckIcon,
  Link2Icon
} from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

export type TimelineIconType = 'submitted' | 'verified' | 'assigned' | 'progress' | 'resolved' | 'escalated' | 'comment' | 'closed';

export type TimelineEntry = {
  id: string;
  action: string;
  user: { name: string; role?: string };
  timestamp: string;
  iconType: TimelineIconType;
  comment?: string;
  attachments?: { name: string; url: string; type?: string }[];
};

interface StatusTimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

const getIconForType = (type: TimelineIconType) => {
  switch (type) {
    case 'submitted': return <FileTextIcon className="h-4 w-4 text-blue-500" />;
    case 'verified': return <CheckCircledIcon className="h-4 w-4 text-emerald-500" />;
    case 'assigned': return <PersonIcon className="h-4 w-4 text-indigo-500" />;
    case 'progress': return <UpdateIcon className="h-4 w-4 text-amber-500" />;
    case 'resolved': return <CheckIcon className="h-4 w-4 text-emerald-500" />;
    case 'escalated': return <ExclamationTriangleIcon className="h-4 w-4 text-rose-500" />;
    case 'comment': return <ChatBubbleIcon className="h-4 w-4 text-gray-500" />;
    case 'closed': return <LockClosedIcon className="h-4 w-4 text-gray-500" />;
    default: return <FileTextIcon className="h-4 w-4 text-gray-500" />;
  }
};

const getBgForType = (type: TimelineIconType) => {
  switch (type) {
    case 'submitted': return 'bg-blue-50 border-blue-100';
    case 'verified': return 'bg-emerald-50 border-emerald-100';
    case 'assigned': return 'bg-indigo-50 border-indigo-100';
    case 'progress': return 'bg-amber-50 border-amber-100';
    case 'resolved': return 'bg-emerald-50 border-emerald-100';
    case 'escalated': return 'bg-rose-50 border-rose-100';
    case 'comment': return 'bg-gray-50 border-gray-100';
    case 'closed': return 'bg-gray-50 border-gray-100';
    default: return 'bg-gray-50 border-gray-100';
  }
};

export function StatusTimeline({ entries, className }: StatusTimelineProps) {
  return (
    <div className={cn("space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#EAEAEA] before:to-transparent", className)}>
      {entries.map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-[#F7F6F3] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            <div className={cn("flex items-center justify-center w-8 h-8 rounded-full border", getBgForType(entry.iconType))}>
              {getIconForType(entry.iconType)}
            </div>
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[#EAEAEA] bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
              <span className="font-medium text-sm text-[#111111]">{entry.action}</span>
              <span className="text-xs text-[#787774] font-mono">{entry.timestamp}</span>
            </div>
            <div className="text-xs text-[#787774] flex items-center gap-1.5 mb-2">
              <PersonIcon className="w-3 h-3" />
              <span>{entry.user.name}</span>
              {entry.user.role && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#EAEAEA]" />
                  <span>{entry.user.role}</span>
                </>
              )}
            </div>
            
            {entry.comment && (
              <div className="mt-3 text-sm text-[#111111] bg-[#F7F6F3] p-3 rounded-lg border border-[#EAEAEA]">
                {entry.comment}
              </div>
            )}

            {entry.attachments && entry.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.attachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-[#111111] bg-white border border-[#EAEAEA] px-2.5 py-1.5 rounded-md hover:bg-[#F7F6F3] transition-colors cursor-pointer">
                    <Link2Icon className="w-3 h-3 text-[#787774]" />
                    <span className="truncate max-w-[120px]">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
