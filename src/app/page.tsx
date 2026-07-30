'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { 
  TargetIcon, 
  LightningBoltIcon, 
  LockClosedIcon,
  MixerHorizontalIcon,
  UpdateIcon,
  CheckCircledIcon
} from '@radix-ui/react-icons';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Navigation */}
      <nav className="w-full px-6 py-6 border-b border-[#EAEAEA] bg-[#F7F6F3]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="font-semibold text-lg tracking-tight">Campus Solver</div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-[#787774] hover:text-[#111111] transition-colors">
              Login
            </Link>
            <Link href="/register" className="text-sm font-medium bg-[#111111] text-white px-4 py-2 rounded-md hover:bg-[#111111]/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 md:py-24">
        <motion.div 
          className="flex flex-col gap-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 flex flex-col gap-8">
              <h1 className="text-5xl md:text-6xl font-medium tracking-tighter leading-[1.1]">
                Campus complaints shouldn't disappear.
              </h1>
              <p className="text-lg md:text-xl text-[#787774] leading-relaxed max-w-2xl">
                AI-powered grievance tracking that ensures accountability, transparency, and resolution for every campus issue. Stop wondering if your report was seen.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/register" className="inline-flex items-center justify-center bg-[#111111] text-white h-12 px-8 rounded-md text-base font-medium hover:bg-[#111111]/90 transition-colors">
                  Submit a Complaint
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center bg-transparent border border-[#EAEAEA] text-[#111111] h-12 px-8 rounded-md text-base font-medium hover:bg-black/5 transition-colors">
                  Track Status
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Stats / Value Prop Row */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-[#EAEAEA]">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-8 w-8 rounded-md bg-[#EDF3EC] flex items-center justify-center shrink-0">
                <UpdateIcon className="w-4 h-4 text-[#111111]" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Real-time Tracking</h3>
                <p className="text-sm text-[#787774] leading-relaxed">Know exactly who is working on your issue and its current status at all times.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 h-8 w-8 rounded-md bg-[#E1F3FE] flex items-center justify-center shrink-0">
                <LightningBoltIcon className="w-4 h-4 text-[#111111]" />
              </div>
              <div>
                <h3 className="font-medium mb-1">AI Categorization</h3>
                <p className="text-sm text-[#787774] leading-relaxed">Complaints are instantly analyzed and routed to the correct department automatically.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 h-8 w-8 rounded-md bg-[#FBF3DB] flex items-center justify-center shrink-0">
                <TargetIcon className="w-4 h-4 text-[#111111]" />
              </div>
              <div>
                <h3 className="font-medium mb-1">SLA Enforcement</h3>
                <p className="text-sm text-[#787774] leading-relaxed">Automatic escalations when deadlines are missed to ensure swift resolution.</p>
              </div>
            </div>
          </motion.div>

          {/* Features Asymmetric Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              className="md:col-span-2 bg-white border border-[#EAEAEA] p-8 rounded-xl flex flex-col gap-4 group hover:-translate-y-0.5 hover:shadow-sm transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-[#F7F6F3] border border-[#EAEAEA] flex items-center justify-center mb-2">
                <MixerHorizontalIcon className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="text-xl font-medium tracking-tight">Intelligent Routing</h3>
              <p className="text-[#787774] leading-relaxed">
                Our AI engine reads the complaint description and instantly categorizes it, extracting key entities and assigning it to the exact personnel responsible, bypassing bureaucratic delays.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white border border-[#EAEAEA] p-8 rounded-xl flex flex-col gap-4 group hover:-translate-y-0.5 hover:shadow-sm transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-[#F7F6F3] border border-[#EAEAEA] flex items-center justify-center mb-2">
                <UpdateIcon className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="text-xl font-medium tracking-tight">Live Status Updates</h3>
              <p className="text-[#787774] leading-relaxed">
                Get real-time tracking from submission to resolution, complete with photo evidence.
              </p>
            </motion.div>

            <motion.div 
              className="md:col-span-3 bg-white border border-[#EAEAEA] p-8 rounded-xl flex flex-col md:flex-row gap-8 items-center justify-between group hover:-translate-y-0.5 hover:shadow-sm transition-all"
            >
              <div className="flex-1 flex flex-col gap-4">
                <div className="h-10 w-10 rounded-lg bg-[#F7F6F3] border border-[#EAEAEA] flex items-center justify-center mb-2">
                  <LockClosedIcon className="w-5 h-5 text-[#111111]" />
                </div>
                <h3 className="text-xl font-medium tracking-tight">Accountability Engine</h3>
                <p className="text-[#787774] leading-relaxed max-w-3xl">
                  Built-in SLA timers mean issues can't be ignored. If a complaint isn't addressed within the required timeframe, it automatically escalates to higher administration. Resolution requires mandatory proof.
                </p>
              </div>
              <div className="shrink-0">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EDF3EC] text-[#111111] rounded-full text-sm font-medium border border-[#EAEAEA]">
                  <CheckCircledIcon className="w-4 h-4" />
                  Resolution Guaranteed
                </div>
              </div>
            </motion.div>
          </motion.div>

        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#EAEAEA] py-8 bg-[#F7F6F3]">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#787774]">
          Built for VIT Bhopal | Summer Of Codesfest 2.0
        </div>
      </footer>
    </div>
  );
}
