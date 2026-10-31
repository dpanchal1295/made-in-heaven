'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { getGreeting } from '@/lib/utils/i18n';
import { formatINR } from '@/lib/utils/format';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Sparkles, Calendar, Users, Clock, Lock, CheckCircle2, Vote, ArrowRight, Lightbulb } from 'lucide-react';
import { COPY, getCelebrationTerms } from '@/config/copy';

function parseLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatLocalDate(value: string | null | undefined): string {
  const d = parseLocalDate(value);
  if (!d) return value || 'Not set yet';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

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

  const profile = dashboardData?.profile || dashboardData?.home?.profile || {};
  const budget = dashboardData?.budget || null;
  const plan = dashboardData?.plan || null;
  const decisions = dashboardData?.decisions || [];
  const recentIdeas = dashboardData?.recentIdeas || [];
  const hasBudgetAccess = dashboardData?.hasBudgetAccess ?? user?.canSeeBudget ?? false;
  const eventType = profile?.eventType || 'wedding';
  const terms = getCelebrationTerms(eventType);

  // Date & Countdown
  const dateString = profile?.date || null;
  const formattedDateDisplay = dateString ? formatLocalDate(dateString) : COPY.plan.summaryStrip.notSet;
  const [daysToGo, setDaysToGo] = useState<number | null>(null);

  const city = profile?.city || null;
  const guestCount = profile?.guest_count?.planning_value || profile?.guest_count?.estimate || null;
  const celebrationName = dashboardData?.home?.name || user?.name || 'Celebration';

  useEffect(() => {
    if (dateString) {
      setDaysToGo(daysUntil(dateString));
    } else {
      setDaysToGo(null);
    }
  }, [dateString]);

  // Real budget calculations
  const totalBudget = Number.isFinite(budget?.planning_value)
    ? budget.planning_value
    : budget?.total ?? null;

  // Real checklist items from plan
  const checklistData = plan?.checklist?.data?.items || plan?.checklist?.data || [];
  const checklistItems = Array.isArray(checklistData) ? checklistData : [];
  const bookedMap = plan?.bookedVendors || {};

  // Open decisions
  const openDecisions = (decisions || []).filter(
    (d: any) => d.status === 'open' || d.status === 'runoff' || d.status === 'awaiting_couple'
  );

  return (
    <AppShell currentTab="home">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Editorial Greeting Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E4DED6]">
          <div className="space-y-2">
            <span className="font-micro text-[11px] text-[#94512F] tracking-[0.2em] uppercase block">
              {terms.celebrationTypeLabel.toUpperCase()}
              {city ? ` • ${city.toUpperCase()}` : ''}
              {dateString ? ` • ${formattedDateDisplay.toUpperCase()}` : ''}
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#2A2521] tracking-normal">
              {getGreeting(user?.preferredLanguage, user?.name || celebrationName)}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B645E]">
              {celebrationName} · {COPY.homePage.subtitle}
            </p>
          </div>

          {/* Quick Actions */}
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
                {COPY.nav.family}
              </Button>
            </Link>
          </div>
        </div>

        {/* Row 1: Editorial Stats Strip */}
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
                  {daysToGo !== null ? daysToGo : '—'}
                </span>
                <span className="font-micro text-[11px] text-[#6B645E] tracking-[0.15em] uppercase block mt-1">
                  {daysToGo !== null ? COPY.homePage.countdownLabel : COPY.homePage.countdownNotSet}
                </span>
              </div>

              <div className="pt-3 border-t border-[#E4DED6] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#6B645E]">
                  <span>{terms.dateLabel}</span>
                  <span className="text-[#2A2521] font-medium">{formattedDateDisplay}</span>
                </div>
                <div className="flex justify-between text-[#6B645E]">
                  <span>{terms.guestLabel}</span>
                  <span className="text-[#2A2521] font-medium">
                    {guestCount ? `${guestCount} Guests` : COPY.plan.summaryStrip.notSet}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Snapshot */}
          <Card className="md:col-span-2 border border-[#E4DED6] bg-white flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-[#E4DED6]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.2em] uppercase">
                    FINANCES
                  </span>
                </div>
                {hasBudgetAccess && totalBudget && (
                  <Badge variant="outline" size="sm">
                    Estimated Prices
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{COPY.homePage.budgetCardTitle}</CardTitle>
              <CardDescription className="text-xs">
                {hasBudgetAccess
                  ? totalBudget
                    ? 'Current planned allocation in Indian Rupees (INR).'
                    : 'Budget not set yet. Chat with Maya to map your budget.'
                  : COPY.homePage.budgetHidden}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {hasBudgetAccess ? (
                totalBudget ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#E4DED6] pb-5">
                      <div>
                        <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.2em] uppercase block">
                          ESTIMATED BUDGET
                        </span>
                        <span className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521] block mt-1">
                          {formatINR(totalBudget)}
                        </span>
                      </div>
                      <div className="flex items-center sm:justify-end">
                        <Link href="/plan" className="font-micro text-[11px] tracking-[0.15em] uppercase text-[#94512F] hover:text-[#2A2521] transition-colors flex items-center gap-1.5">
                          <span>View breakdown in plan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-xs text-[#6B645E]">
                      No budget numbers recorded yet.
                    </p>
                    <Link href="/chat">
                      <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                        {COPY.homePage.quickStartMaya}
                      </Button>
                    </Link>
                  </div>
                )
              ) : (
                <div className="py-8 text-center space-y-2">
                  <Lock className="w-6 h-6 text-[#6B645E] mx-auto" strokeWidth={1.5} />
                  <h4 className="font-serif text-base text-[#2A2521]">
                    {COPY.homePage.budgetHidden}
                  </h4>
                  <p className="text-xs text-[#6B645E] max-w-sm mx-auto">
                    You are signed in as {user?.name}. Full budget breakdowns in rupees are accessible only by permitted celebration hosts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Real Checklist & Open Decisions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Checklist Status */}
          <Card className="border border-[#E4DED6] bg-white">
            <CardHeader className="pb-3 border-b border-[#E4DED6]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{COPY.homePage.planProgressTitle}</CardTitle>
                <Link
                  href="/plan"
                  className="font-nav text-[11px] tracking-[0.15em] uppercase text-[#94512F] hover:text-[#2A2521] transition-colors"
                >
                  View full plan →
                </Link>
              </div>
              <CardDescription className="text-xs">
                Key milestones and booked services.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              {checklistItems.length > 0 ? (
                checklistItems.slice(0, 4).map((task: any, idx: number) => {
                  const isBooked = Boolean(bookedMap[task.category] || bookedMap[task.title] || task.booked);
                  return (
                    <div
                      key={task.id || idx}
                      className="p-3 border border-[#E4DED6] bg-[#FCFBF8] flex items-center justify-between gap-3 hover:border-[#2A2521] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-micro text-[11px] text-[#6B645E] w-5 text-center">
                          0{idx + 1}
                        </span>
                        <span className="text-xs font-medium text-[#2A2521] truncate">
                          {task.title || task.item || task.category}
                        </span>
                      </div>
                      <Badge
                        variant={isBooked ? 'default' : 'outline'}
                        size="sm"
                        className="shrink-0"
                      >
                        {isBooked ? 'Booked' : 'Pending'}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 className="w-6 h-6 text-[#6B645E] mx-auto opacity-40" strokeWidth={1.5} />
                  <p className="text-xs text-[#6B645E] max-w-sm mx-auto">
                    {COPY.homePage.emptyPlan}
                  </p>
                  <Link href="/chat">
                    <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                      {COPY.homePage.quickStartMaya}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Group Decisions */}
          <Card className="border border-[#E4DED6] bg-white">
            <CardHeader className="pb-3 border-b border-[#E4DED6]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{COPY.homePage.openDecisionsTitle}</CardTitle>
                <Link
                  href="/family"
                  className="font-nav text-[11px] tracking-[0.15em] uppercase text-[#94512F] hover:text-[#2A2521] transition-colors"
                >
                  Family discussions →
                </Link>
              </div>
              <CardDescription className="text-xs">
                Active majority votes and consensus topics.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              {openDecisions.length > 0 ? (
                openDecisions.slice(0, 3).map((decision: any) => (
                  <Link
                    key={decision.id}
                    href={`/family/decisions/${decision.id}`}
                    className="p-3 border border-[#E4DED6] bg-[#FCFBF8] flex items-center justify-between gap-3 hover:border-[#2A2521] transition-colors block"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Vote className="w-4 h-4 text-[#A8603E] shrink-0" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#2A2521] truncate">{decision.topic}</p>
                        <p className="text-[10px] text-[#6B645E]">
                          {decision.options?.length || 0} options · Round {decision.round === 'runoff' ? 'Runoff' : '1'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" size="sm" className="shrink-0">
                      Vote open
                    </Badge>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center space-y-3">
                  <Vote className="w-6 h-6 text-[#6B645E] mx-auto opacity-40" strokeWidth={1.5} />
                  <p className="text-xs text-[#6B645E] max-w-sm mx-auto">
                    {COPY.homePage.emptyDecisions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Real Recent Ideas */}
        <Card className="border border-[#E4DED6] bg-white">
          <CardHeader className="pb-3 border-b border-[#E4DED6]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg">{COPY.homePage.recentActivityTitle}</CardTitle>
              <Link
                href="/family"
                className="font-nav text-[11px] tracking-[0.15em] uppercase text-[#94512F] hover:text-[#2A2521] transition-colors"
              >
                Go to discussion rooms →
              </Link>
            </div>
            <CardDescription className="text-xs">
              Latest thoughts, suggestions, and inspirations added by your group.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            {recentIdeas.length > 0 ? (
              recentIdeas.map((idea: any) => (
                <div
                  key={idea.id}
                  className="p-4 border border-[#E4DED6] bg-[#FCFBF8] flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase block">
                      {idea.authorName || 'MEMBER'}
                    </span>
                    <p className="text-xs text-[#2A2521]">{idea.text}</p>
                  </div>
                  <Badge variant="outline" size="sm" className="shrink-0">
                    Idea
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-8 text-center space-y-3">
                <Lightbulb className="w-6 h-6 text-[#6B645E] mx-auto opacity-40" strokeWidth={1.5} />
                <p className="text-xs text-[#6B645E] max-w-sm mx-auto">
                  {COPY.homePage.emptyActivity}
                </p>
                <Link href="/family">
                  <Button variant="secondary" size="sm">
                    Explore discussion rooms
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
