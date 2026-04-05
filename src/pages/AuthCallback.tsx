import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * This page handles OAuth callbacks on both web and native (Capacitor).
 * It extracts access_token and refresh_token from the URL hash,
 * sets the Supabase session, and redirects to home.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleTokens = async () => {
      try {
        // Try hash fragment first (native deep link or OAuth redirect)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        let accessToken = params.get("access_token");
        let refreshToken = params.get("refresh_token");

        // Also check query params as fallback
        if (!accessToken) {
          const searchParams = new URLSearchParams(window.location.search);
          accessToken = searchParams.get("access_token");
          refreshToken = searchParams.get("refresh_token");
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error("Auth callback session error:", error);
          }
        } else {
          // No tokens - maybe Supabase auto-handled via onAuthStateChange
          // Just wait a moment for the auth state to settle
          await new Promise((r) => setTimeout(r, 500));
        }
      } catch (e) {
        console.error("Auth callback error:", e);
      } finally {
        navigate("/", { replace: true });
      }
    };

    handleTokens();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Connexion en cours...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
