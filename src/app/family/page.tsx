'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { getLanguageName } from '@/lib/utils/i18n';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Toast } from '@/components/ui';
import { Copy, Globe, Lock, Check, UserCheck, Share2 } from 'lucide-react';
import { RoomsGrid } from '@/components/family/RoomsGrid';
import { DecisionsLog } from '@/components/family/DecisionsLog';
import { Room, Decision } from '@/types/firestore';
import { getRoleLabel } from '@/lib/utils/roles';

export default function FamilyPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [ideaCounts, setIdeaCounts] = useState<Record<string, number>>({});
  const [inviteCode, setInviteCode] = useState('');
  const [homeName, setHomeName] = useState('Our Celebration');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingMember, setIsUpdatingMember] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const isCurrentUserCouple = user?.permission === 'couple';

  const fetchData = useCallback(async () => {
    if (!user || !user.homeId) return;

    try {
      // 1. Fetch Members
      const membersRes = await fetch(`/api/family?homeId=${user.homeId}&uid=${user.uid}`);
      if (membersRes.ok) {
        const data = await membersRes.json();
        if (data.success) {
          setMembers(data.members || []);
          if (data.inviteCode) setInviteCode(data.inviteCode);
          if (data.homeName) setHomeName(data.homeName);
        }
      }

      // 2. Fetch Rooms
      const roomsRes = await fetch(`/api/homes/${user.homeId}/rooms`);
      let loadedRooms: Room[] = [];
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        if (roomsData.success && roomsData.rooms) {
          loadedRooms = roomsData.rooms;
          setRooms(loadedRooms);
        }
      }

      // 3. Fetch Idea Counts for each room
      const counts: Record<string, number> = {};
      await Promise.all(
        loadedRooms.map(async (r) => {
          try {
            const ideasRes = await fetch(`/api/homes/${user.homeId}/rooms/${r.id}/ideas`);
            if (ideasRes.ok) {
              const ideasData = await ideasRes.json();
              if (ideasData.success && ideasData.ideas) {
                counts[r.id.toLowerCase()] = ideasData.ideas.length;
              }
            }
          } catch {
            counts[r.id.toLowerCase()] = 0;
          }
        })
      );
      setIdeaCounts(counts);

      // 4. Fetch Decisions
      const decisionsRes = await fetch('/api/decisions');
      if (decisionsRes.ok) {
        const decData = await decisionsRes.json();
        if (decData.success && decData.decisions) {
          setDecisions(decData.decisions);
        }
      }
    } catch (err) {
      console.error('Failed to load family dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Generate / Copy Invite Link
  const handleCopyLink = async () => {
    if (!user?.homeId) return;

    try {
      if (isCurrentUserCouple) {
        const res = await fetch(`/api/homes/${user.homeId}/invites`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.inviteUrl) {
            await navigator.clipboard.writeText(data.inviteUrl);
            setToast({
              message: `Generated and copied invite link! Expires in 7 days.`,
              type: 'success',
            });
            return;
          }
        }
      }

      const inviteLink = `${window.location.origin}/start?code=${inviteCode}`;
      await navigator.clipboard.writeText(inviteLink);
      setToast({
        message: `Copied invite link (${inviteCode}) to clipboard!`,
        type: 'success',
      });
    } catch {
      setToast({
        message: 'Could not copy link to clipboard.',
        type: 'error',
      });
    }
  };

  // WhatsApp share helper (safe: no PII beyond celebration title)
  const handleWhatsAppShare = () => {
    const inviteLink = `${window.location.origin}/start?code=${inviteCode}`;
    const message = `Join our celebration planning for ${homeName} on Made in Heaven: ${inviteLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Permission update via PATCH /api/homes/[homeId]/members/[uid]
  const handleToggleVote = async (memberUid: string, currentPermission: string) => {
    if (!isCurrentUserCouple || !user?.homeId) return;
    setIsUpdatingMember(memberUid);

    const newCanVote = currentPermission !== 'voter';

    try {
      const res = await fetch(`/api/homes/${user.homeId}/members/${memberUid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canVote: newCanVote }),
      });

      const data = await res.json();
      if (data.success && data.member) {
        setMembers((prev) =>
          prev.map((m) => (m.uid === memberUid ? { ...m, permission: data.member.permission } : m))
        );
        setToast({
          message: `Updated voting permission for ${data.member.name} to ${data.member.permission}.`,
          type: 'success',
        });
      } else {
        setToast({
          message: data.error || 'Failed to update voting permission.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Error updating vote permission:', err);
      setToast({ message: 'Network error updating permission.', type: 'error' });
    } finally {
      setIsUpdatingMember(null);
    }
  };

  const handleToggleBudget = async (memberUid: string, currentCanSeeBudget: boolean) => {
    if (!isCurrentUserCouple || !user?.homeId) return;
    setIsUpdatingMember(memberUid);

    try {
      const res = await fetch(`/api/homes/${user.homeId}/members/${memberUid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canSeeBudget: !currentCanSeeBudget }),
      });

      const data = await res.json();
      if (data.success && data.member) {
        setMembers((prev) =>
          prev.map((m) => (m.uid === memberUid ? { ...m, canSeeBudget: data.member.canSeeBudget } : m))
        );
        setToast({
          message: `${data.member.name}'s budget access is now ${data.member.canSeeBudget ? 'visible' : 'private'}.`,
          type: 'success',
        });
      } else {
        setToast({
          message: data.error || 'Failed to update budget visibility.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Error updating budget permission:', err);
      setToast({ message: 'Network error updating budget permission.', type: 'error' });
    } finally {
      setIsUpdatingMember(null);
    }
  };

  const getRoleDescription = (permission: string) => {
    switch (permission) {
      case 'couple':
        return 'Host / Admin • Budget & Decision Owner';
      case 'voter':
        return 'Eligible Voter • Majority Voting';
      case 'advisor':
        return 'Advisor • Suggests Ideas (Cannot vote)';
      case 'viewer':
      default:
        return 'Viewer • Keeps up with plans';
    }
  };

  return (
    <AppShell currentTab="family">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Header with prominent Invite Card */}
        <div className="pb-8 border-b border-[#E4DED6] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-micro text-[11px] text-[#94512F] uppercase tracking-[0.2em] font-medium">
                CELEBRATION CIRCLE
              </span>
              <span className="text-[#6B645E]">/</span>
              <span className="font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.2em]">
                FAMILY & COUNCIL
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#2A2521] tracking-tight">
              Family & Members
            </h1>
            <p className="text-xs sm:text-sm text-[#6B645E] mt-1 font-sans max-w-xl">
              Collaborative circle for <strong className="text-[#2A2521] font-medium">{homeName}</strong>. Share ideas, vote on key decisions, and review plans together.
            </p>
          </div>

          {/* Prominent Invitation Card */}
          <div className="p-5 bg-white border border-[#E4DED6] shadow-xs space-y-3 shrink-0 lg:max-w-md w-full">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-micro text-[10px] text-[#6B645E] uppercase tracking-[0.2em] block">
                  CELEBRATION INVITE CODE
                </span>
                <span className="font-serif text-2xl font-medium text-[#2A2521] tracking-wider mt-0.5 block">
                  {inviteCode || '••••••••'}
                </span>
              </div>
              <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-wider bg-[#F1EDE8] px-2 py-0.5 border border-[#E4DED6]">
                Active
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex-1 text-xs border-[#2A2521] text-[#2A2521] hover:bg-[#F1EDE8]"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                <span>Copy Invite Link</span>
              </Button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                aria-label="Share invite via WhatsApp"
                title="Share invite via WhatsApp"
                className="p-2 border border-[#E4DED6] hover:border-[#2A2521] text-[#2A2521] hover:bg-[#F1EDE8] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 1. Collaborative Family Rooms Grid */}
        <RoomsGrid rooms={rooms} ideaCounts={ideaCounts} />

        {/* 2. Decisions Log */}
        <DecisionsLog decisions={decisions} />

        {/* 3. Member Directory List & Permissions */}
        <Card className="border border-[#E4DED6] bg-white p-0">
          <CardHeader className="p-6 border-b border-[#E4DED6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">
                Current Members ({members.length})
              </CardTitle>
              <CardDescription className="text-xs text-[#6B645E]">
                {isCurrentUserCouple
                  ? 'As host, you govern who can cast official majority ballots and view confidential budget totals.'
                  : 'Role permissions dictate who can see the private budget and cast official majority ballots.'}
              </CardDescription>
            </div>
            {isCurrentUserCouple && (
              <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.16em] border border-[#94512F]/30 bg-[#F1EDE8] px-2.5 py-1">
                Owner Controls Active
              </span>
            )}
          </CardHeader>

          <CardContent className="p-0 divide-y divide-[#E4DED6]">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-[#6B645E]">
                Loading member records...
              </div>
            ) : (
              members.map((member) => {
                const isTargetCouple = member.permission === 'couple';
                const canManageThisMember = isCurrentUserCouple && !isTargetCouple;
                const isUpdating = isUpdatingMember === member.uid;
                const canVote = member.permission === 'voter';

                return (
                  <div
                    key={member.uid}
                    className="p-5 hover:bg-[#FCFBF8] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border border-[#E4DED6] bg-[#F1EDE8] text-[#2A2521] font-mono text-xs font-medium flex items-center justify-center shrink-0">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif text-base font-medium text-[#2A2521]">
                            {member.name}
                          </span>
                          <Badge variant="outline" size="sm" className="font-micro uppercase">
                            {getRoleLabel(member.permission, 'wedding')}
                          </Badge>
                          {member.uid === user?.uid && (
                            <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.15em] border border-[#E4DED6] px-1.5 py-0.5">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B645E] mt-0.5 capitalize">
                          Relationship: <strong className="text-[#2A2521] font-normal">{member.relationship}</strong> • {getRoleDescription(member.permission)}
                        </p>
                      </div>
                    </div>

                    {/* Permissions & Controls */}
                    <div className="flex items-center gap-3 text-xs self-start sm:self-center shrink-0 flex-wrap">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1EDE8] text-[#2A2521] font-micro uppercase text-[10px] tracking-wider border border-[#E4DED6]">
                        <Globe className="w-3 h-3 text-[#6B645E]" strokeWidth={1.5} />
                        {getLanguageName(member.preferredLanguage)}
                      </span>

                      {/* Interactive owner toggles */}
                      {canManageThisMember ? (
                        <div className="flex items-center gap-2">
                          {/* Can Vote Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleVote(member.uid, member.permission)}
                            disabled={isUpdating}
                            aria-label={`Toggle voting permission for ${member.name}`}
                            className={`flex items-center gap-1.5 px-2.5 py-1 font-micro uppercase text-[10px] tracking-wider border cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#A8603E] ${
                              canVote
                                ? 'bg-[#94512F] text-white border-[#94512F]'
                                : 'bg-white text-[#6B645E] border-[#E4DED6] hover:bg-[#F1EDE8]'
                            }`}
                          >
                            <UserCheck className="w-3 h-3" strokeWidth={1.5} />
                            <span>Can Vote: {canVote ? 'ON' : 'OFF'}</span>
                          </button>

                          {/* Can See Budget Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleBudget(member.uid, member.canSeeBudget)}
                            disabled={isUpdating}
                            aria-label={`Toggle budget visibility for ${member.name}`}
                            className={`flex items-center gap-1.5 px-2.5 py-1 font-micro uppercase text-[10px] tracking-wider border cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#A8603E] ${
                              member.canSeeBudget
                                ? 'bg-[#2A2521] text-white border-[#2A2521]'
                                : 'bg-white text-[#6B645E] border-[#E4DED6] hover:bg-[#F1EDE8]'
                            }`}
                          >
                            {member.canSeeBudget ? (
                              <Check className="w-3 h-3 text-[#A8603E]" strokeWidth={2} />
                            ) : (
                              <Lock className="w-3 h-3 text-[#6B645E]" strokeWidth={1.5} />
                            )}
                            <span>Budget: {member.canSeeBudget ? 'Visible' : 'Hidden'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex items-center gap-1.5 px-2.5 py-1 font-micro uppercase text-[10px] tracking-wider border ${
                              member.canSeeBudget
                                ? 'bg-[#2A2521] text-white border-[#2A2521]'
                                : 'bg-white text-[#6B645E] border-[#E4DED6]'
                            }`}
                          >
                            {member.canSeeBudget ? (
                              <>
                                <Check className="w-3 h-3 text-[#A8603E]" strokeWidth={2} />
                                Budget Access
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-[#6B645E]" strokeWidth={1.5} />
                                Budget Private
                              </>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
