import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowRight, Check, Sparkles, Dumbbell, Camera, BookHeart, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useGamification } from "@/hooks/useGamification";

const quizQuestions = [
  {
    question: "Quand tu rencontres quelqu'un qui te plaît, tu préfères :",
    options: [
      { text: "Aller droit au but", style: "direct" },
      { text: "Jouer la carte du mystère", style: "flirty" },
      { text: "Faire rire et détendre l'atmosphère", style: "playful" },
      { text: "Prendre le temps de bien connaître la personne", style: "serious" },
    ],
  },
  {
    question: "Ton premier message idéal serait :",
    options: [
      { text: "Un compliment sincère et précis", style: "direct" },
      { text: "Une question intrigante", style: "flirty" },
      { text: "Une blague ou un jeu de mots", style: "playful" },
      { text: "Une référence à un intérêt commun", style: "serious" },
    ],
  },
  {
    question: "Face au silence radio, tu :",
    options: [
      { text: "Envoies un message clair sur tes intentions", style: "direct" },
      { text: "Crées de la curiosité avec un message mystérieux", style: "flirty" },
      { text: "Envoies un mème ou quelque chose de fun", style: "playful" },
      { text: "Respectes son espace et attends", style: "serious" },
    ],
  },
  {
    question: "Pour toi, la séduction c'est avant tout :",
    options: [
      { text: "L'authenticité et l'honnêteté", style: "direct" },
      { text: "La tension et le jeu", style: "flirty" },
      { text: "La complicité et le fun", style: "playful" },
      { text: "La connexion intellectuelle", style: "serious" },
    ],
  },
  {
    question: "Ton rendez-vous idéal :",
    options: [
      { text: "Un dîner en tête-à-tête", style: "direct" },
      { text: "Un bar à cocktails avec ambiance", style: "flirty" },
      { text: "Une activité fun (bowling, karaoké...)", style: "playful" },
      { text: "Une expo ou une balade culturelle", style: "serious" },
    ],
  },
];

const styleLabels: Record<string, { label: string; emoji: string; color: string }> = {
  direct: { label: "Direct", emoji: "🎯", color: "from-red-500 to-orange-500" },
  flirty: { label: "Charmeur", emoji: "😏", color: "from-pink-500 to-purple-500" },
  playful: { label: "Joueur", emoji: "🎭", color: "from-yellow-500 to-green-500" },
  serious: { label: "Sérieux", emoji: "🧠", color: "from-blue-500 to-indigo-500" },
};

const featureCards = [
  { path: "/training", icon: Dumbbell, label: "Entraînement", desc: "Simule une conversation", emoji: "🎭" },
  { path: "/profile-analyzer", icon: Camera, label: "Analyse Profil", desc: "Améliore ton profil dating", emoji: "📸" },
  { path: "/favorites", icon: BookHeart, label: "Favoris", desc: "Tes messages sauvegardés", emoji: "⭐" },
  { path: "/guide", icon: BookOpen, label: "Guide", desc: "Conseils de séduction", emoji: "📖" },
];

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addXP } = useGamification();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data && !data.onboarding_completed) setShowOnboarding(true);
      });
  }, [user]);

  const handleAnswer = async (style: string) => {
    const newAnswers = [...answers, style];
    setAnswers(newAnswers);

    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const counts: Record<string, number> = {};
      newAnswers.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setResult(dominant);
      addXP(50, "Quiz complété !");

      if (user) {
        const { error } = await supabase
          .from("user_profiles")
          .update({ style: dominant, quiz_results: counts })
          .eq("user_id", user.id);
        if (error) console.error("Error saving quiz:", error);
        else toast.success("Profil mis à jour !");
      }
    }
  };

  if (!quizStarted) {
    return (
      <AppLayout>
        {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
      <div className="px-5 py-8 space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-5"
          >
            <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-2xl gradient-primary shadow-2xl shadow-primary/40">
              <Heart className="h-9 w-9 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              <span className="text-gradient">CharmAI</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Ton coach séduction propulsé par l'IA
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Button
              size="lg"
              onClick={() => setQuizStarted(true)}
              className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base rounded-2xl shadow-lg shadow-primary/30"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Commencer le Quiz
            </Button>
          </motion.div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-4">
            {featureCards.map((card, i) => (
              <motion.button
                key={card.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                onClick={() => navigate(card.path)}
                className="glass rounded-2xl p-5 text-left space-y-3 hover:border-primary/50 transition-all active:scale-[0.98]"
              >
                <span className="text-3xl">{card.emoji}</span>
                <p className="text-sm font-bold text-foreground">{card.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (result) {
    const s = styleLabels[result];
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center space-y-8">
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }} className="space-y-6">
            <div className="text-6xl">{s.emoji}</div>
            <h2 className="font-heading text-3xl font-bold text-foreground">
              Tu es <span className="text-gradient">{s.label}</span> !
            </h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Ton style de séduction est maintenant configuré. L'IA adaptera tous ses conseils à ta personnalité.
            </p>
            <div className="glass rounded-2xl p-4 space-y-2">
              {Object.entries(
                answers.reduce((acc: Record<string, number>, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {})
              ).sort((a, b) => b[1] - a[1]).map(([style, count]) => (
                <div key={style} className="flex items-center gap-3">
                  <span className="text-sm">{styleLabels[style].emoji}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(count / 5) * 100}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${styleLabels[style].color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground w-16">{styleLabels[style].label}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => { setQuizStarted(false); setCurrentQ(0); setAnswers([]); setResult(null); }}
              variant="outline" className="glass border-border/50">Refaire le quiz</Button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const q = quizQuestions[currentQ];
  return (
    <AppLayout>
      <div className="flex flex-col min-h-[70vh] px-6 py-8">
        <div className="flex items-center gap-2 mb-8">
          {quizQuestions.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= currentQ ? "gradient-primary" : "bg-secondary"}`} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={currentQ} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }} className="flex-1 space-y-6">
            <h2 className="font-heading text-xl font-bold text-foreground">{q.question}</h2>
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <motion.button key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  onClick={() => handleAnswer(opt.style)}
                  className="w-full glass rounded-2xl p-4 text-left text-foreground hover:border-primary/50 transition-all duration-200 active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-muted-foreground">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="text-sm font-medium">{opt.text}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default Index;
