'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Logo } from '@/components/common/Logo';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowRight, ArrowLeft, Heart, Cake, Flag } from 'lucide-react';
import { EventType } from '@/types/firestore';

function StartForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setHomeId, isLoading } = useAuth();

  const typeParam = searchParams.get('type') as EventType | null;
  const initialType: EventType = (typeParam === 'birthday' || typeParam === 'community') ? typeParam : 'wedding';

  const [selectedEventType, setSelectedEventType] = useState<EventType>(initialType);
  const [hostDisplayName, setHostDisplayName] = useState('');

  // Birthday fields
  const [birthdayCelebrant, setBirthdayCelebrant] = useState('');
  const [birthdayMilestone, setBirthdayMilestone] = useState('');

  // Community fields
  const [communityGroupName, setCommunityGroupName] = useState('');
  const [communityOccasion, setCommunityOccasion] = useState('');

  // Wedding fields
  const [weddingCoupleNames, setWeddingCoupleNames] = useState('');

  const [celebrationDate, setCelebrationDate] = useState('');
  const [city, setCity] = useState('');
  const [isCreatingHome, setIsCreatingHome] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // "Join family Home" state
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Active form view ('select' | 'create' | 'join')
  const [activeView, setActiveView] = useState<'select' | 'create' | 'join'>('select');

  // Check auth: if unauthenticated, redirect to signin with return URL
  useEffect(() => {
    if (!isLoading && !user) {
      const typeQuery = typeParam ? `&type=${typeParam}` : '';
      router.replace(`/signin?redirect=/start${typeQuery}`);
    }
  }, [user, isLoading, typeParam, router]);

  useEffect(() => {
    if (user?.name) {
      setHostDisplayName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (typeParam === 'wedding' || typeParam === 'birthday' || typeParam === 'community') {
      setSelectedEventType(typeParam);
      setActiveView('create');
    }
  }, [typeParam]);

  const handleCreateHome = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    let finalCelebrationTitle = '';
    let finalSubtype = '';

    if (selectedEventType === 'birthday') {
      if (!birthdayCelebrant.trim()) {
        setCreateError('Please specify who the birthday is for (e.g. "Arjun, my son" or "Mum").');
        return;
      }
      finalCelebrationTitle = birthdayMilestone.trim()
        ? `${birthdayCelebrant.trim()} (${birthdayMilestone.trim()})`
        : birthdayCelebrant.trim();
      finalSubtype = birthdayMilestone.trim();
    } else if (selectedEventType === 'community') {
      if (!communityGroupName.trim()) {
        setCreateError('Please enter the organising committee, group, or society name.');
        return;
      }
      finalCelebrationTitle = communityGroupName.trim();
      finalSubtype = communityOccasion.trim();
    } else {
      if (!weddingCoupleNames.trim()) {
        setCreateError('Please enter the couple names (e.g. "Aarav & Diya").');
        return;
      }
      finalCelebrationTitle = weddingCoupleNames.trim();
    }

    setIsCreatingHome(true);
    try {
      // If user provided or changed their display name, save it
      if (hostDisplayName.trim() && hostDisplayName.trim() !== user?.name) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_profile', name: hostDisplayName.trim() }),
        }).catch(() => {});
      }

      const res = await fetch('/api/homes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleNames: finalCelebrationTitle,
          date: celebrationDate.trim() || undefined,
          city: city.trim() || undefined,
          eventType: selectedEventType,
          eventSubtype: finalSubtype || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.home) {
        setHomeId(data.home.id);
        router.push('/chat');
      } else {
        setCreateError(data.error || 'Failed to create celebration Home.');
      }
    } catch (err) {
      console.error('Error creating home:', err);
      setCreateError('Network error while creating Home.');
    } finally {
      setIsCreatingHome(false);
    }
  };

  const handleJoinHome = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    if (!inviteCode.trim()) {
      setJoinError('Please enter a valid invite code.');
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          uid: user?.uid,
          name: user?.name,
          preferredLanguage: user?.preferredLanguage || 'en',
        }),
      });

      const data = await res.json();
      if (data.success && data.home) {
        setHomeId(data.home.id);
        router.push('/home');
      } else {
        setJoinError(data.error || 'Could not join with that invite code.');
      }
    } catch (err) {
      console.error('Error joining home:', err);
      setJoinError('Network error while joining celebration home.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-8" data-event-type={selectedEventType}>
      {/* Header */}
      <div className="text-center space-y-2">
        <Logo href="/welcome" size="lg" className="justify-center" />
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#2A2521] mt-2">
          How would you like to start?
        </h1>
        <p className="font-micro text-xs text-[#6B645E] uppercase tracking-[0.15em] mt-1">
          CREATE A CELEBRATION HOME OR JOIN WITH AN INVITE CODE
        </p>
      </div>

      {/* Main Choice */}
      {activeView === 'select' && (
        <div className="space-y-6">
          <div className="text-center">
            <span className="font-micro text-[11px] uppercase tracking-[0.2em] text-[#94512F] block mb-2 font-medium">
              STEP 1: CHOOSE CELEBRATION
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Wedding Card */}
            <div
              onClick={() => {
                setSelectedEventType('wedding');
                setActiveView('create');
              }}
              className="bg-white p-6 border border-[#E4DED6] hover:border-[#2A2521] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 border border-[#E4DED6] bg-[#F1EDE8] flex items-center justify-center text-[#94512F]">
                  <Heart className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-medium text-[#2A2521]">
                    Wedding
                  </h2>
                  <p className="text-xs text-[#6B645E] mt-1.5 leading-relaxed">
                    Mehendi to reception, itemized rupee budget, and family voting.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-[#E4DED6] flex items-center justify-between text-xs font-micro uppercase tracking-[0.15em] text-[#94512F]">
                <span>Plan Wedding</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Birthday Card */}
            <div
              onClick={() => {
                setSelectedEventType('birthday');
                setActiveView('create');
              }}
              className="bg-white p-6 border border-[#E4DED6] hover:border-[#2A2521] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 border border-[#E4DED6] bg-[#F1EDE8] flex items-center justify-center text-[#863A57]">
                  <Cake className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-medium text-[#2A2521]">
                    Birthday
                  </h2>
                  <p className="text-xs text-[#6B645E] mt-1.5 leading-relaxed">
                    1st, 18th, 50th, 60th milestone gatherings, dinner party & return gifts.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-[#E4DED6] flex items-center justify-between text-xs font-micro uppercase tracking-[0.15em] text-[#863A57]">
                <span>Plan Birthday</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Community Event Card */}
            <div
              onClick={() => {
                setSelectedEventType('community');
                setActiveView('create');
              }}
              className="bg-white p-6 border border-[#E4DED6] hover:border-[#2A2521] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 border border-[#E4DED6] bg-[#F1EDE8] flex items-center justify-center text-[#1B4332]">
                  <Flag className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-medium text-[#2A2521]">
                    Community Event
                  </h2>
                  <p className="text-xs text-[#6B645E] mt-1.5 leading-relaxed">
                    Garba, Ganesh Utsav, Diwali Mela, crowd logistics & sponsors.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-[#E4DED6] flex items-center justify-between text-xs font-micro uppercase tracking-[0.15em] text-[#1B4332]">
                <span>Plan Community</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Join Home Divider Option */}
          <div className="pt-4 border-t border-[#E4DED6] text-center">
            <button
              type="button"
              onClick={() => setActiveView('join')}
              className="text-xs text-[#6B645E] hover:text-[#2A2521] font-medium tracking-wide uppercase font-micro hover:underline cursor-pointer"
            >
              Joining an existing family celebration? Enter invite code →
            </button>
          </div>
        </div>
      )}

      {/* View: Create Home Form */}
      {activeView === 'create' && (
        <Card className="border border-[#E4DED6] bg-white p-8 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-[#E4DED6]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl capitalize">
                Create {selectedEventType} Home
              </CardTitle>
              <button
                type="button"
                onClick={() => setActiveView('select')}
                className="font-micro text-xs text-[#6B645E] hover:text-[#2A2521] uppercase tracking-[0.15em] flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change type</span>
              </button>
            </div>
            <CardDescription className="text-xs text-[#6B645E]">
              Once created, you&apos;ll meet Maya to guide your schedule, budget, and family collaboration.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 pt-2">
            <form onSubmit={handleCreateHome} className="space-y-4">
              {createError && (
                <div className="p-3 bg-[#F1EDE8] border border-[var(--accent-dark)]/40 text-xs text-[var(--accent-dark)]">
                  {createError}
                </div>
              )}

              {/* 1. Host Name (Always asked) */}
              <div className="space-y-1.5">
                <label htmlFor="host-name" className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]">
                  Your Name (Host / Organiser)
                </label>
                <input
                  id="host-name"
                  type="text"
                  placeholder="e.g. Rohan Sharma"
                  value={hostDisplayName}
                  onChange={(e) => setHostDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                  required
                />
              </div>

              {/* 2. Birthday Specific Inputs */}
              {selectedEventType === 'birthday' && (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="birthday-celebrant" className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]">
                      Who is the birthday for?
                    </label>
                    <input
                      id="birthday-celebrant"
                      type="text"
                      placeholder="e.g. Arjun, my son or Dad"
                      value={birthdayCelebrant}
                      onChange={(e) => setBirthdayCelebrant(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="birthday-milestone" className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]">
                      Age or Milestone
                    </label>
                    <input
                      id="birthday-milestone"
                      type="text"
                      placeholder="e.g. 1st Birthday, 18th, or 60th Shashti Poorthi"
                      value={birthdayMilestone}
                      onChange={(e) => setBirthdayMilestone(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                    />
                  </div>
                </>
              )}

              {/* 3. Community Specific Inputs */}
              {selectedEventType === 'community' && (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="community-group" className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]">
                      Organising Group / Society Name
                    </label>
                    <input
                      id="community-group"
                      type="text"
                      placeholder="e.g. Sahyadri Heights Cultural Committee"
                      value={communityGroupName}
                      onChange={(e) => setCommunityGroupName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="community-occasion" className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]">
                      Occasion / Festival
                    </label>
                    <input
                      id="community-occasion"
                      type="text"
                      placeholder="e.g. Navratri Garba Utsav or Diwali Mela"
                      value={communityOccasion}
                      onChange={(e) => setCommunityOccasion(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                    />
                  </div>
                </>
              )}

              {/* 4. Wedding Specific Inputs */}
              {selectedEventType === 'wedding' && (
                <div className="space-y-1.5">
                  <label htmlFor="wedding-couple" className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]">
                    Couple Names
                  </label>
                  <input
                    id="wedding-couple"
                    type="text"
                    placeholder="e.g. Aarav & Diya"
                    value={weddingCoupleNames}
                    onChange={(e) => setWeddingCoupleNames(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                    required
                  />
                </div>
              )}

              {/* 5. Date */}
              <div className="space-y-1.5">
                <label htmlFor="date" className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]">
                  Target Date or Month
                </label>
                <input
                  id="date"
                  type="text"
                  placeholder="e.g. 18 December 2026 or December 2026"
                  value={celebrationDate}
                  onChange={(e) => setCelebrationDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                />
              </div>

              {/* 6. City / Location */}
              <div className="space-y-1.5">
                <label htmlFor="city" className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]">
                  {selectedEventType === 'community' ? 'City / Society Ground' : 'City'}
                </label>
                <input
                  id="city"
                  type="text"
                  placeholder="e.g. Pune, Bengaluru, or Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  disabled={isCreatingHome}
                  className="w-full min-h-[48px] bg-[var(--accent-primary)] hover:bg-[var(--accent-dark)] text-white"
                >
                  <span>{isCreatingHome ? 'Creating Home...' : 'Create Home & Meet Maya'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-2" strokeWidth={1.5} />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* View: Join Home Form */}
      {activeView === 'join' && (
        <Card className="border border-[#E4DED6] bg-white p-8 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-[#E4DED6]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Join with Invite Code
              </CardTitle>
              <button
                type="button"
                onClick={() => setActiveView('select')}
                className="font-micro text-xs text-[#6B645E] hover:text-[#2A2521] uppercase tracking-[0.15em] flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            </div>
            <CardDescription className="text-xs text-[#6B645E]">
              Enter the invite code shared with you by the host or committee.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 pt-2">
            <form onSubmit={handleJoinHome} className="space-y-4">
              {joinError && (
                <div className="p-3 bg-[#F1EDE8] border border-[var(--accent-dark)]/40 text-xs text-[var(--accent-dark)]">
                  {joinError}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="invite-code" className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]">
                  Invite Code
                </label>
                <input
                  id="invite-code"
                  type="text"
                  placeholder="e.g. MIH-2026"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 border border-[#E4DED6] bg-white text-base tracking-widest font-mono text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden uppercase min-h-[44px]"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  disabled={isJoining}
                  className="w-full min-h-[48px] bg-[var(--accent-primary)] hover:bg-[var(--accent-dark)] text-white"
                >
                  <span>{isJoining ? 'Joining Home...' : 'Join Home'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-2" strokeWidth={1.5} />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function StartPage() {
  return (
    <div className="min-h-screen w-full bg-[#FCFBF8] flex flex-col justify-center items-center py-12 px-4 sm:px-6 font-sans">
      <Suspense fallback={<div className="text-xs text-[#6B645E]">Loading start options...</div>}>
        <StartForm />
      </Suspense>
    </div>
  );
}
