'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { PersonIcon, IdCardIcon, AvatarIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

type Role = 'student' | 'staff' | 'admin';

const DEPARTMENTS = [
  'Hostel Management',
  'Electrical Maintenance',
  'Water Supply',
  'IT/Network',
  'Transport',
  'Mess/Canteen',
  'Library',
  'Classroom Maintenance',
  'Medical',
  'Security',
  'General Administration'
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('student');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (role === 'staff' && !formData.department) {
      toast.error('Please select a department');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role,
            department: formData.department || null,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('rate limit')) {
          toast.error('Too many signups — please wait a few minutes and try again', {
            description: 'Supabase limits confirmation emails. Try again shortly.',
            duration: 8000,
          });
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      // If email confirmation is disabled, user session exists — go straight to dashboard
      if (data?.session) {
        const roleRoutes: Record<string, string> = {
          student: '/dashboard',
          staff: '/staff',
          admin: '/admin',
        };
        toast.success(`Welcome, ${formData.fullName}!`, {
          description: `Signed in as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        });
        router.push(roleRoutes[role] || '/dashboard');
      } else {
        // Email confirmation required — redirect to login
        toast.success('Account created! Please check your email to confirm, then sign in.', {
          duration: 6000,
        });
        router.push('/login');
      }
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#F7F6F3] p-6 py-12">
      <Link href="/" className="mb-8 font-semibold text-xl tracking-tight text-[#111111]">
        Campus Solver
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-[#EAEAEA] rounded-xl p-8 shadow-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-tight mb-2">Create an account</h1>
          <p className="text-[#787774] text-sm">Join to submit or manage campus complaints</p>
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
              <label htmlFor="fullName" className="text-sm font-medium text-[#111111]">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="h-10 px-3 rounded-md border border-[#EAEAEA] bg-white text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-[#111111]">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@vitbhopal.ac.in"
                className="h-10 px-3 rounded-md border border-[#EAEAEA] bg-white text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors"
                required
              />
            </div>

            {role === 'staff' && (
              <div className="flex flex-col gap-2">
                <label htmlFor="department" className="text-sm font-medium text-[#111111]">Department</label>
                <div className="relative">
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="h-10 w-full px-3 pr-10 rounded-md border border-[#EAEAEA] bg-white text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors appearance-none"
                    required={role === 'staff'}
                  >
                    <option value="" disabled>Select department</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774] pointer-events-none" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium text-[#111111]">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="h-10 px-3 rounded-md border border-[#EAEAEA] bg-white text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-[#111111]">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="h-10 px-3 rounded-md border border-[#EAEAEA] bg-white text-[#111111] text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="h-10 mt-2 w-full bg-[#111111] text-white rounded-md text-sm font-medium hover:bg-[#111111]/90 transition-colors flex items-center justify-center disabled:opacity-60"
          >
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-[#787774]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#111111] hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
