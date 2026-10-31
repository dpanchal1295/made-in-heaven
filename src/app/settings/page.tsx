'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_MEMBERS } from '@/lib/auth/AuthContext';
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
import { RotateCcw, Trash2, AlertCircle, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut, switchMember, updateUserLanguage, isDemoMode } = useAuth();

  // Local settings state
  const [voiceSpeakerEnabled, setVoiceSpeakerEnabled] = useState(true);
  const [voiceMicEnabled, setVoiceMicEnabled] = useState(true);
  const [honestyPreference, setHonestyPreference] = useState<'gentle' | 'balanced' | 'straight-to-the-point'>('balanced');
  const [budgetPrivacyCoupleOnly, setBudgetPrivacyCoupleOnly] = useState(false);
  const [notifIdeas, setNotifIdeas] = useState(true);
  const [notifVotes, setNotifVotes] = useState(true);
  const [notifMaya, setNotifMaya] = useState(true);

  // Modals for Data management
  const [isClearPlanModalOpen, setIsClearPlanModalOpen] = useState(false);
  const [isRestartOnboardingModalOpen, setIsRestartOnboardingModalOpen] = useState(false);
  const [isResetDemoModalOpen, setIsResetDemoModalOpen] = useState(false);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Load existing style from server
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
  }, [user]);

  // Handle Maya style change (Server permission check: couple only)
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
          action: 'update_style',
          honestyPreference: pref,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: "Maya's communication style updated!", type: 'success' });
      } else {
        setToast({ message: data.error || 'Could not update style', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error updating style', type: 'error' });
    }
  };

  // Confirm and Execute: Clear Plan
  const handleConfirmClearPlan = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': user?.uid || '',
          'x-home-id': user?.homeId || '',
        },
        body: JSON.stringify({ action: 'clear_plan' }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'All wedding plan tabs cleared', type: 'success' });
        setIsClearPlanModalOpen(false);
      } else {
        setToast({ message: data.error || 'Could not clear plan', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error clearing plan', type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirm and Execute: Restart Onboarding
  const handleConfirmRestartOnboarding = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': user?.uid || '',
          'x-home-id': user?.homeId || '',
        },
        body: JSON.stringify({ action: 'restart_onboarding' }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Chat onboarding restarted with Maya', type: 'success' });
        setIsRestartOnboardingModalOpen(false);
        router.push('/chat');
      } else {
        setToast({ message: data.error || 'Could not restart chat', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error restarting onboarding', type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirm and Execute: Reset All Demo Data
  const handleConfirmResetDemoData = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': user?.uid || '',
          'x-home-id': user?.homeId || '',
        },
        body: JSON.stringify({ action: 'reset_demo_data' }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'All demo data reset to default Pune wedding fixtures', type: 'success' });
        setIsResetDemoModalOpen(false);
        router.push('/home');
      } else {
        setToast({ message: data.error || 'Could not reset demo fixtures', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error resetting fixtures', type: 'error' });
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

      {/* Confirmation Modal 1: Clear Plan */}
      <Modal
        isOpen={isClearPlanModalOpen}
        onClose={() => setIsClearPlanModalOpen(false)}
        title="Clear Wedding Plan?"
        description="This will clear all 6 generated plan tabs (budget, timeline, checklist, palette, decor, and attire). Your wedding profile remains intact."
        icon={<Trash2 className="w-5 h-5 text-[#94512F]" strokeWidth={1.5} />}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearPlanModalOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmClearPlan}
              disabled={isActionLoading}
              className="!bg-[#94512F] !text-white"
            >
              {isActionLoading ? 'Clearing...' : 'Clear Plan'}
            </Button>
          </div>
        }
      />

      {/* Confirmation Modal 2: Restart Onboarding */}
      <Modal
        isOpen={isRestartOnboardingModalOpen}
        onClose={() => setIsRestartOnboardingModalOpen(false)}
        title="Restart Onboarding with Maya?"
        description="This will clear your conversation history in Chat and start over with Maya's opening welcome questions."
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
              {isActionLoading ? 'Restarting...' : 'Restart Chat'}
            </Button>
          </div>
        }
      />

      {/* Confirmation Modal 3: Reset All Demo Data */}
      <Modal
        isOpen={isResetDemoModalOpen}
        onClose={() => setIsResetDemoModalOpen(false)}
        title="Reset All Demo Data?"
        description="This will reset all wedding state back to the canonical Aarav & Diya Pune wedding fixtures (300 guests, ₹8 Lakh budget, sample family members and ideas)."
        icon={<AlertCircle className="w-5 h-5 text-[#94512F]" strokeWidth={1.5} />}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetDemoModalOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmResetDemoData}
              disabled={isActionLoading}
              className="!bg-[#94512F] !text-white"
            >
              {isActionLoading ? 'Resetting...' : 'Reset All Data'}
            </Button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 font-sans">
        {/* Header */}
        <div className="pb-6 border-b border-[#E4DED6] flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#2A2521] tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-[#6B645E] mt-1 font-sans">
              Manage your profile, Maya communication style, privacy, and demo switches.
            </p>
          </div>
          {isDemoMode && (
            <Badge variant="outline" size="sm" className="font-micro text-[#94512F]">
              DEMO MODE
            </Badge>
          )}
        </div>

        {/* DEMO HELPER: Switch Member (Shown ONLY when NEXT_PUBLIC_DEMO_MODE=true) */}
        {isDemoMode && (
          <div className="p-6 bg-[#F1EDE8] border border-[#E4DED6] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-micro text-[11px] text-[#94512F] uppercase tracking-[0.2em] font-semibold">
                  DEMO HELPER: SWITCH MEMBER
                </span>
              </div>
              <span className="font-micro text-[10px] text-[#6B645E] uppercase tracking-[0.15em]">
                TEST ROLES & BUDGET PERMISSIONS
              </span>
            </div>

            <p className="text-xs text-[#6B645E] leading-relaxed">
              Select any member below to immediately act as them across the application:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {DEMO_MEMBERS.map((member) => {
                const isActive = user?.uid === member.uid;
                return (
                  <button
                    key={member.uid}
                    type="button"
                    onClick={() => {
                      switchMember(member.uid);
                      setToast({
                        message: `Switched acting member to ${member.name}`,
                        type: 'info',
                      });
                    }}
                    className={`p-4 border text-left transition-all flex items-center justify-between gap-3 min-h-[48px] focus-visible:ring-1 focus-visible:ring-[#94512F] outline-hidden cursor-pointer ${
                      isActive
                        ? 'bg-white border-[#2A2521] ring-1 ring-[#2A2521]'
                        : 'bg-white border-[#E4DED6] hover:border-[#2A2521]/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-serif font-medium text-[#2A2521] truncate">
                          {member.name}
                        </span>
                        {isActive && (
                          <span className="font-micro text-[10px] text-white bg-[#2A2521] px-1.5 py-0.5 uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="font-micro text-[10px] text-[#6B645E] block mt-1 uppercase tracking-wider">
                        {member.relationship} • {member.permission} • {member.preferredLanguage.toUpperCase()}
                      </span>
                    </div>

                    <span
                      className={`font-micro text-[10px] uppercase tracking-wider px-2 py-0.5 border ${
                        member.canSeeBudget
                          ? 'border-[#2A2521] text-[#2A2521] bg-white'
                          : 'border-[#E4DED6] text-[#6B645E] bg-[#F1EDE8]'
                      }`}
                    >
                      {member.canSeeBudget ? 'Budget visible' : 'Budget hidden'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 1: Profile */}
        <Card className="border border-[#E4DED6] bg-white p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-[#E4DED6]">
            <CardTitle className="text-lg">
              1. Profile Information
            </CardTitle>
            <CardDescription className="text-xs text-[#6B645E]">
              Your identity in this wedding Home.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-[#E4DED6] bg-[#F1EDE8] text-[#2A2521] font-mono text-sm font-medium flex items-center justify-center shrink-0">
                {user?.name.slice(0, 2).toUpperCase() || 'MIH'}
              </div>
              <div className="space-y-1">
                <p className="font-serif text-lg font-medium text-[#2A2521]">{user?.name || 'Aarav & Diya'}</p>
                <div className="flex items-center gap-2 text-xs text-[#6B645E]">
                  <span className="capitalize">{user?.relationship || 'Couple'}</span>
                  <span>•</span>
                  <Badge variant="outline" size="sm" className="font-micro uppercase">
                    {user?.permission.toUpperCase() || 'COUPLE'}
                  </Badge>
                </div>
                {user?.emailOrPhone && (
                  <p className="text-xs text-[#6B645E] font-mono">{user.emailOrPhone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Language */}
        <Card className="border border-[#E4DED6] bg-white p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-[#E4DED6]">
            <CardTitle className="text-lg">
              2. Preferred Language
            </CardTitle>
            <CardDescription className="text-xs text-[#6B645E]">
              Maya replies and greets you in this language.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = user?.preferredLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => updateUserLanguage(lang.code)}
                    className={`p-3.5 border text-center transition-all min-h-[48px] focus-visible:ring-1 focus-visible:ring-[#94512F] outline-hidden cursor-pointer ${
                      isSelected
                        ? 'bg-[#2A2521] text-white border-[#2A2521]'
                        : 'bg-white border-[#E4DED6] text-[#2A2521] hover:bg-[#F1EDE8]'
                    }`}
                  >
                    <span className="block text-sm font-medium leading-tight">
                      {lang.nativeLabel}
                    </span>
                    <span
                      className={`font-micro text-[10px] block mt-1 uppercase tracking-wider ${
                        isSelected ? 'text-white/70' : 'text-[#6B645E]'
                      }`}
                    >
                      {lang.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Voice */}
        <Card className="border border-[#E4DED6] bg-white p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-[#E4DED6]">
            <CardTitle className="text-lg">
              3. Voice & Speech Controls
            </CardTitle>
            <CardDescription className="text-xs text-[#6B645E]">
              Controls for Maya text-to-speech replies and speech-to-text mic input.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2 space-y-3">
            <div className="flex items-center justify-between p-4 bg-[#FCFBF8] border border-[#E4DED6]">
              <div>
                <p className="text-xs font-medium text-[#2A2521]">Speak Maya's replies aloud</p>
                <p className="text-xs text-[#6B645E] mt-0.5">
                  Reads Maya's consultative answers using speech synthesis
                </p>
              </div>
              <input
                type="checkbox"
                checked={voiceSpeakerEnabled}
                onChange={(e) => setVoiceSpeakerEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#2A2521] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FCFBF8] border border-[#E4DED6]">
              <div>
                <p className="text-xs font-medium text-[#2A2521]">Enable microphone voice input</p>
                <p className="text-xs text-[#6B645E] mt-0.5">
                  Show mic chip in Chat for speaking your wedding requests
                </p>
              </div>
              <input
                type="checkbox"
                checked={voiceMicEnabled}
                onChange={(e) => setVoiceMicEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#2A2521] cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Maya's Style */}
        <Card className="border border-[#E4DED6] bg-white p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-[#E4DED6]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                4. Maya's Communication Style
              </CardTitle>
              {user?.permission !== 'couple' && (
                <Badge variant="outline" size="sm" className="font-micro">
                  COUPLE ONLY
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-[#6B645E]">
              How Maya delivers reality checks when budget or guest counts do not fit.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  key: 'gentle',
                  title: 'Gentle',
                  desc: 'Warm, empathetic, soft recommendations with encouraging guidance.',
                },
                {
                  key: 'balanced',
                  title: 'Balanced',
                  desc: 'Thoughtful and supportive, with realistic trade-offs clearly highlighted.',
                },
                {
                  key: 'straight-to-the-point',
                  title: 'Direct',
                  desc: 'Crisp and numbers-first with immediate alternative options.',
                },
              ].map((style) => {
                const isSelected = honestyPreference === style.key;
                const isDisabled = user?.permission !== 'couple';
                return (
                  <button
                    key={style.key}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleStyleChange(style.key as any)}
                    className={`p-4 border text-left transition-all min-h-[96px] focus-visible:ring-1 focus-visible:ring-[#94512F] outline-hidden ${
                      isSelected
                        ? 'bg-[#F1EDE8] border-[#2A2521] ring-1 ring-[#2A2521]'
                        : 'bg-white border-[#E4DED6] hover:bg-[#FCFBF8]'
                    } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-serif text-base font-medium text-[#2A2521]">
                        {style.title}
                      </span>
                      {isSelected && (
                        <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-wider font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B645E] leading-relaxed">
                      {style.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Privacy */}
        <Card className="border border-[#E4DED6] bg-white p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-[#E4DED6]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                5. Privacy & Budget Access
              </CardTitle>
              {user?.permission !== 'couple' && (
                <Badge variant="outline" size="sm" className="font-micro">
                  COUPLE ONLY
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-[#6B645E]">
              Determine who in your family circle can inspect exact INR budget numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="flex items-center justify-between p-4 bg-[#FCFBF8] border border-[#E4DED6]">
              <div>
                <p className="text-xs font-medium text-[#2A2521]">
                  Strict Couple-Only Budget View
                </p>
                <p className="text-xs text-[#6B645E] mt-0.5">
                  When active, only the couple sees the Private Budget. Other members see only cost tiers.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={user?.permission !== 'couple'}
                checked={budgetPrivacyCoupleOnly}
                onChange={(e) => setBudgetPrivacyCoupleOnly(e.target.checked)}
                className="w-4 h-4 accent-[#2A2521] cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Notifications */}
        <Card className="border border-[#E4DED6] bg-white p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-[#E4DED6]">
            <CardTitle className="text-lg">
              6. Notifications
            </CardTitle>
            <CardDescription className="text-xs text-[#6B645E]">
              Stay informed of new family suggestions and vote deadlines.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2 space-y-3">
            <div className="flex items-center justify-between p-4 bg-[#FCFBF8] border border-[#E4DED6]">
              <div>
                <p className="text-xs font-medium text-[#2A2521]">Family ideas & comments</p>
                <p className="text-xs text-[#6B645E] mt-0.5">Alerts when mother, brother, or friends post ideas</p>
              </div>
              <input
                type="checkbox"
                checked={notifIdeas}
                onChange={(e) => setNotifIdeas(e.target.checked)}
                className="w-4 h-4 accent-[#2A2521] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FCFBF8] border border-[#E4DED6]">
              <div>
                <p className="text-xs font-medium text-[#2A2521]">Voting deadlines & reminders</p>
                <p className="text-xs text-[#6B645E] mt-0.5">Alerts when a majority vote opens or closes</p>
              </div>
              <input
                type="checkbox"
                checked={notifVotes}
                onChange={(e) => setNotifVotes(e.target.checked)}
                className="w-4 h-4 accent-[#2A2521] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FCFBF8] border border-[#E4DED6]">
              <div>
                <p className="text-xs font-medium text-[#2A2521]">Maya planning tips & milestone alerts</p>
                <p className="text-xs text-[#6B645E] mt-0.5">City-specific vendor reminders for upcoming dates</p>
              </div>
              <input
                type="checkbox"
                checked={notifMaya}
                onChange={(e) => setNotifMaya(e.target.checked)}
                className="w-4 h-4 accent-[#2A2521] cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 7: Data Management */}
        <Card className="border border-[#E4DED6] bg-white p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-[#E4DED6]">
            <CardTitle className="text-lg">
              7. Data & Demo Reset Controls
            </CardTitle>
            <CardDescription className="text-xs text-[#6B645E]">
              Clear plan tabs or restore default demo fixtures. All destructive actions require confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2 space-y-3">
            <div className="flex items-center justify-between p-4 border border-[#E4DED6] bg-white flex-wrap gap-3">
              <div>
                <p className="text-xs font-medium text-[#2A2521]">Clear Wedding Plan</p>
                <p className="text-xs text-[#6B645E] mt-0.5">Resets all 6 generated tabs to blank</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClearPlanModalOpen(true)}
                className="text-xs text-[#94512F] border-[#E4DED6] hover:bg-[#F1EDE8]"
              >
                Clear Plan
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-[#E4DED6] bg-white flex-wrap gap-3">
              <div>
                <p className="text-xs font-medium text-[#2A2521]">Restart Onboarding Chat</p>
                <p className="text-xs text-[#6B645E] mt-0.5">Clears chat messages and resets onboarding conversation</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRestartOnboardingModalOpen(true)}
                className="text-xs text-[#2A2521] border-[#E4DED6] hover:bg-[#F1EDE8]"
              >
                Restart Chat
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-[#E4DED6] bg-white flex-wrap gap-3">
              <div>
                <p className="text-xs font-medium text-[#2A2521]">Reset All Demo Data</p>
                <p className="text-xs text-[#6B645E] mt-0.5">Restores canonical Aarav & Diya Pune fixtures</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResetDemoModalOpen(true)}
                className="text-xs text-[#94512F] border-[#94512F]/40 hover:bg-[#F1EDE8]"
              >
                Reset All Demo Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 8: About & Sign Out */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E4DED6]">
          <div>
            <p className="font-serif text-base font-medium text-[#2A2521]">
              Made in Heaven • Version 1.0
            </p>
            <p className="text-xs text-[#6B645E] mt-0.5">
              Consultative AI wedding manager tailored for Indian celebrations.
            </p>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={handleSignOut}
            className="w-full sm:w-auto text-xs border-[#E4DED6] text-[#2A2521] hover:bg-[#F1EDE8]"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
