import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Sparkles, Target, MessageCircle, Heart, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConversationScore } from "@/lib/conversationScore";

type Props = {
  open: boolean;
  score: ConversationScore | null;
  characterName?: string;
  onClose: () => void;
  onContinue: () => void;
};

const tone = (n: number) =>
  n >= 80 ? "text-green-400" : n >= 60 ? "text-primary" : n >= 40 ? "text-yellow-400" : "text-red-400";
const bar = (n: number) =>
  n >= 80 ? "from-green-400 to-emerald-500" : n >= 60 ? "from-primary to-pink-500" : n >= 40 ? "from-yellow-400 to-orange-500" : "from-red-400 to-rose-500";

export const ConversationFeedback = ({ open, score, characterName, onClose, onContinue }: Props) => {
  return (
    <AnimatePresence>
      {open && score && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="w-full max-w-md glass rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Bilan de session</p>
                <h2 className="font-heading text-xl font-bold text-foreground mt-0.5">
                  {characterName ? `Avec ${characterName}` : "Ta conversation"}
                </h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Overall */}
            <div className="text-center py-3">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className={`text-6xl font-heading font-bold ${tone(score.overall)}`}
              >
                {score.overall}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">Score global / 100</p>
            </div>

            {/* Bars */}
            <div className="space-y-3">
              {[
                { label: "Communication", value: score.communication, Icon: MessageCircle },
                { label: "Confiance", value: score.confidence, Icon: Shield },
                { label: "Sincérité", value: score.sincerity, Icon: Heart },
              ].map(({ label, value, Icon }, i) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-foreground font-medium">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      {label}
                    </span>
                    <span className={`font-bold ${tone(value)}`}>{value}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${value}%` }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${bar(value)}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths */}
            {score.strengths.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-green-400 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Tes points forts
                </p>
                <ul className="space-y-1.5">
                  {score.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-foreground/90 flex gap-2">
                      <span className="text-green-400 shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {score.improvements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> À travailler
                </p>
                <ul className="space-y-1.5">
                  {score.improvements.map((s, i) => (
                    <li key={i} className="text-xs text-foreground/90 flex gap-2">
                      <span className="text-yellow-400 shrink-0">→</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tip */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 flex gap-2.5">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/90 leading-relaxed">{score.tip}</p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Fermer</Button>
              <Button onClick={onContinue} className="flex-1 gradient-primary text-primary-foreground rounded-xl">
                Continuer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
