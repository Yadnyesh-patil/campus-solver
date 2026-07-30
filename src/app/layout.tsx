import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/error-boundary';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Campus Solver | AI-Powered Grievance Management',
  description: 'AI-powered grievance tracking that ensures accountability, transparency, and resolution for every campus issue.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F7F6F3',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F7F6F3] text-[#111111] min-h-[100dvh] font-sans`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: 'white',
            color: '#111111',
            border: '1px solid #EAEAEA',
            borderRadius: '8px',
          },
        }} />
      </body>
    </html>
  );
}
