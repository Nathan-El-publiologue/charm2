import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";

/**
 * Detect if running inside a native Capacitor shell
 */
export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * The published web URL – OAuth will redirect here first,
 * then the page redirects to the custom scheme to re-enter the app.
 */
const PUBLISHED_URL = "https://charm2.lovable.app";

/**
 * Custom URL scheme for deep linking back into the native app.
 */
const APP_SCHEME = "com.charmai.app";

/**
 * Handle Google OAuth on native Capacitor:
 * 1. Open the published login page in the system browser
 * 2. The web login completes OAuth and stores the session
 * 3. The web page redirects to our custom scheme with tokens
 * 4. The App plugin catches the deep link
 * 5. We extract tokens and set the Supabase session
 */
export async function nativeGoogleLogin(): Promise<{ error?: Error }> {
  return new Promise((resolve) => {
    // Listen for the deep link callback
    const listener = App.addListener("appUrlOpen", async ({ url }) => {
      try {
        // Parse tokens from the URL fragment
        const hashParams = new URLSearchParams(url.split("#")[1] || "");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            resolve({ error });
          } else {
            resolve({});
          }
        } else {
          resolve({ error: new Error("Aucun token reçu depuis l'authentification") });
        }
      } catch (e) {
        resolve({ error: e instanceof Error ? e : new Error(String(e)) });
      } finally {
        // Clean up
        listener.then((l) => l.remove());
        Browser.close().catch(() => {});
      }
    });

    // Open the published site's OAuth callback page in system browser
    // This page will handle OAuth and redirect back with tokens
    const oauthUrl = `${PUBLISHED_URL}/native-auth-callback`;
    Browser.open({ url: oauthUrl, presentationStyle: "fullscreen" }).catch((e) => {
      listener.then((l) => l.remove());
      resolve({ error: e instanceof Error ? e : new Error(String(e)) });
    });
  });
}

/**
 * Initialize deep link listener for auth callbacks.
 * Call this once in your app root (AuthContext).
 */
export function initDeepLinkListener() {
  if (!isNativePlatform()) return;

  App.addListener("appUrlOpen", async ({ url }) => {
    // Only handle auth-related deep links
    if (!url.includes("access_token")) return;

    const hashParams = new URLSearchParams(url.split("#")[1] || "");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    Browser.close().catch(() => {});
  });

  // Also handle resume – refresh session when app comes back to foreground
  App.addListener("resume", async () => {
    await supabase.auth.getSession();
  });
}
