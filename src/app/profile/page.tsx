"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { user, profile, role, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <DashboardLayout role={role as any} userName={profile.full_name || 'User'} userEmail={profile.email || ''}>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">Profile Details</h1>
        
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-6 space-y-4 shadow-sm">
          <div>
            <label className="text-sm text-[#787774] font-medium">Full Name</label>
            <p className="text-[#111111] text-lg mt-1">{profile.full_name}</p>
          </div>
          
          <div>
            <label className="text-sm text-[#787774] font-medium">Email Address</label>
            <p className="text-[#111111] text-lg mt-1">{profile.email}</p>
          </div>
          
          <div>
            <label className="text-sm text-[#787774] font-medium">Role</label>
            <p className="text-[#111111] text-lg mt-1 capitalize">{profile.role}</p>
          </div>
          
          {profile.department && (
            <div>
              <label className="text-sm text-[#787774] font-medium">Department</label>
              <p className="text-[#111111] text-lg mt-1">{profile.department}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
