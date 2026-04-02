import { motion } from "framer-motion";
import { Shield, AlertTriangle, Heart, Eye, Brain, MessageCircle, Target, Crown } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

const sections = [
  {
    icon: Shield,
    title: "Détecter la manipulation",
    color: "text-red-400",
    tips: [
      "Il t'isole de tes amis et ta famille",
      "Il te culpabilise quand tu sors sans lui",
      "Il alterne entre super gentil et distant (hot & cold)",
      "Il vérifie ton téléphone ou tes réseaux",
      "Il retourne les situations pour que tu te sentes coupable",
      "Il te compare aux autres femmes pour te rabaisser",
    ],
  },
  {
    icon: Eye,
    title: "Identifier les intentions sérieuses",
    color: "text-green-400",
    tips: [
      "Il te présente à ses proches",
      "Il fait des projets concrets avec toi",
      "Il communique ses sentiments clairement",
      "Il respecte tes limites sans insister",
      "Il est constant dans ses efforts",
      "Il s'intéresse à ta vie, tes passions, ton avis",
    ],
  },
  {
    icon: Heart,
    title: "Choisir un bon partenaire",
    color: "text-pink-400",
    tips: [
      "Observe ses ACTIONS, pas juste ses paroles",
      "Un homme bien ne te fera jamais douter de sa place",
      "La constance vaut plus que l'intensité",
      "Méfie-toi de celui qui va trop vite trop tôt",
      "Un bon homme respecte ton 'non' sans négocier",
      "Regarde comment il traite les autres, pas juste toi",
    ],
  },
  {
    icon: Brain,
    title: "Répondre avec sagesse",
    color: "text-purple-400",
    tips: [
      "Prends ton temps avant de répondre sous émotion",
      "Ne justifie pas tes limites, pose-les simplement",
      "Si un message te met mal à l'aise, écoute ton instinct",
      "Tu n'as pas à répondre à tout le monde",
      "Poser des questions est plus puissant que donner des réponses",
      "Le silence est parfois la meilleure réponse",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Red flags à ne JAMAIS ignorer",
    color: "text-orange-400",
    tips: [
      "🚩 Il critique ton apparence ou tes choix",
      "🚩 Il refuse de définir la relation après des mois",
      "🚩 Il disparaît puis revient comme si de rien n'était",
      "🚩 Il te demande des photos intimes rapidement",
      "🚩 Il est agressif quand tu dis non",
      "🚩 Il ment sur des petites choses (il mentira sur les grandes)",
    ],
  },
  {
    icon: Crown,
    title: "Valorise-toi",
    color: "text-yellow-400",
    tips: [
      "Tu mérites quelqu'un qui choisit d'être avec toi",
      "Ne baisse jamais tes standards par peur de la solitude",
      "Investis en toi d'abord : ta carrière, tes passions, ta santé",
      "Un homme qui te veut vraiment fera l'effort",
      "Tu n'as pas à changer qui tu es pour plaire",
      "La meilleure version de toi attire le meilleur partenaire",
    ],
  },
];

const FemaleGuide = () => {
  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Guide Féminin 👑</h1>
          <p className="text-sm text-muted-foreground">Les clés pour des relations saines et épanouissantes</p>
        </div>

        <div className="space-y-4">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <section.icon className={`h-5 w-5 ${section.color}`} />
                </div>
                <h3 className="font-heading font-bold text-foreground">{section.title}</h3>
              </div>
              <ul className="space-y-2 pl-[52px]">
                {section.tips.map((tip, j) => (
                  <li key={j} className="text-sm text-muted-foreground">{tip}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default FemaleGuide;
