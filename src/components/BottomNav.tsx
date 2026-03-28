import { useLocation, useNavigate } from "react-router-dom";
import { Home, MessageCircle, Search, Sparkles, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Accueil" },
  { path: "/chat", icon: MessageCircle, label: "Coach" },
  { path: "/search", icon: Search, label: "Profils" },
  { path: "/generator", icon: Sparkles, label: "Messages" },
  { path: "/dashboard", icon: BarChart3, label: "Stats" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/30 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
