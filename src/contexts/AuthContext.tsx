import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const USER_CACHE_KEY = "charmai_user_cache";

function cacheUser(user: User | null) {
  try {
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify({
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        cached_at: Date.now(),
      }));
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
    }
  } catch { /* localStorage unavailable */ }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Restore session from Supabase storage FIRST
    supabase.auth.getSession().then(({ data: { session: restored } }) => {
      if (!mounted) return;
      setSession(restored);
      cacheUser(restored?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for all subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        cacheUser(newSession?.user ?? null);

        if (event === "SIGNED_OUT") {
          cacheUser(null);
        }

        // Only set loading false if getSession hasn't done it yet
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    cacheUser(null);
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
