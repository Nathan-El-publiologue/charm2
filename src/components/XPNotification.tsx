import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface XPNotificationProps {
  xpGained: { amount: number; reason: string } | null;
}

export const XPNotification = ({ xpGained }: XPNotificationProps) => {
  return (
    <AnimatePresence>
      {xpGained && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] glass-strong rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">+{xpGained.amount} XP</p>
            <p className="text-xs text-muted-foreground">{xpGained.reason}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
