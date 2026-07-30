'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { PersonIcon, IdCardIcon, AvatarIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

type Role = 'student' | 'staff' | 'admin';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);

    // Demo mode: navigate to the appropriate dashboard based on role
    const roleRoutes: Record<Role, string> = {
      student: '/dashboard',
      staff: '/staff',
      admin: '/admin',
    };

    const roleNames: Record<Role, string> = {
      student: 'Rahul Sharma',
      staff: 'Ram Kumar',
      admin: 'Dr. Rajesh Kumar',
    };

    setTimeout(() => {
      toast.success(`Welcome back, ${roleNames[role]}!`, {
        description: `Signed in as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      });
      router.push(roleRoutes[role]);
    }, 600);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#F7F6F3] p-6">
      <Link href="/" className="mb-8 font-semibold text-xl tracking-tight text-[#111111]">
        Campus Solver
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-[#EAEAEA] rounded-xl p-8 shadow-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-tight mb-2">Welcome back</h1>
          <p className="text-[#787774] text-sm">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-[#111111]">Select Role</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex flex-col items-center justify-center gap-2 p-3 border rounded-lg transition-colors text-sm ${
                  role === 'student' 
                    ? 'border-[#111111] bg-[#111111] text-white' 
                    : 'border-[#EAEAEA] bg-white text-[#787774] hover:border-[#111111]/30'
                }`}
              >
                <PersonIcon className="w-5 h-5" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`flex flex-col items-center justify-center gap-2 p-3 border rounded-lg transition-colors text-sm ${
                  role === 'staff' 
                    ? 'border-[#111111] bg-[#111111] text-white' 
                    : 'border-[#EAEAEA] bg-white text-[#787774] hover:border-[#111111]/30'
                }`}
              >
                <IdCardIcon className="w-5 h-5" />
                <span>Staff</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex flex-col items-center justify-center gap-2 p-3 border rounded-lg transition-colors text-sm ${
                  role === 'admin' 
                    ? 'border-[#111111] bg-[#111111] text-white' 
                    : 'border-[#EAEAEA] bg-white text-[#787774] hover:border-[#111111]/30'
                }`}
              >
                <AvatarIcon className="w-5 h-5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-[#111111]">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@vitbhopal.ac.in"
                className="h-10 px-3 rounded-md border border-[#EAEAEA] bg-white text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-[#111111]">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 px-3 rounded-md border border-[#EAEAEA] bg-white text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="h-10 mt-2 w-full bg-[#111111] text-white rounded-md text-sm font-medium hover:bg-[#111111]/90 transition-colors flex items-center justify-center disabled:opacity-60"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-[#787774]">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#111111] hover:underline font-medium">
            Register
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
