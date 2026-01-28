import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserTier {
  tier: 'free' | 'pro' | 'premium' | 'enterprise';
  monthly_limit: number;
  used_this_month: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userTier, setUserTier] = useState<UserTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserTier(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserTier(session.user.id);
      } else {
        setUserTier(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserTier = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_quotas')
        .select('tier, monthly_limit, used_this_month')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user tier:', error);
        return;
      }

      setUserTier({
        tier: data.tier,
        monthly_limit: data.monthly_limit,
        used_this_month: data.used_this_month
      });
    } catch (error) {
      console.error('Error fetching user tier:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserTier(null);
  };

  return {
    user,
    session,
    userTier,
    loading,
    isAuthenticated: !!user,
    signOut,
    refreshTier: () => user && fetchUserTier(user.id),
  };
}
