'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { getGreeting } from '@/lib/utils/i18n';
import { formatINR } from '@/lib/utils/format';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Sparkles, Calendar, Users, Clock, Lock, Building2, UtensilsCrossed, Vote } from 'lucide-react';

/**
 * Reads a wedding date like "2026-12-18" as a LOCAL calendar day.
 * new Date("2026-12-18") treats it as midnight UTC, which shows as
 * 17 December in the Americas. This keeps it 18 December everywhere.
 */
function parseLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** "2026-12-18" -> "18 December 2026" */
function formatLocalDate(value: string | null | undefined): string {
  const d = parseLocalDate(value);
  if (!d) return value || '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Whole days from today until the wedding (0 if it has passed) */
function daysUntil(value: string | null | undefined): number | null {
  const d = parseLocalDate(value);
  if (!d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((d.getTime() - today.getTime()) / 86400000));
}

export default function HomePage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!user || !user.homeId) return;

    try {
      const res = await fetch(`/api/home?homeId=${user.homeId}&uid=${user.uid}`, {
        headers: {
          'x-member-uid': user.uid,
          'x-home-id': user.homeId,
        },
      });
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const profile = dashboardData?.profile || {};
  const budget = dashboardData?.budget || null;
  const plan = dashboardData?.plan || null;
  const hasBudgetAccess = dashboardData?.hasBudgetAccess ?? user?.canSeeBudget ?? false;
  const eventType = profile?.eventType || 'wedding';

  // Date & Countdown (local calendar day, so it never shifts by time zone)
  const dateString = profile?.date || '2026-12-18';
  const formattedDateDisplay = formatLocalDate(dateString);
  const [daysToGo, setDaysToGo] = useState<number | null>(null);

  const city = profile?.city || 'Pune';
  const guestCount = profile?.guest_count?.planning_value || profile?.guest_count?.estimate || 300;
  const coupleName = dashboardData?.home?.name || user?.name || 'Aarav & Diya';

  const eventHeading =
    eventType === 'birthday'
      ? 'BIRTHDAY OVERVIEW'
      : eventType === 'community'
      ? 'EVENT OVERVIEW'
      : 'WEDDING OVERVIEW';

  const subtitleText =
    eventType === 'birthday'
      ? `Here is your birthday celebration summary, milestones, and family updates for ${city}.`
      : eventType === 'community'
      ? `Here is your community festival logistics, committee milestones, and volunteer updates for ${city}.`
      : `Here is your wedding summary, milestones, and family collaboration updates for ${city}.`;

  useEffect(() => {
    // Computed in the browser only, so server and browser never disagree
    setDaysToGo(daysUntil(dateString));
  }, [dateString]);

  // Budget calculations
  const totalBudget = Number.isFinite(budget?.planning_value)
    ? (budget?.planning_value ?? 800000)
    : (budget?.total || 800000);
  const plannedSpend = Math.round(totalBudget * 0.72);
  const remainingBudget = Math.max(0, totalBudget - plannedSpend);
  const budgetProgressPercent = totalBudget > 0 ? Math.min(100, Math.round((plannedSpend / totalBudget) * 100)) : 0;

  // Urgent Plan Tasks
  const bookedMap = plan?.bookedVendors || {};
  const urgentTasks = [
    { id: '1', title: 'Confirm Wedding Venue & dates', category: 'Venue', booked: Boolean(bookedMap['Venue'] || bookedMap['venue']) },
    { id: '2', title: 'Catering menu & per-plate tasting', category: 'Catering', booked: Boolean(bookedMap['Catering'] || bookedMap['caterer']) },
    { id: '3', title: 'Lock photography & cinematic video team', category: 'Photography', booked: Boolean(bookedMap['Photography'] || bookedMap['photo']) },
  ];

  return (
    <AppShell currentTab="home">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Editorial Greeting Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E4DED6]">
          <div className="space-y-2">
            <span className="font-micro text-[11px] text-[#94512F] tracking-[0.2em] uppercase block">
              {eventHeading} • {city.toUpperCase()} • {formattedDateDisplay.toUpperCase()}
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#2A2521] tracking-normal">
              {getGreeting(user?.preferredLanguage, user?.name || coupleName)}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B645E]">
              {subtitleText}
            </p>
          </div>

          {/* Quick Actions (Square Outline Buttons) */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link href="/chat">
              <Button variant="primary" size="sm" withArrow leftIcon={<Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />}>
                Ask Maya
              </Button>
            </Link>
            <Link href="/plan">
              <Button variant="secondary" size="sm" leftIcon={<Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />}>
                View Plan
              </Button>
            </Link>
            <Link href="/family">
              <Button variant="secondary" size="sm" leftIcon={<Users className="w-3.5 h-3.5" strokeWidth={1.5} />}>
                Family
              </Button>
            </Link>
          </div>
        </div>

        {/* Row 1: Editorial Stats Strip (Serif Numbers with Hairline Dividers) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Countdown Stat Card */}
          <Card className="border border-[#E4DED6] bg-white flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-[#E4DED6]">
              <div className="flex items-center justify-between">
                <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.2em] uppercase">
                  TIMELINE
                </span>
                <Clock className="w-4 h-4 text-[#A8603E]" strokeWidth={1.5} />
              </div>
              <CardTitle className="text-lg">Countdown</CardTitle>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="font-serif text-4xl sm:text-5xl font-normal text-[#2A2521] block">
                  {daysToGo ?? '—'}
                </span>
                <span className="font-micro text-[11px] text-[#6B645E] tracking-[0.15em] uppercase block mt-1">
                  Days to celebration
                </span>
              </div>

              <div className="pt-3 border-t border-[#E4DED6] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#6B645E]">
                  <span>Wedding Date</span>
                  <span className="text-[#2A2521] font-medium">{formattedDateDisplay}</span>
                </div>
                <div className="flex justify-between text-[#6B645E]">
                  <span>Guest Capacity</span>
                  <span className="text-[#2A2521] font-medium">{guestCount} Guests</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Snapshot (2 cols on desktop) */}
          <Card className="md:col-span-2 border border-[#E4DED6] bg-white flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-[#E4DED6]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.2em] uppercase">
                    FINANCES
                  </span>
                </div>
                {hasBudgetAccess && (
                  <Badge variant="outline" size="sm">
                    Estimated Prices
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">Budget Allocation</CardTitle>
              <CardDescription className="text-xs">
                {hasBudgetAccess
                  ? 'Itemized breakdown by function in Indian Rupees (INR).'
                  : 'Budget access is restricted.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {hasBudgetAccess ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[#E4DED6] pb-5">
                    <div>
                      <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.2em] uppercase block">
                        TOTAL ESTIMATE
                      </span>
                      <span className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521] block mt-1">
                        {formatINR(totalBudget)}
                      </span>
                    </div>

                    <div>
                      <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase block">
                        PLANNED SPEND
                      </span>
                      <span className="font-serif text-2xl sm:text-3xl font-normal text-[#94512F] block mt-1">
                        {formatINR(plannedSpend)}
                      </span>
                    </div>

                    <div>
                      <span className="font-micro text-[10px] text-[#2A2521] tracking-[0.2em] uppercase block">
                        BUFFER BALANCE
                      </span>
                      <span className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521] block mt-1">
                        {formatINR(remainingBudget)}
                      </span>
                    </div>
                  </div>

                  {/* Allocation Hairline Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-micro text-[10px] text-[#6B645E] tracking-[0.15em] uppercase">
                      <span>Allocation progress</span>
                      <span>{budgetProgressPercent}% allocated</span>
                    </div>
                    <div className="w-full h-1 bg-[#E4DED6] overflow-hidden">
                      <div
                        className="h-full bg-[#A8603E] transition-all duration-300"
                        style={{ width: `${budgetProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <Lock className="w-6 h-6 text-[#6B645E] mx-auto" strokeWidth={1.5} />
                  <h4 className="font-serif text-base text-[#2A2521]">
                    Budget details are private to couple & elders
                  </h4>
                  <p className="text-xs text-[#6B645E] max-w-sm mx-auto">
                    You are signed in as {user?.name} ({user?.relationship}). Full budget breakdowns in rupees are accessible only by permitted family members.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Today's Focus & Urgent Bookings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Today's Focus */}
          <Card className="border border-[#E4DED6] bg-white">
            <CardHeader className="pb-3 border-b border-[#E4DED6]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Today&apos;s Focus</CardTitle>
                <Link
                  href="/plan"
                  className="font-nav text-[11px] tracking-[0.15em] uppercase text-[#94512F] hover:text-[#2A2521] transition-colors"
                >
                  View full plan →
                </Link>
              </div>
              <CardDescription className="text-xs">
                The 3 most critical items on your wedding checklist right now.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              {urgentTasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="p-3 border border-[#E4DED6] bg-[#FCFBF8] flex items-center justify-between gap-3 hover:border-[#2A2521] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-micro text-[11px] text-[#6B645E] w-5 text-center">
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-medium text-[#2A2521] truncate">
                      {task.title}
                    </span>
                  </div>
                  <Badge
                    variant={task.booked ? 'default' : 'outline'}
                    size="sm"
                    className="shrink-0"
                  >
                    {task.booked ? 'Booked' : 'Pending estimate'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Maya's Editorial Tip & Vendor Priorities */}
          <div className="space-y-6">
            {/* Maya Tip Card */}
            <div className="p-6 bg-[#F1EDE8] border border-[#E4DED6] space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A8603E]" strokeWidth={1.5} />
                <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase">
                  Maya&apos;s Tip for {city}
                </span>
              </div>
              <p className="text-xs text-[#2A2521] leading-relaxed">
                Winter dates in Maharashtra (November through February) book garden resorts and catering teams 8–12 months in advance. Secure your venue date before printing formal invitations.
              </p>
            </div>

            {/* Vendor Priorities Card */}
            <Card className="border border-[#E4DED6] bg-white">
              <CardHeader className="pb-3 border-b border-[#E4DED6]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Top Vendor Priorities</CardTitle>
                  <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.2em] uppercase">
                    ESTIMATED
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="p-3 border border-[#E4DED6] bg-[#FCFBF8] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#6B645E]" strokeWidth={1.5} />
                      <p className="text-xs font-medium text-[#2A2521]">Luxury Garden Lawn in Pune</p>
                    </div>
                    <p className="text-[11px] text-[#6B645E] mt-0.5">₹3,50,000 estimate • 300 guests capacity</p>
                  </div>
                  <Badge variant="outline" size="sm">
                    In inquiry
                  </Badge>
                </div>

                <div className="p-3 border border-[#E4DED6] bg-[#FCFBF8] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-[#6B645E]" strokeWidth={1.5} />
                      <p className="text-xs font-medium text-[#2A2521]">Maharashtrian & Gujarati Menu</p>
                    </div>
                    <p className="text-[11px] text-[#6B645E] mt-0.5">₹950 – ₹1,400 per plate estimate</p>
                  </div>
                  <Badge variant="outline" size="sm">
                    Tasting pending
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Row 3: Family Activity Card (Labeled Sample Data) */}
        <Card className="border border-[#E4DED6] bg-white">
          <CardHeader className="pb-3 border-b border-[#E4DED6]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg">Family Activity & Ideas</CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="outline" size="sm">
                  Sample data
                </Badge>
                <Link
                  href="/family"
                  className="font-nav text-[11px] tracking-[0.15em] uppercase text-[#94512F] hover:text-[#2A2521] transition-colors"
                >
                  Manage family →
                </Link>
              </div>
            </div>
            <CardDescription className="text-xs">
              Recent suggestions and open majority votes across your wedding Home.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            <div className="p-4 border border-[#E4DED6] bg-[#FCFBF8] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase block">
                  MEENAKSHI (MOTHER) • DECOR ROOM
                </span>
                <p className="text-xs text-[#2A2521]">
                  &ldquo;Traditional yellow marigolds with brass urlis and floating candles for the morning Haldi ceremony.&rdquo;
                </p>
                <span className="text-[10px] text-[#6B645E] block pt-1">
                  3 hours ago
                </span>
              </div>
              <Badge variant="outline" size="sm" className="shrink-0">
                Decor Idea
              </Badge>
            </div>

            <div className="p-4 border border-[#E4DED6] bg-[#FCFBF8] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase block">
                  KABIR (BROTHER) • MUSIC ROOM
                </span>
                <p className="text-xs text-[#2A2521]">
                  &ldquo;Acoustic fusion band before the DJ set for Sangeet night.&rdquo;
                </p>
                <span className="text-[10px] text-[#6B645E] block pt-1">
                  Yesterday
                </span>
              </div>
              <Badge variant="outline" size="sm" className="shrink-0">
                Sangeet Idea
              </Badge>
            </div>

            <div className="p-4 bg-[#F1EDE8] border border-[#E4DED6] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Vote className="w-5 h-5 text-[#A8603E] shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-xs font-medium text-[#2A2521]">
                    Open Family Vote: Venue Selection
                  </p>
                  <p className="text-[11px] text-[#6B645E]">
                    Garden Resort vs Heritage Fort • Majority voting opens in Stage 2
                  </p>
                </div>
              </div>
              <Badge variant="outline" size="sm" className="shrink-0">
                Stage 2 Preview
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}