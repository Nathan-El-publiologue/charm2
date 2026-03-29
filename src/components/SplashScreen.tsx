import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 2800);
        }}
      >
        {/* Glow background */}
        <motion.div
          className="absolute w-64 h-64 rounded-full gradient-primary opacity-20 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Heart animation */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: [0, 1.3, 1], rotate: [-20, 10, 0] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          >
            <Heart className="w-20 h-20 text-primary fill-primary drop-shadow-[0_0_25px_hsl(var(--primary)/0.6)]" />
          </motion.div>
        </motion.div>

        {/* Logo text */}
        <motion.h1
          className="mt-6 text-4xl font-display font-bold text-gradient"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          CharmAI
        </motion.h1>

        <motion.p
          className="mt-2 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          Ton coach séduction personnel
        </motion.p>

        {/* Dedication */}
        <motion.p
          className="absolute bottom-12 text-xs text-muted-foreground/60 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          Créé avec 💖 par{" "}
          <span className="text-primary/70 font-medium">Nathan King</span>
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
};
