'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { SUPPORTED_LANGUAGES } from '@/lib/utils/i18n';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Modal,
  Toast,
} from '@/components/ui';
import {
  RotateCcw,
  LogOut,
  Globe,
  User,
  Volume2,
  Lock,
  Calendar,
  Check,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut, updateUserLanguage } = useAuth();

  // Local settings state
  const [voiceSpeakerEnabled, setVoiceSpeakerEnabled] = useState(true);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [honestyPreference, setHonestyPreference] = useState<'gentle' | 'balanced' | 'straight-to-the-point'>('balanced');
  const [homeDetails, setHomeDetails] = useState<{
    coupleNames: string;
    eventType: string;
    date?: string;
    city?: string;
  } | null>(null);

  // Modals
  const [isRestartOnboardingModalOpen, setIsRestartOnboardingModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const isOwner = user?.permission === 'couple';

  // Load voice settings from localStorage
  useEffect(() => {
    try {
      const savedSpeaker = localStorage.getItem('mih_voice_speaker');
      if (savedSpeaker !== null) {
        setVoiceSpeakerEnabled(savedSpeaker === 'true');
      }
    } catch {}
  }, []);

  const handleToggleVoiceSpeaker = () => {
    const nextVal = !voiceSpeakerEnabled;
    setVoiceSpeakerEnabled(nextVal);
    try {
      localStorage.setItem('mih_voice_speaker', String(nextVal));
    } catch {}
    setToast({
      message: nextVal ? 'Spoken audio replies enabled' : 'Spoken audio replies muted',
      type: 'info',
    });
  };

  // Load existing style and home profile from server
  useEffect(() => {
    if (!user || !user.homeId) return;

    fetch(`/api/settings?homeId=${user.homeId}&uid=${user.uid}`, {
      headers: {
        'x-member-uid': user.uid,
        'x-home-id': user.homeId,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.communicationStyle?.honesty_preference) {
          setHonestyPreference(data.communicationStyle.honesty_preference);
        }
      })
      .catch((e) => console.error('Failed to load settings:', e));

    fetch(`/api/homes/${user.homeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.home) {
          setHomeDetails({
            coupleNames: data.home.coupleNames || 'Our Celebration',
            eventType: data.home.eventType || 'wedding',
            date: data.home.profile?.date,
            city: data.home.profile?.city,
          });
        }
      })
      .catch((e) => console.error('Failed to load home details:', e));
  }, [user]);

  // Handle Maya style change (Owner only)
  const handleStyleChange = async (pref: 'gentle' | 'balanced' | 'straight-to-the-point') => {
    setHonestyPreference(pref);
    if (!user || !user.homeId) return;

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': user.uid,
          'x-home-id': user.homeId,
        },
        body: JSON.stringify({
          action: 'update_communication',
          honestyPreference: pref,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: "Maya's advice style updated!", type: 'success' });
      } else {
        setToast({ message: data.error || 'Could not update style', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error updating style', type: 'error' });
    }
  };

  // Update user display name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || isUpdatingName) return;

    setIsUpdatingName(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          name: displayName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Name updated successfully', type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to update name', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error updating name', type: 'error' });
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Restart Onboarding in Chat
  const handleConfirmRestartOnboarding = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/maya/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': user?.uid || '',
          'x-home-id': user?.homeId || '',
        },
        body: JSON.stringify({ homeId: user?.homeId, uid: user?.uid }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Conversation restarted with Maya', type: 'success' });
        setIsRestartOnboardingModalOpen(false);
        router.push('/chat');
      } else {
        setToast({ message: data.error || 'Could not restart chat', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error restarting conversation', type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.push('/welcome');
  };

  return (
    <AppShell currentTab="settings">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Modal: Restart Onboarding */}
      <Modal
        isOpen={isRestartOnboardingModalOpen}
        onClose={() => setIsRestartOnboardingModalOpen(false)}
        title="Start Fresh with Maya?"
        description="This will clear your conversation history in Chat and start over with Maya's opening celebration questions."
        icon={<RotateCcw className="w-5 h-5 text-[#94512F]" strokeWidth={1.5} />}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRestartOnboardingModalOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmRestartOnboarding}
              disabled={isActionLoading}
              className="!bg-[#2A2521] !text-white"
            >
              {isActionLoading ? 'Restarting…' : 'Start Fresh'}
            </Button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Header */}
        <div className="pb-6 border-b border-[#E4DED6]">
          <span className="font-micro text-[11px] text-[#94512F] uppercase tracking-[0.2em] font-medium block mb-1">
            PREFERENCES & ACCOUNT
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#2A2521]">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#6B645E] mt-1 font-sans">
            Manage your personal profile, preferred language, voice assistant, and celebration parameters.
          </p>
        </div>

        {/* 1. Profile & Language Card */}
        <Card className="border border-[#E4DED6] bg-white p-6 sm:p-8 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-[#E4DED6]">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-[#94512F]" />
              <CardTitle className="text-xl">Profile & Language</CardTitle>
            </div>
            <CardDescription className="text-xs text-[#6B645E]">
              Your identity in the family council and regional dialect for Maya&apos;s responses.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            <form onSubmit={handleSaveName} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label htmlFor="settings-name" className="block font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em]">
                  Display Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="settings-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 border border-[#E4DED6] bg-[#FCFBF8] text-sm text-[#2A2521] focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] outline-hidden min-h-[44px]"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isUpdatingName || !displayName.trim() || displayName === user?.name}
                    className="bg-[#2A2521] text-white hover:bg-black text-xs shrink-0 min-h-[44px]"
                  >
                    {isUpdatingName ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            </form>

            <div className="space-y-3 pt-4 border-t border-[#E4DED6]">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#94512F]" />
                <span className="font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em]">
                  Preferred Language & Native Dialect
                </span>
              </div>
              <p className="text-xs text-[#6B645E]">
                Maya understands and replies in your choice of language with culturally nuanced advice.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = (user?.preferredLanguage || 'en') === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        updateUserLanguage(lang.code);
                        setToast({
                          message: `Language updated to ${lang.name} (${lang.nativeName})`,
                          type: 'success',
                        });
                      }}
                      className={`p-3 border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#2A2521] bg-[#F1EDE8] shadow-xs'
                          : 'border-[#E4DED6] bg-white hover:border-[#2A2521]'
                      }`}
                    >
                      <div className="font-serif text-sm font-medium text-[#2A2521]">
                        {lang.name}
                      </div>
                      <div className="text-xs text-[#6B645E] mt-0.5">
                        {lang.nativeName}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Celebration Details Card */}
        <Card className="border border-[#E4DED6] bg-white p-6 sm:p-8 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-[#E4DED6]">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#94512F]" />
              <CardTitle className="text-xl">Celebration Details</CardTitle>
            </div>
            <CardDescription className="text-xs text-[#6B645E]">
              Core attributes of your celebration Home.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#FCFBF8] border border-[#E4DED6] space-y-1">
              <span className="font-micro text-[10px] text-[#6B645E] uppercase tracking-wider block">
                Occasion Title
              </span>
              <p className="font-serif text-base text-[#2A2521] font-medium">
                {homeDetails?.coupleNames || 'Our Celebration'}
              </p>
            </div>

            <div className="p-4 bg-[#FCFBF8] border border-[#E4DED6] space-y-1">
              <span className="font-micro text-[10px] text-[#6B645E] uppercase tracking-wider block">
                Celebration Type
              </span>
              <p className="font-serif text-base text-[#2A2521] font-medium capitalize">
                {homeDetails?.eventType || 'Wedding'}
              </p>
            </div>

            <div className="p-4 bg-[#FCFBF8] border border-[#E4DED6] space-y-1">
              <span className="font-micro text-[10px] text-[#6B645E] uppercase tracking-wider block">
                Target Date
              </span>
              <p className="font-sans text-sm text-[#2A2521]">
                {homeDetails?.date || 'To be determined with Maya'}
              </p>
            </div>

            <div className="p-4 bg-[#FCFBF8] border border-[#E4DED6] space-y-1">
              <span className="font-micro text-[10px] text-[#6B645E] uppercase tracking-wider block">
                City / Location
              </span>
              <p className="font-sans text-sm text-[#2A2521]">
                {homeDetails?.city || 'To be confirmed'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Voice & Maya Persona Card */}
        <Card className="border border-[#E4DED6] bg-white p-6 sm:p-8 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-[#E4DED6]">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-[#94512F]" />
              <CardTitle className="text-xl">Voice & Maya Persona</CardTitle>
            </div>
            <CardDescription className="text-xs text-[#6B645E]">
              Customize voice assistant playback and Maya&apos;s consultative candour.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            {/* Spoken audio toggle */}
            <div className="flex items-center justify-between p-4 bg-[#FCFBF8] border border-[#E4DED6]">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-[#2A2521] block">
                  Read Maya&apos;s responses aloud
                </span>
                <p className="text-xs text-[#6B645E]">
                  Uses browser speech synthesis in your chosen dialect.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleVoiceSpeaker}
                className={`px-3 py-1.5 font-micro uppercase text-xs tracking-wider border cursor-pointer transition-colors ${
                  voiceSpeakerEnabled
                    ? 'bg-[#2A2521] text-white border-[#2A2521]'
                    : 'bg-white text-[#6B645E] border-[#E4DED6]'
                }`}
              >
                {voiceSpeakerEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>

            {/* Maya Advice Style (Owner Only) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.16em] block">
                    Maya&apos;s Advice Style
                  </span>
                  <p className="text-xs text-[#6B645E] mt-0.5">
                    How direct Maya should be when budgets stretch or schedules compress.
                  </p>
                </div>
                {!isOwner && (
                  <Badge variant="outline" size="sm" className="font-micro text-[10px]">
                    Owner Controlled
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {(['gentle', 'balanced', 'straight-to-the-point'] as const).map((style) => {
                  const isSelected = honestyPreference === style;
                  return (
                    <button
                      key={style}
                      type="button"
                      disabled={!isOwner}
                      onClick={() => handleStyleChange(style)}
                      className={`p-3.5 border text-left transition-all ${
                        !isOwner
                          ? 'opacity-60 cursor-not-allowed'
                          : 'cursor-pointer hover:border-[#2A2521]'
                      } ${
                        isSelected
                          ? 'border-[#2A2521] bg-[#F1EDE8] shadow-xs'
                          : 'border-[#E4DED6] bg-white'
                      }`}
                    >
                      <div className="font-serif text-sm font-medium text-[#2A2521] capitalize flex items-center justify-between">
                        <span>{style.replace(/-/g, ' ')}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#94512F]" />}
                      </div>
                      <p className="text-[11px] text-[#6B645E] mt-1 leading-relaxed">
                        {style === 'gentle' && 'Subtle recommendations and polite nudges.'}
                        {style === 'balanced' && 'Honest numbers with tactful alternatives.'}
                        {style === 'straight-to-the-point' && 'Direct reality checks and zero fluff.'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Privacy, Data & Sign Out Card */}
        <Card className="border border-[#E4DED6] bg-white p-6 sm:p-8 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-[#E4DED6]">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-[#94512F]" />
              <CardTitle className="text-xl">Privacy, Reset & Session</CardTitle>
            </div>
            <CardDescription className="text-xs text-[#6B645E]">
              Account access, conversation reset, and confidential budget controls.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="p-4 bg-[#FCFBF8] border border-[#E4DED6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-[#2A2521] block">
                  Restart Conversation with Maya
                </span>
                <p className="text-xs text-[#6B645E] mt-0.5">
                  Resets the chat salon history and begins afresh with Maya&apos;s welcome.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRestartOnboardingModalOpen(true)}
                className="border-[#E4DED6] text-[#2A2521] hover:bg-[#F1EDE8] text-xs shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                <span>Start Fresh</span>
              </Button>
            </div>

            <div className="p-4 bg-[#FCFBF8] border border-[#E4DED6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-[#2A2521] block">
                  Sign Out of Session
                </span>
                <p className="text-xs text-[#6B645E] mt-0.5">
                  Signed in as <strong className="text-[#2A2521] font-normal">{user?.email || user?.name || 'Guest'}</strong>
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-[#94512F] text-[#94512F] hover:bg-[#F1EDE8] text-xs shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
