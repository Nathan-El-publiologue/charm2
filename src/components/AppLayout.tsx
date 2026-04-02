import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { RadialNav } from "./RadialNav";
import { XPNotification } from "./XPNotification";
import { InstallBanner } from "./InstallBanner";
import { useGamification } from "@/hooks/useGamification";
import { LevelBadge } from "./LevelBadge";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { data: gData, xpGained } = useGamification();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="font-heading text-sm font-bold text-gradient">CharmAI</span>
          <div className="flex items-center gap-3">
            {gData && <LevelBadge xp={gData.xp} compact />}
            <button onClick={() => navigate("/profile")} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
              <User className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>
      <main className="pt-12 pb-20">{children}</main>
      <BottomNav />
      <XPNotification xpGained={xpGained} />
      <InstallBanner />
    </div>
  );
};
