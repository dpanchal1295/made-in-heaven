'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Logo } from '@/components/common/Logo';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Users, AlertCircle, ArrowRight, Check, User, Globe, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/utils/i18n';
import { IndianLanguage } from '@/types/firestore';
import { getRoleLabel } from '@/lib/utils/roles';

interface InviteData {
  token: string;
  homeId: string;
  homeName: string;
  eventType: string;
  permission: string;
  inviterName: string;
  expiresAt: number;
}

function InviteContent() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { user, signInWithGoogle, continueAsGuest, refreshSession } = useAuth();

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state for joining
  const [displayName, setDisplayName] = useState('');
  const [relationship, setRelationship] = useState('Family / Friend');
  const [preferredLanguage, setPreferredLanguage] = useState<IndianLanguage>('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // 1. Fetch Invite Details
  useEffect(() => {
    let isMounted = true;
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        if (!isMounted) return;

        if (data.success && data.invite) {
          setInviteData(data.invite);
        } else {
          setErrorMessage(data.error || 'This invite link is invalid or has expired.');
        }
      } catch (err) {
        console.error('Failed to load invite:', err);
        if (isMounted) {
          setErrorMessage('Unable to load invite details. Please check your internet connection and try again.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchInvite();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Sync user display name if authenticated
  useEffect(() => {
    if (user?.name && !displayName) {
      setDisplayName(user.name);
    }
  }, [user, displayName]);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setErrorMessage(null);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to sign in with Google');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Guest Sign-In
  const handleGuestSignIn = async () => {
    setAuthLoading(true);
    setErrorMessage(null);
    try {
      const res = await continueAsGuest(displayName.trim() || 'Guest');
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to start guest session');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Final Accept & Join
  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('Please enter your name so the family knows who is joining.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName.trim(),
          relationship: relationship.trim() || 'Family',
          preferredLanguage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshSession();
        router.replace('/home');
      } else {
        setErrorMessage(data.error || 'Failed to accept invitation.');
      }
    } catch (err) {
      console.error('Error accepting invite:', err);
      setErrorMessage('Network error accepting invite. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFBF8] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Logo size="md" />
          <p className="font-micro text-xs uppercase tracking-[0.2em] text-[#6B645E]">
            Checking celebration invite...
          </p>
        </div>
      </div>
    );
  }

  // Error State: Invalid or Expired Token
  if (errorMessage && !inviteData) {
    return (
      <div className="min-h-screen bg-[#FCFBF8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#E4DED6] p-8 text-center space-y-6 shadow-xs">
          <div className="w-12 h-12 mx-auto bg-[#F5EFEB] border border-[#E4DED6] flex items-center justify-center text-[#94512F]">
            <AlertCircle className="w-6 h-6" strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <span className="font-micro text-[10px] uppercase tracking-[0.2em] text-[#94512F] font-bold block">
              INVITE LINK
            </span>
            <h1 className="font-serif text-2xl font-normal text-[#2A2521]">
              Invite Link Expired or Invalid
            </h1>
            <p className="text-xs sm:text-sm text-[#6B645E] leading-relaxed font-sans">
              {errorMessage}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              type="button"
              variant="primary"
              onClick={() => router.push('/welcome')}
              className="flex items-center justify-center gap-2"
            >
              <span>Explore Made in Heaven</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/start')}
            >
              <span>Join with code</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const roleLabel = getRoleLabel((inviteData?.permission as any) || 'voter', inviteData?.eventType);

  return (
    <div className="min-h-screen bg-[#FCFBF8] flex flex-col justify-between p-4 sm:p-8">
      <header className="max-w-xl mx-auto w-full pt-4 pb-8 flex items-center justify-center">
        <Logo size="md" />
      </header>

      <main className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
        <Card className="border border-[#E4DED6] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Header Banner */}
          <div className="text-center space-y-2 border-b border-[#E4DED6] pb-6">
            <span className="font-micro text-[10px] uppercase tracking-[0.2em] text-[#94512F] font-bold block">
              YOU ARE INVITED
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521]">
              {inviteData?.homeName}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B645E] leading-relaxed font-sans">
              <strong className="text-[#2A2521] font-medium">{inviteData?.inviterName}</strong> invited you to join the celebration circle as a{' '}
              <span className="font-medium text-[#94512F] underline underline-offset-2">{roleLabel}</span>.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#F5EFEB] border border-[#E4DED6] text-xs text-[#94512F] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Sign in if not authenticated */}
          {!user ? (
            <div className="space-y-4">
              <div className="space-y-1 text-center">
                <span className="font-micro text-[10px] uppercase tracking-[0.16em] text-[#6B645E]">
                  STEP 1 OF 2
                </span>
                <h3 className="font-serif text-lg font-medium text-[#2A2521]">
                  Sign in to join
                </h3>
                <p className="text-xs text-[#6B645E]">
                  Choose how you want to access this celebration on your device.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 border-[#2A2521] text-[#2A2521] hover:bg-[#F5EFEB]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>{authLoading ? 'Signing in...' : 'Sign in with Google'}</span>
                </Button>

                <div className="relative flex py-1 items-center">
                  <div className="grow border-t border-[#E4DED6]" />
                  <span className="shrink mx-3 text-[10px] uppercase font-micro tracking-widest text-[#6B645E]">
                    OR
                  </span>
                  <div className="grow border-t border-[#E4DED6]" />
                </div>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleGuestSignIn}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 py-3"
                >
                  <User className="w-4 h-4" />
                  <span>{authLoading ? 'Starting session...' : 'Continue as Guest'}</span>
                </Button>
              </div>

              <p className="text-[11px] text-[#6B645E] text-center leading-relaxed pt-2">
                Guest plans are saved on this browser only. Sign in with Google to keep them across devices.
              </p>
            </div>
          ) : (
            /* Step 2: Name & Language preference form */
            <form onSubmit={handleAcceptInvite} className="space-y-5">
              <div className="space-y-1 text-center">
                <span className="font-micro text-[10px] uppercase tracking-[0.16em] text-[#6B645E]">
                  STEP 2 OF 2
                </span>
                <h3 className="font-serif text-lg font-medium text-[#2A2521]">
                  Personalize your profile
                </h3>
                <p className="text-xs text-[#6B645E]">
                  Tell the family who you are and select your preferred language.
                </p>
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label htmlFor="display-name" className="font-micro text-[11px] uppercase tracking-[0.15em] text-[#2A2521] font-semibold block">
                  Your Full Name *
                </label>
                <input
                  id="display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Ramesh Uncle, Priya, or Anand"
                  className="w-full bg-[#FCFBF8] border border-[#E4DED6] px-4 py-2.5 text-sm font-sans text-[#2A2521] focus:border-[#2A2521] focus:outline-none"
                />
              </div>

              {/* Relationship */}
              <div className="space-y-1.5">
                <label htmlFor="relationship" className="font-micro text-[11px] uppercase tracking-[0.15em] text-[#2A2521] font-semibold block">
                  Relationship to Celebration
                </label>
                <input
                  id="relationship"
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Groom's Brother, Host's Sister, Society Secretary"
                  className="w-full bg-[#FCFBF8] border border-[#E4DED6] px-4 py-2.5 text-sm font-sans text-[#2A2521] focus:border-[#2A2521] focus:outline-none"
                />
              </div>

              {/* Preferred Language */}
              <div className="space-y-1.5">
                <label className="font-micro text-[11px] uppercase tracking-[0.15em] text-[#2A2521] font-semibold block">
                  Preferred Language (for Maya voice & scripts)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setPreferredLanguage(lang.code as IndianLanguage)}
                      className={`p-2.5 border text-left text-xs transition-all cursor-pointer ${
                        preferredLanguage === lang.code
                          ? 'border-[#2A2521] bg-[#F1EDE8] font-semibold text-[#2A2521]'
                          : 'border-[#E4DED6] bg-white text-[#6B645E] hover:border-[#2A2521]'
                      }`}
                    >
                      <span className="block font-medium">{lang.nativeLabel}</span>
                      <span className="text-[10px] text-[#6B645E]">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full py-3 flex items-center justify-center gap-2 mt-2"
              >
                <Sparkles className="w-4 h-4 text-[#D5C7B5]" />
                <span>{isSubmitting ? 'Joining celebration...' : `Join as ${roleLabel}`}</span>
              </Button>
            </form>
          )}
        </Card>
      </main>

      <footer className="max-w-xl mx-auto w-full pt-8 text-center text-xs text-[#6B645E]">
        Made in Heaven • Collaborative Celebration & Event Planning
      </footer>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs text-[#6B645E]">
          Loading invitation...
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}

