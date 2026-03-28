import { motion } from "framer-motion";
import { BookOpen, Heart, MessageCircle, Shield, Sparkles, Clock } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

const tips = [
  {
    icon: Heart,
    title: "Sois authentique",
    description: "La meilleure approche est toujours d'être toi-même. Les gens ressentent la sincérité.",
    color: "text-pink-400",
  },
  {
    icon: MessageCircle,
    title: "Pose des questions ouvertes",
    description: "Au lieu de 'Tu vas bien ?', essaie 'Qu'est-ce qui t'a fait sourire aujourd'hui ?'",
    color: "text-blue-400",
  },
  {
    icon: Clock,
    title: "Respecte le timing",
    description: "Ne bombarde pas de messages. Laisse respirer la conversation et crée du désir.",
    color: "text-purple-400",
  },
  {
    icon: Shield,
    title: "Respecte les limites",
    description: "Si quelqu'un n'est pas intéressé, accepte-le avec grâce. Le respect est la base.",
    color: "text-green-400",
  },
  {
    icon: Sparkles,
    title: "Sois mémorable",
    description: "Fais référence à des détails de vos conversations précédentes. Ça montre que tu écoutes.",
    color: "text-yellow-400",
  },
  {
    icon: BookOpen,
    title: "Apprends de tes erreurs",
    description: "Chaque conversation est une leçon. Analyse ce qui marche et ce qui ne marche pas.",
    color: "text-orange-400",
  },
];

const Guide = () => {
  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Guide de Séduction</h1>
          <p className="text-sm text-muted-foreground">Les règles d'or pour des conversations réussies</p>
        </div>

        <div className="space-y-3">
          {tips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <tip.icon className={`h-5 w-5 ${tip.color}`} />
                </div>
                <h3 className="font-heading font-bold text-foreground">{tip.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-[52px]">{tip.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Guide;
