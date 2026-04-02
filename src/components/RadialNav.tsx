import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Home, MessageCircle, Search, Sparkles, BarChart3, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "ACCUEIL", color: "hsl(340, 75%, 55%)" },
  { path: "/chat", icon: MessageCircle, label: "COACH", color: "hsl(280, 60%, 50%)" },
  { path: "/search", icon: Search, label: "PROFILS", color: "hsl(30, 90%, 55%)" },
  { path: "/generator", icon: Sparkles, label: "MESSAGES", color: "hsl(200, 70%, 50%)" },
];

const RADIUS = 80;
const START_ANGLE = -90; // degrees, from top
const SPREAD = 90; // degrees of arc

export const RadialNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [contaminating, setContaminating] = useState<{ path: string; color: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const gateRef = useRef<HTMLDivElement>(null);

  const getItemPosition = (index: number) => {
    const totalItems = NAV_ITEMS.length;
    const angleStep = SPREAD / (totalItems - 1);
    const angle = (START_ANGLE + index * angleStep) * (Math.PI / 180);
    return {
      x: Math.cos(angle) * RADIUS,
      y: Math.sin(angle) * RADIUS,
    };
  };

  const handleDragEnd = (item: typeof NAV_ITEMS[0], _: any, info: PanInfo) => {
    setDraggedItem(null);
    const gateEl = gateRef.current;
    if (!gateEl) return;

    const gateRect = gateEl.getBoundingClientRect();
    const gateCenterX = gateRect.left + gateRect.width / 2;
    const gateCenterY = gateRect.top + gateRect.height / 2;

    // Check if dragged near the gate (within 50px)
    const pos = getItemPosition(NAV_ITEMS.indexOf(item));
    // We need the element's current position - use the point offset
    const dropX = gateCenterX + pos.x + info.offset.x;
    const dropY = gateCenterY + pos.y + info.offset.y;

    const dist = Math.sqrt((dropX - gateCenterX) ** 2 + (dropY - gateCenterY) ** 2);

    if (dist < 60) {
      // Contamination effect
      setContaminating({ path: item.path, color: item.color });
      setTimeout(() => {
        navigate(item.path);
        setIsOpen(false);
        setContaminating(null);
        setActiveLabel(null);
      }, 600);
    }
  };

  const handleItemClick = (item: typeof NAV_ITEMS[0]) => {
    if (activeLabel === item.label) {
      // Second click - navigate directly
      setContaminating({ path: item.path, color: item.color });
      setTimeout(() => {
        navigate(item.path);
        setIsOpen(false);
        setContaminating(null);
        setActiveLabel(null);
      }, 600);
    } else {
      setActiveLabel(item.label);
    }
  };

  return (
    <>
      {/* Contamination overlay */}
      <AnimatePresence>
        {contaminating && (
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none"
            initial={{ clipPath: "circle(0% at 48px calc(100% - 48px))" }}
            animate={{ clipPath: "circle(150% at 48px calc(100% - 48px))" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ backgroundColor: contaminating.color }}
          />
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[59] bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setIsOpen(false); setActiveLabel(null); }}
          />
        )}
      </AnimatePresence>

      {/* Navigation container */}
      <div className="fixed bottom-6 left-6 z-[60]">
        {/* Orbiting items */}
        <AnimatePresence>
          {isOpen && NAV_ITEMS.map((item, i) => {
            const pos = getItemPosition(i);
            const isActive = location.pathname === item.path;
            const isSelected = activeLabel === item.label;

            return (
              <motion.div
                key={item.path}
                className="absolute"
                style={{ left: 6, top: 6 }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: pos.x,
                  y: pos.y,
                  scale: isSelected ? 1.15 : 1,
                  opacity: 1,
                }}
                exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.div
                  drag
                  dragSnapToOrigin
                  onDragStart={() => setDraggedItem(item.path)}
                  onDragEnd={(_, info) => handleDragEnd(item, _, info)}
                  onClick={() => handleItemClick(item)}
                  whileTap={{ scale: 1.15 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-shadow",
                    isActive ? "ring-2 ring-primary" : ""
                  )}
                  style={{
                    backgroundColor: item.color,
                    boxShadow: isSelected ? `0 0 20px ${item.color}` : `0 4px 12px ${item.color}40`,
                  }}
                >
                  <item.icon className="h-4 w-4 text-white" />
                </motion.div>

                {/* Label */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-wider text-foreground whitespace-nowrap glass-strong px-2 py-1 rounded-md"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Master button / Gate */}
        <motion.button
          ref={gateRef}
          onClick={() => { setIsOpen(!isOpen); setActiveLabel(null); }}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-xl relative z-10 transition-colors",
            isOpen
              ? "bg-secondary border-2 border-destructive/50"
              : "gradient-primary"
          )}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            boxShadow: isOpen
              ? "0 0 20px hsl(0, 84%, 60%, 0.3)"
              : "0 0 20px hsl(340, 75%, 55%, 0.4)",
          }}
        >
          {isOpen ? (
            <LogOut className="h-5 w-5 text-destructive" />
          ) : (
            <Menu className="h-5 w-5 text-primary-foreground" />
          )}
        </motion.button>

        {/* Drag hint */}
        <AnimatePresence>
          {isOpen && !draggedItem && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 0.5, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 left-0 text-[8px] text-muted-foreground whitespace-nowrap"
            >
              Glisse vers la porte 🚪
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
