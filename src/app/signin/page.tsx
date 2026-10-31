'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Logo } from '@/components/common/Logo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowLeft, User } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signInWithGoogle, continueAsGuest } = useAuth();

  const redirectUrl = searchParams.get('redirect') || searchParams.get('next') || '/start';
  const typeParam = searchParams.get('type');

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (redirectUrl.startsWith('/invites/')) {
        router.replace(redirectUrl);
      } else if (user.homeId) {
        router.replace('/home');
      } else {
        const dest = typeParam ? `${redirectUrl}?type=${typeParam}` : redirectUrl;
        router.replace(dest);
      }
    }
  }, [user, redirectUrl, typeParam, router]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoadingGoogle(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setError(res.error || 'Failed to sign in with Google');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    setLoadingGuest(true);
    try {
      const res = await continueAsGuest();
      if (!res.success) {
        setError(res.error || 'Failed to start guest session');
      }
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FCFBF8] flex flex-col justify-center items-center py-12 px-4 sm:px-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Logo href="/welcome" size="lg" className="justify-center" />
          <p className="font-micro text-xs text-[#6B645E] uppercase tracking-[0.15em] pt-1">
            SIGN IN TO PLAN TOGETHER WITH MAYA
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs leading-relaxed"
          >
            {error}
          </div>
        )}

        {/* Main Sign In Card */}
        <Card className="border border-[#E4DED6] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <CardHeader className="p-0 space-y-1.5 text-center">
            <CardTitle className="font-serif text-2xl text-[#2A2521] font-normal">
              Begin your celebration
            </CardTitle>
            <CardDescription className="text-xs text-[#6B645E]">
              Plan an Indian wedding, milestone birthday, or community festival.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            {/* Google Sign In Button */}
            <button
              type="button"
              disabled={loadingGoogle || loadingGuest}
              onClick={handleGoogleSignIn}
              className="w-full inline-flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-[#F9F7F4] border border-[#E4DED6] hover:border-[#2A2521] text-[#2A2521] text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#94512F] focus:ring-offset-1"
            >
              <svg className="w-4 h-4 shrink-0 inline-block align-middle" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="whitespace-nowrap">{loadingGoogle ? 'Signing in with Google...' : 'Continue with Google'}</span>
            </button>

            {/* Subtle Divider */}
            <div className="relative py-1 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E4DED6]" />
              </div>
              <span className="relative px-3 bg-white text-[10px] font-micro uppercase tracking-wider text-[#A39B94]">
                OR
              </span>
            </div>

            {/* Continue as Guest Button */}
            <button
              type="button"
              disabled={loadingGoogle || loadingGuest}
              onClick={handleGuestSignIn}
              className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 bg-white hover:bg-[#F9F7F4] border border-[#E4DED6] hover:border-[#2A2521] text-[#2A2521] text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#94512F] focus:ring-offset-1"
            >
              <User className="w-4 h-4 text-[#94512F] shrink-0 inline-block align-middle" strokeWidth={1.75} />
              <span className="whitespace-nowrap">{loadingGuest ? 'Creating guest session...' : 'Continue as guest'}</span>
            </button>

            {/* Exact Approved Guest Privacy Note */}
            <p className="text-[11px] sm:text-[12px] text-[#6B645E] leading-relaxed pt-2 text-center">
              Guest plans are saved on this browser only. Sign in with Google to keep them across devices.
            </p>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-1.5 text-xs text-[#8E4A00] hover:text-[#2A2521] tracking-wider uppercase font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FCFBF8] flex items-center justify-center">
          <span className="font-micro text-xs uppercase tracking-widest text-[#8E4A00]">
            Loading Made in Heaven...
          </span>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
