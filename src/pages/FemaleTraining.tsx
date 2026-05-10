import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { MALE_CHARACTERS, type MaleCharacter } from "@/data/maleCharacters";
import { FemaleChat } from "@/components/FemaleChat";
import { CharacterNotification } from "@/components/CharacterNotification";
import { CharacterProfileModal } from "@/components/CharacterProfileModal";
import { useGamification } from "@/hooks/useGamification";

const getDifficultyColor = (d: string) => {
  switch (d) {
    case "facile": return "text-green-400 bg-green-400/10";
    case "moyen": return "text-yellow-400 bg-yellow-400/10";
    case "difficile": return "text-orange-400 bg-orange-400/10";
    case "expert": return "text-red-400 bg-red-400/10";
    default: return "text-muted-foreground bg-secondary";
  }
};

const FemaleTraining = () => {
  const { addXP } = useGamification();
  const [selectedChar, setSelectedChar] = useState<MaleCharacter | null>(null);
  const [previewChar, setPreviewChar] = useState<MaleCharacter | null>(null);

  const startConversation = (char: MaleCharacter) => {
    setSelectedChar(char);
    addXP?.(10, "Conversation mode féminin démarrée");
  };

  if (selectedChar) {
    return (
      <AppLayout>
        <FemaleChat character={selectedChar} onBack={() => setSelectedChar(null)} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CharacterNotification onOpenChat={(name) => {
        const char = MALE_CHARACTERS.find((c) => c.name === name);
        if (char) startConversation(char);
      }} />
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Mode Féminin 👩🏾</h1>
          <p className="text-sm text-muted-foreground">Apprends à décrypter les hommes en toute sécurité</p>
        </div>

        <div className="space-y-3">
          {MALE_CHARACTERS.map((char, i) => (
            <motion.button
              key={char.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setPreviewChar(char)}
              className="w-full glass rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <img src={char.image} alt={char.name} className="h-14 w-14 rounded-xl object-cover shrink-0" loading="lazy" width={56} height={56} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">{char.name}, {char.age} ans</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${getDifficultyColor(char.difficulty)}`}>{char.difficulty}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{char.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-pink-400" />
                    <span className="text-[10px] text-muted-foreground">{char.sincerityScore}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-400" />
                    <span className="text-[10px] text-muted-foreground">{char.riskLevel}%</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      <CharacterProfileModal
        character={previewChar}
        kind="male"
        onClose={() => setPreviewChar(null)}
        onStartChat={() => {
          if (previewChar) startConversation(previewChar);
          setPreviewChar(null);
        }}
      />
    </AppLayout>
  );
};

export default FemaleTraining;
