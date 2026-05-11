// Live presence helper — deterministic per character but evolves over time.
// Mixes a name-based seed with the current 5-minute time bucket so the
// status feels alive (changes throughout the day) while staying coherent
// for the same character within a short window.

export type PresenceTone = "online" | "typing" | "recent" | "offline";

export interface Presence {
  label: string;
  tone: PresenceTone;
  /** Tailwind class for the small status dot. */
  dotClass: string;
}

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

const dotFor = (tone: PresenceTone): string => {
  switch (tone) {
    case "online": return "bg-green-400 shadow-[0_0_8px_hsl(142_76%_45%)]";
    case "typing": return "bg-primary animate-pulse";
    case "recent": return "bg-yellow-400";
    case "offline": return "bg-muted-foreground/50";
  }
};

/**
 * Returns a realistic live presence for a character.
 * Recomputed on each call — bucket the current time in 3-minute slots
 * so React re-renders show natural drift.
 */
export function getLivePresence(name: string): Presence {
  const now = Date.now();
  const bucket = Math.floor(now / (3 * 60 * 1000)); // changes every 3 min
  const seed = hash(name);
  const hour = new Date().getHours();

  // Time-of-day bias: more people online in evening, fewer at night
  const eveningBoost = hour >= 18 && hour <= 23 ? 2 : 0;
  const nightPenalty = hour >= 1 && hour <= 6 ? -3 : 0;
  const r = (seed + bucket) % 10 + eveningBoost + nightPenalty;

  if (r >= 7) return { label: "En ligne", tone: "online", dotClass: dotFor("online") };
  if (r >= 5) {
    const min = 1 + ((seed + bucket) % 12);
    return { label: `Actif il y a ${min} min`, tone: "recent", dotClass: dotFor("recent") };
  }
  if (r >= 2) {
    const min = 15 + ((seed + bucket) % 45);
    return { label: `Vu il y a ${min} min`, tone: "recent", dotClass: dotFor("recent") };
  }
  const h = 1 + ((seed + bucket) % 8);
  return { label: `Vu il y a ${h}h`, tone: "offline", dotClass: dotFor("offline") };
}

/** Returns a "typing" presence to show while the assistant is generating. */
export function typingPresence(): Presence {
  return { label: "En train d'écrire…", tone: "typing", dotClass: dotFor("typing") };
}
