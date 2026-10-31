'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MemberPermission, IndianLanguage } from '@/types/firestore';
import { getClientAuth, getGoogleAuthProvider } from '@/lib/firebase/client';
import { signInWithPopup, signInWithRedirect, signOut as firebaseSignOut } from 'firebase/auth';

export interface UserHomeSummary {
  id: string;
  name: string;
  eventType?: string;
}

export interface AuthUser {
  uid: string;
  name: string;
  email?: string;
  isGuest: boolean;
  relationship: string;
  permission: MemberPermission;
  preferredLanguage: IndianLanguage | string;
  canSeeBudget: boolean;
  homeId: string | null;
  homeName?: string | null;
  eventType?: string;
  homes?: UserHomeSummary[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signInWithGoogle: (displayName?: string) => Promise<{ success: boolean; error?: string }>;
  continueAsGuest: (displayName?: string) => Promise<{ success: boolean; error?: string }>;
  switchHome: (homeId: string) => Promise<boolean>;
  updateUserLanguage: (lang: string) => Promise<void>;
  setHomeId: (homeId: string) => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.authenticated) {
          const authUser: AuthUser = {
            uid: data.uid,
            name: data.name || (data.member ? data.member.name : 'Host'),
            email: data.email,
            isGuest: data.isGuest ?? false,
            relationship: data.member?.relationship || 'host',
            permission: data.permission || data.member?.permission || 'couple',
            preferredLanguage: data.member?.preferredLanguage || 'en',
            canSeeBudget: data.canSeeBudget ?? true,
            homeId: data.homeId || null,
            homeName: data.homeName || null,
            eventType: data.eventType || 'wedding',
            homes: data.homes || [],
          };
          setUser(authUser);
          return;
        }
      }
      setUser(null);
    } catch (e) {
      console.error('Failed to load session:', e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Sync html lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = user?.preferredLanguage || 'en';
    }
  }, [user?.preferredLanguage]);

  const signInWithGoogle = useCallback(
    async (displayName?: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const auth = getClientAuth();
        const provider = getGoogleAuthProvider();

        let credential;
        try {
          credential = await signInWithPopup(auth, provider);
        } catch (popupErr: any) {
          // If popup blocked or failed, attempt redirect as fallback
          if (
            popupErr.code === 'auth/popup-blocked' ||
            popupErr.code === 'auth/popup-closed-by-user' ||
            popupErr.code === 'auth/cancelled-popup-request'
          ) {
            try {
              await signInWithRedirect(auth, provider);
              return { success: true };
            } catch (redirErr: any) {
              return {
                success: false,
                error:
                  'Google sign-in popup was blocked. Please allow popups for this site, or continue as a guest.',
              };
            }
          }
          throw popupErr;
        }

        const idToken = await credential.user.getIdToken();
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            displayName: displayName?.trim() || credential.user.displayName || undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, error: errData.error || 'Failed to establish session' };
        }

        await loadSession();
        return { success: true };
      } catch (err: any) {
        console.error('Google sign-in error:', err);
        return {
          success: false,
          error: err.message || 'Google sign-in encountered an error. Please try again or continue as guest.',
        };
      }
    },
    [loadSession]
  );

  const continueAsGuest = useCallback(
    async (displayName?: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: displayName?.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, error: errData.error || 'Failed to create guest session' };
        }

        await loadSession();
        return { success: true };
      } catch (err: any) {
        console.error('Guest sign-in error:', err);
        return { success: false, error: 'Could not create guest session. Please try again.' };
      }
    },
    [loadSession]
  );

  const switchHome = useCallback(
    async (homeId: string): Promise<boolean> => {
      try {
        // Update active home on user profile
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'switch_home', homeId }),
        });
        if (res.ok) {
          await loadSession();
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
          return true;
        }
      } catch (e) {
        console.error('Failed to switch home:', e);
      }
      return false;
    },
    [loadSession]
  );

  const updateUserLanguage = useCallback(
    async (lang: string) => {
      if (!user) return;
      setUser((prev) => (prev ? { ...prev, preferredLanguage: lang } : null));

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
    [user]
  );

  const setHomeId = useCallback((homeId: string) => {
    setUser((prev) => (prev ? { ...prev, homeId } : null));
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    try {
      const auth = getClientAuth();
      await firebaseSignOut(auth);
    } catch {
      // Ignore firebase client signout errors
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        continueAsGuest,
        switchHome,
        updateUserLanguage,
        setHomeId,
        signOut,
        refreshSession: loadSession,
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
