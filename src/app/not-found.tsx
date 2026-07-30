import Link from 'next/link';
import { ArrowLeftIcon } from '@radix-ui/react-icons';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-[#F7F6F3] flex flex-col items-center justify-center p-6 text-[#111111]">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-8xl font-bold tracking-tighter">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Page not found</h2>
          <p className="text-gray-500">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="pt-8">
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#111111] text-[#F7F6F3] font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
