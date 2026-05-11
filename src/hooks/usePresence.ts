import { useEffect, useState } from "react";
import { getLivePresence, typingPresence, type Presence } from "@/lib/presence";

/**
 * Live presence hook for a character.
 * Refreshes every 30 s so labels naturally drift.
 * Pass `isTyping` to override with a typing indicator.
 */
export function usePresence(name: string, isTyping = false): Presence {
  const [presence, setPresence] = useState<Presence>(() => getLivePresence(name));

  useEffect(() => {
    if (isTyping) return;
    const id = setInterval(() => setPresence(getLivePresence(name)), 30_000);
    return () => clearInterval(id);
  }, [name, isTyping]);

  return isTyping ? typingPresence() : presence;
}
