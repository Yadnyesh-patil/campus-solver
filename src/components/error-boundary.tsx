'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ReloadIcon } from '@radix-ui/react-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-[#F7F6F3] flex flex-col items-center justify-center p-6 text-[#111111]">
          <div className="max-w-md w-full bg-white border border-[#EAEAEA] rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-[#FDEBEC] flex items-center justify-center mb-6 text-[#111111]">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-medium tracking-tight mb-2">Something went wrong</h1>
            <p className="text-[#787774] text-sm mb-8">
              We encountered an unexpected error. Please try again.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center justify-center bg-[#111111] text-white h-10 px-6 rounded-md text-sm font-medium hover:bg-[#111111]/90 transition-colors w-full"
            >
              <ReloadIcon className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
