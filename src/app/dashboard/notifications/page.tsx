"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { motion } from "motion/react";
import { BellIcon, UpdateIcon, ExclamationTriangleIcon, CheckCircledIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    const fetchNotifications = async () => {
      // For student, fetch logs for their complaints
      const { data: myComplaints } = await supabase.from('complaints').select('id, title').eq('student_id', user.id);
      
      if (!myComplaints || myComplaints.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      
      const complaintIds = myComplaints.map(c => c.id);
      
      const { data: logs } = await supabase.from('complaint_logs')
        .select('*')
        .in('complaint_id', complaintIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (logs) {
        const formatted = logs.map((log: any) => {
          const comp = myComplaints.find(c => c.id === log.complaint_id);
          let type = "update";
          if (log.action === 'escalation') type = "alert";
          if (log.action === 'assignment') type = "assignment";
          if (log.new_value === 'resolved' || log.new_value === 'closed') type = "success";
          if (log.action === 'comment') type = "comment";

          return {
            id: log.id,
            title: log.action.replace('_', ' ').toUpperCase(),
            message: log.new_value || log.comment || `Activity on complaint`,
            timestamp: new Date(log.created_at).toLocaleString(),
            read: true, // For demo, assuming read
            type,
            complaintId: log.complaint_id,
            complaintTitle: comp?.title || `C-${log.complaint_id.slice(0, 4).toUpperCase()}`
          };
        });
        setNotifications(formatted);
      }
      setLoading(false);
    };

    fetchNotifications();
    const channel = supabase.channel('student-notif-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaint_logs' }, fetchNotifications)
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(n => filter === "all" || !n.read);

  const handleMarkAsRead = (id: string, complaintId?: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (complaintId) {
      router.push(`/dashboard/complaint/${complaintId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "update": return <UpdateIcon className="w-5 h-5 text-[#D97706]" />;
      case "alert": return <ExclamationTriangleIcon className="w-5 h-5 text-[#E53935]" />;
      case "success": return <CheckCircledIcon className="w-5 h-5 text-[#16A34A]" />;
      case "comment": return <ChatBubbleIcon className="w-5 h-5 text-[#3B82F6]" />;
      case "assignment": return <BellIcon className="w-5 h-5 text-[#111111]" />;
      default: return <BellIcon className="w-5 h-5 text-[#111111]" />;
    }
  };

  return (
    <DashboardLayout role="student" userName={profile?.full_name || 'Student'} userEmail={profile?.email || ''}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-[#E1F3FE] text-[#3B82F6] px-2.5 py-0.5 rounded-full text-xs font-medium">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} className="text-sm font-medium text-[#787774] hover:text-[#111111] transition-colors">
            Mark all as read
          </button>
        </div>

        <div className="flex gap-2 border-b border-[#EAEAEA] pb-2">
          <button onClick={() => setFilter("all")} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "all" ? "bg-[#111111] text-[#F7F6F3]" : "text-[#787774] hover:bg-[#EAEAEA]"}`}>
            All
          </button>
          <button onClick={() => setFilter("unread")} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "unread" ? "bg-[#111111] text-[#F7F6F3]" : "text-[#787774] hover:bg-[#EAEAEA]"}`}>
            Unread
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-[#787774]">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-[#787774]">No notifications to show.</div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleMarkAsRead(notification.id, notification.complaintId)}
                className={`bg-white border rounded-xl p-4 flex gap-4 cursor-pointer transition-all hover:shadow-sm ${
                  !notification.read ? "border-l-4 border-l-[#3B82F6] border-y-[#EAEAEA] border-r-[#EAEAEA]" : "border-[#EAEAEA]"
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm font-medium ${!notification.read ? "text-[#111111]" : "text-[#787774]"}`}>
                      {notification.title} - {notification.complaintTitle}
                    </p>
                    <span className="text-xs text-[#787774] whitespace-nowrap ml-4">
                      {notification.timestamp}
                    </span>
                  </div>
                  <p className={`text-sm ${!notification.read ? "text-[#111111]" : "text-[#787774]"}`}>
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <div className="flex-shrink-0 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
