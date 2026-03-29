import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Trophy, Target, Calendar, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification, getDailyChallenge } from "@/hooks/useGamification";
import { LevelBadge } from "@/components/LevelBadge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const BADGE_INFO: Record<string, { label: string; emoji: string }> = {
  first_message: { label: "Premier message", emoji: "💬" },
  quiz_completed: { label: "Quiz complété", emoji: "🎯" },
  first_100_xp: { label: "100 XP", emoji: "⚡" },
  streak_7: { label: "7 jours de suite", emoji: "🔥" },
  streak_30: { label: "30 jours de suite", emoji: "👑" },
  generator_used: { label: "Générateur utilisé", emoji: "✨" },
  analyzer_used: { label: "Analyseur utilisé", emoji: "📸" },
};

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data: gData, completeDailyChallenge } = useGamification();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null; style: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_profiles").select("display_name, avatar_url, style").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="font-heading text-2xl font-bold text-foreground">Mon Profil</h1>
        </div>

        {/* User info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl text-primary-foreground font-bold">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="h-full w-full rounded-2xl object-cover" /> : (profile?.display_name?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-foreground text-lg">{profile?.display_name || user?.email?.split("@")[0]}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            {profile?.style && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-primary capitalize mt-1 inline-block">{profile.style}</span>}
          </div>
        </motion.div>

        {/* XP & Level */}
        {gData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5">
            <LevelBadge xp={gData.xp} />
          </motion.div>
        )}

        {/* Stats row */}
        {gData && (
          <div className="grid grid-cols-3 gap-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="glass rounded-2xl p-3 text-center">
              <Flame className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{gData.streak_days}</p>
              <p className="text-[10px] text-muted-foreground">Streak</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-3 text-center">
              <Trophy className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{gData.badges.length}</p>
              <p className="text-[10px] text-muted-foreground">Badges</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="glass rounded-2xl p-3 text-center">
              <Target className="h-5 w-5 text-green-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{gData.level}</p>
              <p className="text-[10px] text-muted-foreground">Niveau</p>
            </motion.div>
          </div>
        )}

        {/* Daily Challenge */}
        {gData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              <p className="text-sm font-bold text-foreground">Défi du jour</p>
            </div>
            <p className="text-sm text-muted-foreground">{getDailyChallenge()}</p>
            <Button onClick={completeDailyChallenge} disabled={gData.daily_challenge_completed}
              className={`w-full rounded-2xl ${gData.daily_challenge_completed ? "bg-secondary text-muted-foreground" : "gradient-primary text-primary-foreground"}`}>
              {gData.daily_challenge_completed ? "✅ Complété !" : "Marquer comme fait (+30 XP)"}
            </Button>
          </motion.div>
        )}

        {/* Badges */}
        {gData && gData.badges.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold text-foreground">🏆 Mes Badges</p>
            <div className="grid grid-cols-2 gap-2">
              {gData.badges.map((b) => {
                const info = BADGE_INFO[b] || { label: b, emoji: "🎖️" };
                return (
                  <div key={b} className="bg-secondary/50 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-xl">{info.emoji}</span>
                    <span className="text-xs text-foreground">{info.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <Button variant="outline" onClick={handleSignOut} className="w-full glass border-border/50 rounded-2xl text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
        </Button>
      </div>
    </AppLayout>
  );
};

export default Profile;
