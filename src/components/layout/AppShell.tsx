'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Logo } from '@/components/common/Logo';
import { GlobalHeader } from '@/components/common/GlobalHeader';
import { MobileBottomNav } from './MobileBottomNav';

export interface AppShellProps {
  currentTab?: 'chat' | 'plan' | 'home' | 'family' | 'settings' | 'design';
  children: React.ReactNode;
  headerSlot?: React.ReactNode;
  fullHeight?: boolean;
}

export function AppShell({
  children,
  headerSlot,
  fullHeight = false,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isPublicRoute =
    pathname === '/welcome' ||
    pathname === '/weddings' ||
    pathname === '/birthdays' ||
    pathname === '/community' ||
    pathname === '/signin' ||
    pathname === '/start' ||
    pathname === '/ideas' ||
    pathname === '/about';

  // Route Access Control & Protection
  useEffect(() => {
    if (isLoading) return;

    // 1. Signed-out users cannot open protected app pages
    if (!user && !isPublicRoute) {
      router.replace('/welcome');
      return;
    }

    // 2. Signed-in users without a home are directed to /start
    if (user && !user.homeId && pathname !== '/start' && pathname !== '/ideas' && pathname !== '/about') {
      router.replace('/start');
      return;
    }

    // 3. Signed-in users with a home cannot visit /welcome or /signin
    if (user && user.homeId && (pathname === '/welcome' || pathname === '/signin')) {
      router.replace('/home');
      return;
    }
  }, [user, isLoading, pathname, isPublicRoute, router]);

  // Loading Skeleton while initializing session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FCFBF8] flex flex-col items-center justify-center p-4">
        <Logo size="md" className="mb-4" />
        <div className="w-8 h-8 border border-[#E4DED6] border-t-[#A8603E] animate-spin mb-4" />
        <p className="font-micro text-[11px] text-[#A8603E] tracking-[0.2em] uppercase">
          Loading your celebration...
        </p>
      </div>
    );
  }

  // Welcome page handles its own full-bleed layout and hero header
  if (pathname === '/welcome') {
    return (
      <div className="w-full min-h-screen bg-[#FCFBF8] text-[#2A2521] flex flex-col font-sans page-transition-fade">
        <GlobalHeader />
        <main className="flex-1 w-full">{children}</main>
      </div>
    );
  }

  // Public editorial pages (/ideas, /about) without bottom nav bar
  if (pathname === '/ideas' || pathname === '/about') {
    return (
      <div className="w-full min-h-screen bg-[#FCFBF8] text-[#2A2521] flex flex-col font-sans page-transition-fade">
        <GlobalHeader />
        <main className="flex-1 w-full pt-16">{children}</main>
      </div>
    );
  }

  // Signin and Start pages have a clean minimal flow without bottom nav
  if (pathname === '/signin' || pathname === '/start') {
    return (
      <div className="w-full min-h-screen bg-[#FCFBF8] text-[#2A2521] flex flex-col font-sans page-transition-fade">
        <GlobalHeader />
        <main className="flex-1 w-full pt-16">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FCFBF8] text-[#2A2521] flex flex-col font-sans overflow-x-hidden">
      {/* Top Editorial Sticky Header */}
      <GlobalHeader />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full pt-16 sm:pt-20 overflow-x-hidden">
        {/* Optional sub-header strip (e.g. PlanSummaryStrip) */}
        {headerSlot}

        {/* Body content */}
        <main
          className={`flex-1 w-full max-w-full overflow-x-hidden ${
            fullHeight ? 'flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] pb-16 md:pb-0' : 'pb-24 md:pb-12'
          }`}
        >
          {children}
        </main>

        {/* Mobile Bottom Navigation (Visible < 768px on app routes) */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
