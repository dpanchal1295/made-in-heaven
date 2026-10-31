'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Logo } from '@/components/common/Logo';
import { Photo } from '@/components/common/Photo';
import { Eyebrow } from '@/components/common/Eyebrow';
import { Button } from '@/components/ui';
import { ArrowRight, ArrowLeft, Calendar, MapPin, User, Sparkles, KeyRound } from 'lucide-react';
import { EventType } from '@/types/firestore';
import { ImageKey } from '@/config/images';

interface CelebrationOption {
  type: EventType;
  eyebrow: string;
  title: string;
  description: string;
  imageKey: ImageKey;
  accentDark: string;
  accentPrimary: string;
  badgeBg: string;
}

const CELEBRATION_OPTIONS: CelebrationOption[] = [
  {
    type: 'wedding',
    eyebrow: 'WEDDING',
    title: 'Indian Wedding',
    description: 'Mehendi to reception, itemized rupee budget, attire, rituals, and family consensus.',
    imageKey: 'hero',
    accentDark: '#94512F',
    accentPrimary: '#A8603E',
    badgeBg: 'rgba(168, 96, 62, 0.1)',
  },
  {
    type: 'birthday',
    eyebrow: 'BIRTHDAY',
    title: 'Milestone Birthday',
    description: '1st Ayushya Homam, 18th milestone, or 50th/60th Jubilee with catering, decor, and cake.',
    imageKey: 'birthdayHero',
    accentDark: '#863A57',
    accentPrimary: '#9B4A6A',
    badgeBg: 'rgba(155, 74, 106, 0.1)',
  },
  {
    type: 'community',
    eyebrow: 'COMMUNITY',
    title: 'Community Festival',
    description: 'Garba, Ganesh Utsav, Diwali Mela, society gatherings, crowd logistics, and committees.',
    imageKey: 'communityHero',
    accentDark: '#8E4A00',
    accentPrimary: '#A35700',
    badgeBg: 'rgba(163, 87, 0, 0.1)',
  },
];

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

  // Active form view: step 1 ('select'), step 2 ('create'), or 'join'
  const [activeView, setActiveView] = useState<'select' | 'create' | 'join'>('select');

  // Check auth: if unauthenticated, redirect to signin with return URL
  useEffect(() => {
    if (!isLoading && !user) {
      const typeQuery = typeParam ? `&type=${typeParam}` : '';
      router.replace(`/signin?redirect=/start${typeQuery}`);
    }
  }, [user, isLoading, typeParam, router]);

  useEffect(() => {
    if (user?.name && !user.isGuest) {
      setHostDisplayName(user.name);
    }
  }, [user?.name, user?.isGuest]);

  useEffect(() => {
    if (typeParam === 'wedding' || typeParam === 'birthday' || typeParam === 'community') {
      setSelectedEventType(typeParam);
      setActiveView('create');
    }
  }, [typeParam]);

  const activeOption = useMemo(
    () => CELEBRATION_OPTIONS.find((opt) => opt.type === selectedEventType) || CELEBRATION_OPTIONS[0],
    [selectedEventType]
  );

  // Compute live celebration title for preview
  const celebrationTitlePreview = useMemo(() => {
    if (selectedEventType === 'birthday') {
      if (!birthdayCelebrant.trim()) return 'Your birthday celebration';
      return birthdayMilestone.trim()
        ? `${birthdayCelebrant.trim()}'s ${birthdayMilestone.trim()}`
        : `${birthdayCelebrant.trim()}'s birthday`;
    }
    if (selectedEventType === 'community') {
      if (!communityGroupName.trim()) return 'Your community event';
      return communityOccasion.trim()
        ? `${communityGroupName.trim()} • ${communityOccasion.trim()}`
        : communityGroupName.trim();
    }
    return weddingCoupleNames.trim() || 'Your wedding';
  }, [selectedEventType, birthdayCelebrant, birthdayMilestone, communityGroupName, communityOccasion, weddingCoupleNames]);

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
    <div className="w-full max-w-5xl mx-auto space-y-10" data-event-type={selectedEventType}>
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <Logo href="/welcome" size="lg" className="justify-center" />
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#2A2521] tracking-tight">
          How would you like to start?
        </h1>
        <p className="font-micro text-xs text-[#6B645E] uppercase tracking-[0.18em]">
          CREATE A CELEBRATION BLUEPRINT OR JOIN WITH AN INVITE CODE
        </p>
      </div>

      {/* ============================================================ */}
      {/* STEP 1: THREE LARGE PHOTO CARDS                              */}
      {/* ============================================================ */}
      {activeView === 'select' && (
        <div className="space-y-10">
          <div className="text-center">
            <Eyebrow className="justify-center">STEP 1 OF 2 · SELECT CELEBRATION</Eyebrow>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CELEBRATION_OPTIONS.map((opt) => (
              <div
                key={opt.type}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedEventType(opt.type);
                  setActiveView('create');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedEventType(opt.type);
                    setActiveView('create');
                  }
                }}
                className="group relative bg-[#FCFBF8] border border-[#E4DED6] hover:border-[#2A2521] transition-all duration-300 flex flex-col overflow-hidden text-left cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#2A2521] focus:ring-offset-2"
              >
                {/* Large Photo Header */}
                <div className="relative w-full h-52 sm:h-60 overflow-hidden bg-[#F1EDE8]">
                  <Photo
                    imageKey={opt.imageKey}
                    aspectRatio="photo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2A2521]/75 via-[#2A2521]/20 to-transparent" />
                  
                  {/* Badge */}
                  <div className="absolute top-4 left-4">
                    <span
                      className="font-micro text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 text-white bg-black/60 backdrop-blur-xs border border-white/20 font-medium"
                    >
                      {opt.eyebrow}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="font-serif text-2xl font-normal text-white drop-shadow-xs">
                      {opt.title}
                    </h2>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <p className="font-sans text-xs sm:text-sm text-[#6B645E] leading-relaxed">
                    {opt.description}
                  </p>

                  <div className="pt-4 border-t border-[#E4DED6] flex items-center justify-between">
                    <span
                      className="font-micro text-xs uppercase tracking-[0.18em] font-medium transition-colors"
                      style={{ color: opt.accentDark }}
                    >
                      {opt.type === 'wedding'
                        ? 'Plan a wedding'
                        : opt.type === 'birthday'
                        ? 'Plan a birthday'
                        : 'Plan a community event'}
                    </span>
                    <div
                      className="w-8 h-8 border border-[#E4DED6] flex items-center justify-center bg-white group-hover:border-[#2A2521] transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-[#2A2521] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quiet Secondary Join Option */}
          <div className="pt-8 border-t border-[#E4DED6] text-center">
            <button
              type="button"
              onClick={() => setActiveView('join')}
              className="inline-flex items-center gap-2 font-micro text-xs text-[#6B645E] hover:text-[#2A2521] uppercase tracking-[0.18em] transition-colors cursor-pointer focus:outline-hidden focus:underline py-2 px-3"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Already planning with family? Join with an invite code →</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: DETAILS FORM WITH LIVE BLUEPRINT PREVIEW CARD        */}
      {/* ============================================================ */}
      {activeView === 'create' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-[#E4DED6] pb-4">
            <Eyebrow>STEP 2 OF 2 · CELEBRATION DETAILS</Eyebrow>
            <button
              type="button"
              onClick={() => setActiveView('select')}
              className="font-micro text-xs text-[#6B645E] hover:text-[#2A2521] uppercase tracking-[0.16em] flex items-center gap-1.5 cursor-pointer focus:outline-hidden focus:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change celebration type</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-[#E4DED6] p-6 sm:p-8 space-y-6">
              <div className="border-b border-[#E4DED6] pb-4">
                <span
                  className="font-micro text-[11px] uppercase tracking-[0.2em] font-medium block mb-1"
                  style={{ color: activeOption.accentDark }}
                >
                  {activeOption.eyebrow} BLUEPRINT
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521]">
                  Tell Maya about your {selectedEventType}
                </h2>
                <p className="text-xs text-[#6B645E] mt-1 leading-relaxed">
                  These details seed your celebration Home. Maya will personalize budget, timelines, and questions accordingly.
                </p>
              </div>

              <form onSubmit={handleCreateHome} className="space-y-5">
                {createError && (
                  <div
                    role="alert"
                    className="p-3.5 bg-[#F1EDE8] border border-[var(--accent-dark)]/40 text-xs text-[var(--accent-dark)]"
                  >
                    {createError}
                  </div>
                )}

                {/* Host Name Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="host-name"
                    className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em]"
                  >
                    Your Name (Host / Organiser) *
                  </label>
                  <input
                    id="host-name"
                    type="text"
                    placeholder="e.g. Rohan Sharma"
                    value={hostDisplayName}
                    onChange={(e) => setHostDisplayName(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                    required
                  />
                </div>

                {/* Wedding Specific */}
                {selectedEventType === 'wedding' && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="wedding-couple"
                      className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em]"
                    >
                      Couple Names *
                    </label>
                    <input
                      id="wedding-couple"
                      type="text"
                      placeholder="e.g. Aarav & Diya"
                      value={weddingCoupleNames}
                      onChange={(e) => setWeddingCoupleNames(e.target.value)}
                      className="w-full px-4 py-3 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                      required
                    />
                  </div>
                )}

                {/* Birthday Specific */}
                {selectedEventType === 'birthday' && (
                  <>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="birthday-celebrant"
                        className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em]"
                      >
                        Who is the birthday for? *
                      </label>
                      <input
                        id="birthday-celebrant"
                        type="text"
                        placeholder="e.g. Arjun, my son or Dad"
                        value={birthdayCelebrant}
                        onChange={(e) => setBirthdayCelebrant(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="birthday-milestone"
                        className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em]"
                      >
                        Age or Milestone
                      </label>
                      <input
                        id="birthday-milestone"
                        type="text"
                        placeholder="e.g. 1st Birthday, 18th Milestone, or 60th Shashti Poorthi"
                        value={birthdayMilestone}
                        onChange={(e) => setBirthdayMilestone(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                      />
                    </div>
                  </>
                )}

                {/* Community Specific */}
                {selectedEventType === 'community' && (
                  <>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="community-group"
                        className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em]"
                      >
                        Organising Committee / Society Name *
                      </label>
                      <input
                        id="community-group"
                        type="text"
                        placeholder="e.g. Sahyadri Heights Cultural Committee"
                        value={communityGroupName}
                        onChange={(e) => setCommunityGroupName(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="community-occasion"
                        className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em]"
                      >
                        Occasion / Festival
                      </label>
                      <input
                        id="community-occasion"
                        type="text"
                        placeholder="e.g. Navratri Garba Utsav or Diwali Mela"
                        value={communityOccasion}
                        onChange={(e) => setCommunityOccasion(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                      />
                    </div>
                  </>
                )}

                {/* Date */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="celebration-date"
                    className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em]"
                  >
                    Target Date or Month
                  </label>
                  <input
                    id="celebration-date"
                    type="text"
                    placeholder="e.g. 18 December 2026 or December 2026"
                    value={celebrationDate}
                    onChange={(e) => setCelebrationDate(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="celebration-city"
                    className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em]"
                  >
                    {selectedEventType === 'community' ? 'City / Society Ground' : 'City / Location'}
                  </label>
                  <input
                    id="celebration-city"
                    type="text"
                    placeholder="e.g. Pune, Bengaluru, or Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E4DED6] bg-white text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                  />
                </div>

                <div className="pt-3">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isCreatingHome}
                    className="w-full min-h-[50px] text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: activeOption.accentDark }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isCreatingHome ? 'Creating Celebration Blueprint...' : 'Create Home & Meet Maya'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            </div>

            {/* Live Preview Card Column (5 cols) */}
            <div className="lg:col-span-5 sticky top-8 space-y-4">
              <div className="bg-[#FCFBF8] border border-[#E4DED6] overflow-hidden shadow-xs">
                {/* Preview Image */}
                <div className="relative w-full h-44 overflow-hidden bg-[#F1EDE8]">
                  <Photo
                    imageKey={activeOption.imageKey}
                    aspectRatio="photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2A2521]/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span
                      className="font-micro text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 text-white bg-black/60 backdrop-blur-xs font-medium"
                    >
                      LIVE BLUEPRINT PREVIEW
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="font-micro text-[10px] uppercase tracking-[0.16em] text-white/80">
                      {activeOption.eyebrow}
                    </p>
                    <p className="font-serif text-xl font-normal truncate">
                      {celebrationTitlePreview}
                    </p>
                  </div>
                </div>

                {/* Preview Details */}
                <div className="p-5 space-y-4 bg-[#FCFBF8]">
                  <div className="space-y-2.5 text-xs text-[#2A2521]">
                    <div className="flex items-center gap-2.5 text-[#6B645E]">
                      <User className="w-3.5 h-3.5 shrink-0 text-[#2A2521]" />
                      <span className="font-micro uppercase tracking-wider text-[11px] text-[#6B645E]">Host:</span>
                      <span className="font-medium text-[#2A2521] truncate">
                        {hostDisplayName.trim() || 'You (Host)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-[#6B645E]">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-[#2A2521]" />
                      <span className="font-micro uppercase tracking-wider text-[11px] text-[#6B645E]">Date:</span>
                      <span className="font-medium text-[#2A2521] truncate">
                        {celebrationDate.trim() || 'To be decided with Maya'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-[#6B645E]">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#2A2521]" />
                      <span className="font-micro uppercase tracking-wider text-[11px] text-[#6B645E]">City:</span>
                      <span className="font-medium text-[#2A2521] truncate">
                        {city.trim() || 'To be confirmed'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F1EDE8] border-t border-[#E4DED6] text-[11px] text-[#6B645E] leading-relaxed">
                    <p className="font-medium text-[#2A2521] mb-1">What happens next?</p>
                    Maya greets you in your celebration space, clarifies your vision one question at a time, and builds an honest plan tailored to your budget.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* JOIN HOME WITH INVITE CODE                                   */}
      {/* ============================================================ */}
      {activeView === 'join' && (
        <div className="max-w-md mx-auto bg-white border border-[#E4DED6] p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E4DED6] pb-4">
            <div>
              <span className="font-micro text-[11px] uppercase tracking-[0.2em] text-[#94512F] font-medium block">
                FAMILY & COMMITTEE
              </span>
              <h2 className="font-serif text-2xl font-normal text-[#2A2521] mt-1">
                Join with Invite Code
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('select')}
              className="font-micro text-xs text-[#6B645E] hover:text-[#2A2521] uppercase tracking-[0.16em] flex items-center gap-1 cursor-pointer focus:outline-hidden focus:underline"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back</span>
            </button>
          </div>

          <p className="text-xs text-[#6B645E] leading-relaxed">
            Enter the 8-character invite code provided by the celebration host or committee organiser.
          </p>

          <form onSubmit={handleJoinHome} className="space-y-4">
            {joinError && (
              <div
                role="alert"
                className="p-3 bg-[#F1EDE8] border border-[var(--accent-dark)]/40 text-xs text-[var(--accent-dark)]"
              >
                {joinError}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="invite-code"
                className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em]"
              >
                Invite Code
              </label>
              <input
                id="invite-code"
                type="text"
                placeholder="e.g. MIH-2026"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-[#E4DED6] bg-white text-base tracking-widest font-mono text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden uppercase min-h-[44px]"
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isJoining}
              className="w-full min-h-[48px] bg-[#94512F] hover:bg-[#A8603E] text-white flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isJoining ? 'Joining Home...' : 'Join Celebration Home'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function StartPage() {
  return (
    <div className="min-h-screen w-full bg-[#FCFBF8] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Suspense fallback={<div className="text-xs text-[#6B645E]">Loading start options...</div>}>
        <StartForm />
      </Suspense>
    </div>
  );
}
