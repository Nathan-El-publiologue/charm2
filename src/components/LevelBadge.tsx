import { getLevelInfo } from "@/hooks/useGamification";
import { Progress } from "@/components/ui/progress";

interface LevelBadgeProps {
  xp: number;
  compact?: boolean;
}

export const LevelBadge = ({ xp, compact = false }: LevelBadgeProps) => {
  const info = getLevelInfo(xp);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{info.emoji}</span>
        <span className="text-xs font-medium text-foreground">Nv.{info.level}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{info.emoji}</span>
          <div>
            <p className="text-sm font-bold text-foreground">{info.name}</p>
            <p className="text-xs text-muted-foreground">Niveau {info.level}</p>
          </div>
        </div>
        <p className="text-sm font-bold text-primary">{xp} XP</p>
      </div>
      {info.nextLevel && (
        <div className="space-y-1">
          <Progress value={info.progress} className="h-2" />
          <p className="text-[10px] text-muted-foreground text-right">
            {info.nextLevel.minXp - xp} XP pour {info.nextLevel.name} {info.nextLevel.emoji}
          </p>
        </div>
      )}
    </div>
  );
};
