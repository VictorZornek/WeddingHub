import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import type { MemberRole, Wedding } from '@/types/database';

type WeddingState = {
  wedding: Wedding | null;
  role: MemberRole | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const WeddingContext = createContext<WeddingState>({
  wedding: null,
  role: null,
  isLoading: true,
  error: null,
  refresh: async () => {},
});

type MembershipRow = { role: MemberRole; weddings: Wedding | null };

type Loaded = {
  userId: string;
  wedding: Wedding | null;
  role: MemberRole | null;
  error: string | null;
};

async function fetchMembership(userId: string): Promise<Loaded> {
  const { data, error } = await supabase
    .from('wedding_members')
    .select('role, weddings(*)')
    .eq('user_id', userId)
    .order('created_at')
    .limit(1)
    .maybeSingle<MembershipRow>();

  return {
    userId,
    wedding: data?.weddings ?? null,
    role: data?.role ?? null,
    error: error ? 'Não foi possível carregar o casamento.' : null,
  };
}

// Loads the wedding the signed-in user belongs to (one per user for now).
export function WeddingProvider({ children }: PropsWithChildren) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!userId) return;
    let isActive = true;
    fetchMembership(userId).then((result) => {
      if (isActive) setLoaded(result);
    });
    return () => {
      isActive = false;
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (userId) setLoaded(await fetchMembership(userId));
  }, [userId]);

  // Data loaded for another user (or nobody) does not count.
  const current = loaded && loaded.userId === userId ? loaded : null;

  const value: WeddingState = {
    wedding: current?.wedding ?? null,
    role: current?.role ?? null,
    isLoading: !!userId && !current,
    error: current?.error ?? null,
    refresh,
  };

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWedding() {
  return useContext(WeddingContext);
}
