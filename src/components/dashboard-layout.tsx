'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import {
  HamburgerMenuIcon,
  Cross2Icon,
  DashboardIcon,
  PlusIcon,
  ListBulletIcon,
  BellIcon,
  AvatarIcon,
  ExitIcon,
  BarChartIcon,
  PersonIcon,
  LayersIcon,
  MixerVerticalIcon,
} from '@radix-ui/react-icons'
import { NotificationCenter } from '@/components/notification-center'
import { RealtimeIndicator } from '@/components/realtime-indicator'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'student' | 'staff' | 'admin'
  userName: string
  userEmail: string
}

type NavItem = {
  name: string
  href: string
  icon: React.ElementType
}

export function DashboardLayout({ children, role, userName, userEmail }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  const navLinks: Record<'student' | 'staff' | 'admin', NavItem[]> = {
    student: [
      { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
      { name: 'Submit Complaint', href: '/dashboard/submit', icon: PlusIcon },
      { name: 'Voice Complaint', href: '/dashboard/voice-submit', icon: MixerVerticalIcon },
      { name: 'My Complaints', href: '/dashboard/complaints', icon: ListBulletIcon },
      { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon },
    ],
    staff: [
      { name: 'Dashboard', href: '/staff', icon: DashboardIcon },
      { name: 'Assigned Complaints', href: '/staff?tab=assigned', icon: ListBulletIcon },
      { name: 'Notifications', href: '/staff/notifications', icon: BellIcon },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin', icon: DashboardIcon },
      { name: 'All Complaints', href: '/admin/complaints', icon: LayersIcon },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChartIcon },
      { name: 'Manage Staff', href: '/admin/staff', icon: PersonIcon },
      { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },
    ],
  }

  const links = navLinks[role]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-[#EAEAEA]">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center text-white font-bold text-sm">
          CS
        </div>
        <span className="font-semibold text-[#111111] text-lg tracking-tight">Campus Solver</span>
      </div>
      <div className="px-6 pb-4 flex items-center gap-3">
        <RealtimeIndicator />
        <div className="flex-1" />
        <NotificationCenter />
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-[#F7F6F3] text-[#111111]'
                  : 'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#EAEAEA]">
        <button
          onClick={() => {
            toast.success('Profile', {
              description: `${userName} (${role}) — ${userEmail}`,
            })
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F7F6F3] transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-[#F7F6F3] flex items-center justify-center border border-[#EAEAEA]">
            <AvatarIcon className="w-5 h-5 text-[#787774]" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-[#111111] truncate">{userName}</p>
            <div className="flex flex-col">
               <p className="text-xs text-[#787774] truncate">{userEmail}</p>
               <span className="text-[10px] uppercase font-bold text-[#787774] mt-0.5 tracking-wider">{role}</span>
            </div>
          </div>
        </button>
        <button
          onClick={() => {
            toast.success('Signed out successfully')
            setTimeout(() => router.push('/login'), 800)
          }}
          className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#787774] hover:bg-[#FDEBEC] hover:text-red-600 transition-colors"
        >
          <ExitIcon className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-[100dvh] bg-[#F7F6F3] flex font-sans text-[#111111]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#EAEAEA] z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
           <div className="w-7 h-7 rounded-md bg-[#111111] flex items-center justify-center text-white font-bold text-xs">
            CS
          </div>
          <span className="font-semibold text-[#111111]">Campus Solver</span>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeIndicator />
          <NotificationCenter align="right" />
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-[#787774] hover:text-[#111111]"
          >
            <HamburgerMenuIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-[#111111]/20 z-30 md:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-white z-40 md:hidden"
            >
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-[#787774] hover:text-[#111111]"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-[100dvh]">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
