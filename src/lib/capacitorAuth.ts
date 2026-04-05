import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";

export const isNativePlatform = () => Capacitor.isNativePlatform();

const SUPABASE_URL = "https://ncplcqdourqxpzkjgiow.supabase.co";
const APP_SCHEME = "com.charmai.app";

/**
 * Handle Google OAuth on native Capacitor.
 * Opens Supabase OAuth directly in system browser, redirecting back to custom scheme.
 */
export async function nativeGoogleLogin(): Promise<{ error?: Error }> {
  return new Promise((resolve) => {
    let resolved = false;

    const listener = App.addListener("appUrlOpen", async ({ url }) => {
      if (resolved) return;
      try {
        // Parse tokens from fragment or query
        const hashPart = url.split("#")[1] || "";
        const queryPart = url.split("?")[1]?.split("#")[0] || "";
        const hashParams = new URLSearchParams(hashPart);
        const queryParams = new URLSearchParams(queryPart);

        const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");

        if (accessToken && refreshToken) {
          resolved = true;
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          resolve(error ? { error } : {});
        } else {
          resolved = true;
          resolve({ error: new Error("Aucun token reçu depuis l'authentification") });
        }
      } catch (e) {
        resolved = true;
        resolve({ error: e instanceof Error ? e : new Error(String(e)) });
      } finally {
        listener.then((l) => l.remove());
        Browser.close().catch(() => {});
      }
    });

    // Build the OAuth URL with custom scheme redirect
    const redirectUrl = `${APP_SCHEME}://auth`;
    const oauthUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;

    Browser.open({ url: oauthUrl, presentationStyle: "fullscreen" }).catch((e) => {
      if (!resolved) {
        resolved = true;
        listener.then((l) => l.remove());
        resolve({ error: e instanceof Error ? e : new Error(String(e)) });
      }
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        listener.then((l) => l.remove());
        resolve({ error: new Error("Délai d'authentification dépassé") });
      }
    }, 120000);
  });
}

/**
 * Initialize deep link listener for auth callbacks.
 */
export function initDeepLinkListener() {
  if (!isNativePlatform()) return;

  App.addListener("appUrlOpen", async ({ url }) => {
    if (!url.includes("access_token")) return;

    const hashParams = new URLSearchParams(url.split("#")[1] || "");
    const queryParams = new URLSearchParams(url.split("?")[1]?.split("#")[0] || "");
    const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    Browser.close().catch(() => {});
  });

  App.addListener("resume", async () => {
    await supabase.auth.getSession();
  });
}
