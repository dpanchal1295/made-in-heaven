'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function PlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error exclusively to server/console, never display raw stack traces to users
    console.error('[PlanError Boundary caught error]:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-[#FCFBF8]">
      <div className="max-w-md w-full bg-white border border-[#E4DED6] p-8 text-center space-y-6 shadow-xs">
        <div className="w-12 h-12 mx-auto bg-[#F5EFEB] border border-[#E4DED6] flex items-center justify-center text-[#94512F]">
          <AlertCircle className="w-6 h-6" strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <span className="font-micro text-[10px] uppercase tracking-[0.2em] text-[#94512F] font-bold block">
            CELEBRATION PLAN
          </span>
          <h2 className="font-serif text-2xl font-normal text-[#2A2521]">
            Something went wrong loading your plan
          </h2>
          <p className="text-xs sm:text-sm text-[#6B645E] leading-relaxed font-sans">
            Maya encountered a momentary issue displaying your celebration plan. Your saved details and preferences are safe.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            type="button"
            variant="primary"
            onClick={() => reset()}
            className="flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try again</span>
          </Button>

          <Link href="/chat" className="inline-flex">
            <Button type="button" variant="outline">
              <span>Back to Maya Chat</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
