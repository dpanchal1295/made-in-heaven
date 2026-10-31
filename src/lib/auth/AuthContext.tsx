'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MemberPermission, IndianLanguage } from '@/types/firestore';

export interface AuthUser {
  uid: string;
  name: string;
  emailOrPhone?: string;
  relationship: string;
  permission: MemberPermission;
  preferredLanguage: IndianLanguage | string;
  canSeeBudget: boolean;
  homeId: string | null;
}

export interface DemoMemberOption {
  uid: string;
  name: string;
  homeId: string;
  homeName: string;
  eventType: 'wedding' | 'birthday' | 'community';
  relationship: string;
  permission: MemberPermission;
  preferredLanguage: string;
  canSeeBudget: boolean;
  label: string;
}

export const DEMO_MEMBERS: DemoMemberOption[] = [
  // Demo 1: Wedding (Aarav & Diya)
  {
    uid: 'demo-aarav-1',
    name: 'Aarav',
    homeId: 'demo-home-1',
    homeName: 'Aarav & Diya (Wedding)',
    eventType: 'wedding',
    relationship: 'couple',
    permission: 'couple',
    preferredLanguage: 'en',
    canSeeBudget: true,
    label: 'Aarav (Groom • Couple • Wedding)',
  },
  {
    uid: 'demo-diya-1',
    name: 'Diya',
    homeId: 'demo-home-1',
    homeName: 'Aarav & Diya (Wedding)',
    eventType: 'wedding',
    relationship: 'couple',
    permission: 'couple',
    preferredLanguage: 'en',
    canSeeBudget: true,
    label: 'Diya (Bride • Couple • Wedding)',
  },
  {
    uid: 'demo-mother-1',
    name: "Meenakshi (Diya's Mother)",
    homeId: 'demo-home-1',
    homeName: 'Aarav & Diya (Wedding)',
    eventType: 'wedding',
    relationship: 'mother',
    permission: 'voter',
    preferredLanguage: 'gu',
    canSeeBudget: true,
    label: "Meenakshi (Mother • Voter • Gujarati)",
  },
  {
    uid: 'demo-brother-1',
    name: "Kabir (Aarav's Brother)",
    homeId: 'demo-home-1',
    homeName: 'Aarav & Diya (Wedding)',
    eventType: 'wedding',
    relationship: 'brother',
    permission: 'advisor',
    preferredLanguage: 'hi',
    canSeeBudget: false,
    label: "Kabir (Brother • Advisor • Budget Hidden)",
  },
  {
    uid: 'demo-friend-1',
    name: "Rhea (Diya's Friend)",
    homeId: 'demo-home-1',
    homeName: 'Aarav & Diya (Wedding)',
    eventType: 'wedding',
    relationship: 'friend',
    permission: 'viewer',
    preferredLanguage: 'en',
    canSeeBudget: false,
    label: "Rhea (Friend • Viewer • English)",
  },

  // Demo 2: 60th Birthday in Ahmedabad (Ananya & family)
  {
    uid: 'demo-ananya-host',
    name: 'Ananya',
    homeId: 'demo-home-2',
    homeName: "Ananya's 60th Birthday",
    eventType: 'birthday',
    relationship: 'daughter',
    permission: 'couple', // Admin / Host
    preferredLanguage: 'gu',
    canSeeBudget: true,
    label: 'Ananya (Daughter • Host • Birthday)',
  },
  {
    uid: 'demo-rohit-voter',
    name: 'Rohit',
    homeId: 'demo-home-2',
    homeName: "Ananya's 60th Birthday",
    eventType: 'birthday',
    relationship: 'son',
    permission: 'voter',
    preferredLanguage: 'en',
    canSeeBudget: true,
    label: 'Rohit (Son • Voter • Birthday)',
  },
  {
    uid: 'demo-kavita-advisor',
    name: 'Kavita',
    homeId: 'demo-home-2',
    homeName: "Ananya's 60th Birthday",
    eventType: 'birthday',
    relationship: 'sister',
    permission: 'advisor',
    preferredLanguage: 'hi',
    canSeeBudget: false,
    label: 'Kavita (Sister • Advisor • Birthday)',
  },

  // Demo 3: Sahyadri Heights Society Navratri Garba (Pune)
  {
    uid: 'demo-vikram-org',
    name: 'Vikram',
    homeId: 'demo-home-3',
    homeName: 'Sahyadri Heights Society Garba',
    eventType: 'community',
    relationship: 'lead_organiser',
    permission: 'couple', // Admin / Organiser
    preferredLanguage: 'mr',
    canSeeBudget: true,
    label: 'Vikram (Secretary • Organiser • Garba)',
  },
  {
    uid: 'demo-sunita-org',
    name: 'Sunita',
    homeId: 'demo-home-3',
    homeName: 'Sahyadri Heights Society Garba',
    eventType: 'community',
    relationship: 'cultural_head',
    permission: 'couple', // Admin / Organiser
    preferredLanguage: 'hi',
    canSeeBudget: true,
    label: 'Sunita (Cultural Head • Organiser)',
  },
  {
    uid: 'demo-rajesh-voter',
    name: 'Rajesh',
    homeId: 'demo-home-3',
    homeName: 'Sahyadri Heights Society Garba',
    eventType: 'community',
    relationship: 'committee_member',
    permission: 'voter',
    preferredLanguage: 'mr',
    canSeeBudget: true,
    label: 'Rajesh (Treasurer • Voter • Garba)',
  },
  {
    uid: 'demo-priya-advisor',
    name: 'Priya',
    homeId: 'demo-home-3',
    homeName: 'Sahyadri Heights Society Garba',
    eventType: 'community',
    relationship: 'resident_volunteer',
    permission: 'advisor',
    preferredLanguage: 'en',
    canSeeBudget: false,
    label: 'Priya (Volunteer • Advisor • Garba)',
  },
];

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (details: {
    name: string;
    emailOrPhone: string;
    preferredLanguage?: string;
    homeId?: string | null;
  }) => Promise<void>;
  signInAsDemoCouple: () => Promise<void>;
  loginAsDemo: (uid: string, homeId?: string) => Promise<boolean>;
  switchMember: (uid: string) => Promise<void>;
  updateUserLanguage: (lang: string) => Promise<void>;
  setHomeId: (homeId: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'mih_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Load active session from /api/me on mount (session cookie based)
  useEffect(() => {
    async function loadCurrentSession() {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.member) {
            const authUser: AuthUser = {
              uid: data.member.uid,
              name: data.member.name,
              relationship: data.member.relationship,
              permission: data.member.permission,
              preferredLanguage: data.member.preferredLanguage,
              canSeeBudget: data.member.canSeeBudget,
              homeId: data.homeId || 'demo-home-1',
            };
            setUser(authUser);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
            } catch { }
            return;
          }
        }

        // Fallback to localStorage if /api/me not found or unauthenticated
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.uid) {
            setUser(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to parse auth user session:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentSession();
  }, []);

  // Sync html lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = user?.preferredLanguage || 'en';
    }
  }, [user?.preferredLanguage]);

  const persistUser = useCallback((updated: AuthUser | null) => {
    setUser(updated);
    if (updated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save auth session:', e);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('Failed to clear auth session:', e);
      }
    }
  }, []);

  const signIn = useCallback(
    async ({
      name,
      emailOrPhone,
      preferredLanguage = 'en',
      homeId = null,
    }: {
      name: string;
      emailOrPhone: string;
      preferredLanguage?: string;
      homeId?: string | null;
    }) => {
      const newUser: AuthUser = {
        uid: `user_${Date.now()}`,
        name: name.trim(),
        emailOrPhone: emailOrPhone.trim(),
        relationship: 'couple',
        permission: 'couple',
        preferredLanguage,
        canSeeBudget: true,
        homeId,
      };
      persistUser(newUser);
    },
    [persistUser]
  );

  const loginAsDemo = useCallback(
    async (uid: string, targetHomeId: string = 'demo-home-1'): Promise<boolean> => {
      try {
        const res = await fetch('/api/auth/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, homeId: targetHomeId }),
        });
        if (res.ok) {
          const data = await res.json();
          const demoUser: AuthUser = {
            uid: data.member.uid,
            name: data.member.name,
            relationship: data.member.relationship,
            permission: data.member.permission,
            preferredLanguage: data.member.preferredLanguage,
            canSeeBudget: data.member.canSeeBudget,
            homeId: data.homeId || targetHomeId,
          };
          persistUser(demoUser);
          return true;
        }
      } catch (e) {
        console.error('Error logging in as demo member:', e);
      }
      return false;
    },
    [persistUser]
  );

  const signInAsDemoCouple = useCallback(async () => {
    await loginAsDemo('demo-aarav-1', 'demo-home-1');
  }, [loginAsDemo]);

  const switchMember = useCallback(
    async (memberUid: string) => {
      const targetMember = DEMO_MEMBERS.find((m) => m.uid === memberUid);
      const targetHomeId = targetMember?.homeId || user?.homeId || 'demo-home-1';

      try {
        const res = await fetch('/api/auth/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: memberUid, homeId: targetHomeId }),
        });
        if (res.ok) {
          const data = await res.json();
          const updated: AuthUser = {
            uid: data.member.uid,
            name: data.member.name,
            relationship: data.member.relationship,
            permission: data.member.permission,
            preferredLanguage: data.member.preferredLanguage,
            canSeeBudget: data.member.canSeeBudget,
            homeId: data.homeId || targetHomeId,
          };
          persistUser(updated);
          // Hard reload or trigger state refresh across all routes
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
          return;
        }
      } catch (e) {
        console.error('Failed to switch member via demo API:', e);
      }

      if (!targetMember) return;

      const fallback: AuthUser = {
        uid: targetMember.uid,
        name: targetMember.name,
        relationship: targetMember.relationship,
        permission: targetMember.permission,
        preferredLanguage: targetMember.preferredLanguage,
        canSeeBudget: targetMember.canSeeBudget,
        homeId: targetHomeId,
      };
      persistUser(fallback);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    },
    [user?.homeId, persistUser]
  );

  const updateUserLanguage = useCallback(
    async (lang: string) => {
      if (!user) return;
      const updated: AuthUser = {
        ...user,
        preferredLanguage: lang,
      };
      persistUser(updated);

      if (user.homeId) {
        try {
          await fetch(`/api/homes/${user.homeId}/members/${user.uid}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              preferredLanguage: lang,
            }),
          });
        } catch (e) {
          console.error('Failed to sync language to server:', e);
        }
      }
    },
    [user, persistUser]
  );

  const setHomeId = useCallback(
    (homeId: string) => {
      if (!user) return;
      const updated: AuthUser = {
        ...user,
        homeId,
      };
      persistUser(updated);
    },
    [user, persistUser]
  );

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    persistUser(null);
  }, [persistUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoMode,
        signIn,
        signInAsDemoCouple,
        loginAsDemo,
        switchMember,
        updateUserLanguage,
        setHomeId,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
