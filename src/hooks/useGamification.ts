import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GamificationData {
  xp: number;
  level: number;
  streak_days: number;
  badges: string[];
  daily_challenge_completed: boolean;
  last_active_date: string | null;
}

const LEVELS = [
  { name: "Apprenti", minXp: 0, emoji: "🌱" },
  { name: "Débutant", minXp: 100, emoji: "🌿" },
  { name: "Charmeur", minXp: 300, emoji: "✨" },
  { name: "Expert", minXp: 600, emoji: "🔥" },
  { name: "Maître du Charme", minXp: 1000, emoji: "👑" },
];

const DAILY_CHALLENGES = [
  "Envoie un compliment sincère aujourd'hui 💕",
  "Utilise le générateur de messages 🎯",
  "Fais une conversation simulée 🎭",
  "Analyse une capture d'écran 📸",
  "Consulte le guide de séduction 📖",
  "Sauvegarde un message en favoris ⭐",
  "Essaie une nouvelle catégorie de messages 🔄",
];

export const getLevelInfo = (xp: number) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      const next = LEVELS[i + 1];
      return {
        ...LEVELS[i],
        level: i + 1,
        nextLevel: next || null,
        progress: next ? ((xp - LEVELS[i].minXp) / (next.minXp - LEVELS[i].minXp)) * 100 : 100,
      };
    }
  }
  return { ...LEVELS[0], level: 1, nextLevel: LEVELS[1], progress: 0 };
};

export const getDailyChallenge = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
};

export const useGamification = () => {
  const { user } = useAuth();
  const [data, setData] = useState<GamificationData | null>(null);
  const [xpGained, setXpGained] = useState<{ amount: number; reason: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: gData } = await supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (gData) {
      setData({
        xp: gData.xp ?? 0,
        level: gData.level ?? 1,
        streak_days: gData.streak_days ?? 0,
        badges: (gData.badges as string[]) ?? [],
        daily_challenge_completed: gData.daily_challenge_completed ?? false,
        last_active_date: gData.last_active_date,
      });
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addXP = useCallback(async (amount: number, reason: string) => {
    if (!user || !data) return;
    const newXp = data.xp + amount;
    const newLevelInfo = getLevelInfo(newXp);
    const today = new Date().toISOString().split("T")[0];

    let newStreak = data.streak_days;
    if (data.last_active_date !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      newStreak = data.last_active_date === yesterday ? data.streak_days + 1 : 1;
    }

    let newBadges = [...data.badges];
    if (newXp >= 100 && !newBadges.includes("first_100_xp")) newBadges.push("first_100_xp");
    if (newStreak >= 7 && !newBadges.includes("streak_7")) newBadges.push("streak_7");
    if (newStreak >= 30 && !newBadges.includes("streak_30")) newBadges.push("streak_30");

    await supabase
      .from("user_gamification")
      .update({
        xp: newXp,
        level: newLevelInfo.level,
        streak_days: newStreak,
        last_active_date: today,
        badges: newBadges,
      })
      .eq("user_id", user.id);

    setData({
      ...data,
      xp: newXp,
      level: newLevelInfo.level,
      streak_days: newStreak,
      badges: newBadges,
      last_active_date: today,
    });

    setXpGained({ amount, reason });
    setTimeout(() => setXpGained(null), 3000);
  }, [user, data]);

  const completeDailyChallenge = useCallback(async () => {
    if (!user || !data || data.daily_challenge_completed) return;
    await supabase
      .from("user_gamification")
      .update({ daily_challenge_completed: true })
      .eq("user_id", user.id);
    setData({ ...data, daily_challenge_completed: true });
    await addXP(30, "Défi quotidien complété !");
  }, [user, data, addXP]);

  return { data, addXP, xpGained, completeDailyChallenge, refetch: fetchData };
};
