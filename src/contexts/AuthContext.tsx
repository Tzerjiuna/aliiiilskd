'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuthContextValue, AuthUser, AuthSession, SignUpMetadata, UserProfile, UserRole } from '@/types/auth';

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  const fetchUserRole = async (userId: string): Promise<void> => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();
      const role = (data?.role ?? 'user') as UserRole;
      setUserRole(role);
      setIsAdmin(role === 'admin' || role === 'super_admin');
    } catch {
      setUserRole('user');
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session as AuthSession | null);
      setUser((session?.user ?? null) as AuthUser | null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session as AuthSession | null);
      setUser((session?.user ?? null) as AuthUser | null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata: SignUpMetadata = {}
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata?.fullName ?? '',
          avatar_url: metadata?.avatarUrl ?? '',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;

    if (data?.user) {
      const profileUpdate: Record<string, any> = {};
      if (metadata?.phone) profileUpdate.phone = metadata.phone;
      if (metadata?.referralCode) profileUpdate.referral_code = metadata.referralCode;

      if (Object.keys(profileUpdate).length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await supabase
          .from('user_profiles')
          .update(profileUpdate)
          .eq('id', data.user.id);
      }
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const getCurrentUser = async (): Promise<AuthUser | null> => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user as AuthUser | null;
  };

  const isEmailVerified = (): boolean => {
    return user?.email_confirmed_at != null;
  };

  const getUserProfile = async (): Promise<UserProfile | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data as UserProfile;
  };

  const value: AuthContextValue = {
    user,
    session,
    loading,
    userRole,
    isAdmin,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isEmailVerified,
    getUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
