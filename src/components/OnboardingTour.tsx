import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, MessageCircle, Search, Sparkles, BarChart3, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  { title: "Bienvenue sur CharmAI ! 👋", description: "Ton coach séduction personnel propulsé par l'IA. Découvre les fonctionnalités clés.", icon: Home, emoji: "🏠" },
  { title: "Coach IA 💬", description: "Décris ta situation et reçois 3 messages personnalisés avec explications.", icon: MessageCircle, emoji: "🤖" },
  { title: "Recherche de Profils 🔍", description: "Explore des profils avec des personnalités analysées et des conseils d'approche.", icon: Search, emoji: "👤" },
  { title: "Générateur de Messages ✨", description: "Génère des accroches, relances, anti-ghost et compliments sur mesure.", icon: Sparkles, emoji: "💌" },
  { title: "Ton Dashboard 📊", description: "Suis tes stats, ta progression et deviens un Maître du Charme !", icon: BarChart3, emoji: "🏆" },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const finish = async () => {
    if (user) {
      await supabase.from("user_profiles").update({ onboarding_completed: true }).eq("user_id", user.id);
    }
    onComplete();
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  };

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={finish} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="relative z-10 w-full max-w-md mx-4 mb-24 glass-strong rounded-3xl p-6 space-y-4"
        >
          <button onClick={finish} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "gradient-primary" : "bg-secondary"}`} />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-xl">
              {current.emoji}
            </div>
            <h2 className="font-heading text-lg font-bold text-foreground">{current.title}</h2>
          </div>

          <p className="text-sm text-muted-foreground">{current.description}</p>

          <div className="flex gap-3">
            <Button onClick={finish} variant="ghost" className="flex-1 glass border-border/50 rounded-2xl text-muted-foreground">
              Passer
            </Button>
            <Button onClick={next} className="flex-1 gradient-primary text-primary-foreground rounded-2xl">
              {step < steps.length - 1 ? (
                <>Suivant <ArrowRight className="ml-1 h-4 w-4" /></>
              ) : "C'est parti ! 🚀"}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
