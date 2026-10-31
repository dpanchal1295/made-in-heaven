'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { SUPPORTED_LANGUAGES } from '@/lib/utils/i18n';
import { Logo } from '@/components/common/Logo';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
import { ArrowRight, ArrowLeft } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInAsDemoCouple, user, isDemoMode } = useAuth();

  const urlLang = searchParams.get('lang') || 'en';

  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [language, setLanguage] = useState(urlLang);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.homeId) {
        router.replace('/home');
      } else {
        router.replace('/start');
      }
    }
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!emailOrPhone.trim()) {
      setError('Please enter your phone number or email.');
      return;
    }

    signIn({
      name: name.trim(),
      emailOrPhone: emailOrPhone.trim(),
      preferredLanguage: language,
    });

    router.push('/start');
  };

  const handleDemoCouple = () => {
    signInAsDemoCouple();
    router.push('/home');
  };

  return (
    <div className="min-h-screen w-full bg-[#FCFBF8] flex flex-col justify-center items-center py-12 px-4 sm:px-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Logo href="/welcome" size="lg" className="justify-center" />
          <p className="font-micro text-xs text-[#6B645E] uppercase tracking-[0.15em] pt-1">
            SIGN IN TO START OR JOIN YOUR CELEBRATION HOME
          </p>
        </div>

        {/* Demo Couple Quick Shortcut (only when demo mode active) */}
        {isDemoMode && (
          <div className="bg-[#F1EDE8] border border-[#E4DED6] p-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="font-micro text-[11px] text-[#94512F] uppercase tracking-[0.2em] font-semibold">
                EVALUATION & REVIEW MODE
              </span>
              <Badge variant="outline" size="sm" className="font-micro text-[#94512F]">
                DEMO
              </Badge>
            </div>
            <p className="text-xs text-[#6B645E] leading-relaxed">
              Skip sign-in and jump right into Aarav & Diya’s live Pune wedding with 300 guests and ₹8 Lakh budget.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDemoCouple}
              className="w-full text-xs font-medium bg-white hover:bg-[#FCFBF8]"
            >
              <span>Open Demo Couple Wedding</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Button>
          </div>
        )}

        {/* Main Sign In Card */}
        <Card className="border border-[#E4DED6] bg-white p-6 sm:p-8 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-[#E4DED6]">
            <CardTitle className="text-xl">
              Sign In
            </CardTitle>
            <CardDescription className="text-xs text-[#6B645E]">
              No password needed. Your session is saved securely in your browser.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 pt-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#F1EDE8] border border-[#94512F]/40 text-xs text-[#94512F]">
                  {error}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="user-name"
                  className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]"
                >
                  Your Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  placeholder="e.g. Diya Sharma or Aarav Kapoor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-sm text-[#2A2521] placeholder-[#6B645E]/50 focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                  required
                />
              </div>

              {/* Phone or Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="user-contact"
                  className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]"
                >
                  Phone Number or Email
                </label>
                <input
                  id="user-contact"
                  type="text"
                  placeholder="+91 98765 43210 or diya@example.com"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-sm text-[#2A2521] placeholder-[#6B645E]/50 focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                  required
                />
              </div>

              {/* Preferred Language */}
              <div className="space-y-1.5">
                <label
                  htmlFor="user-language"
                  className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]"
                >
                  Preferred Language
                </label>
                <select
                  id="user-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeLabel} ({lang.label})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full min-h-[48px]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-1.5 font-micro text-[11px] uppercase tracking-[0.15em] text-[#6B645E] hover:text-[#2A2521]"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Back to welcome</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#FCFBF8] flex items-center justify-center p-4">
          <div className="w-6 h-6 border border-[#2A2521] border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignInForm />
    </React.Suspense>
  );
}
