"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <>
      <style suppressHydrationWarning>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
      <div
        className={cn(
          "relative overflow-hidden bg-[#EAEAEA] rounded-md",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#F7F6F3]/80 to-transparent animate-shimmer" />
      </div>
    </>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 border border-[#EAEAEA] rounded-xl bg-white", className)}>
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-1/4 mb-6" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("border border-[#EAEAEA] rounded-xl overflow-hidden bg-white", className)}>
      <div className="border-b border-[#EAEAEA] p-4 bg-[#F7F6F3]">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-[#EAEAEA] last:border-0 flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-10 rounded-full", className)} />;
}
