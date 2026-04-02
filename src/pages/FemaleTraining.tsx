import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Shield, AlertTriangle, Heart, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { MALE_CHARACTERS, type MaleCharacter } from "@/data/maleCharacters";
import { streamChat, type Msg } from "@/lib/streamChat";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useGamification } from "@/hooks/useGamification";

const FemaleTraining = () => {
  const { user } = useAuth();
  const { addXP } = useGamification();
  const [selectedChar, setSelectedChar] = useState<MaleCharacter | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = (char: MaleCharacter) => {
    setSelectedChar(char);
    setMessages([{ role: "assistant", content: char.openingMessage }]);
    setShowAnalysis(false);
    addXP?.(10, "Conversation mode féminin démarrée");
  };

  const send = async () => {
    if (!input.trim() || isLoading || !selectedChar) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    const systemContext = `MODE FÉMININ - Tu joues le rôle de ${selectedChar.name}, un homme africain de ${selectedChar.age} ans.
PERSONNALITÉ: ${JSON.stringify(selectedChar.personality)}
DESCRIPTION: ${selectedChar.description}
RÈGLES:
- Tu ES ${selectedChar.name}, reste 100% dans le personnage
- Parle comme un vrai homme africain de ton profil
- Adapte ton ton à ta personnalité (${selectedChar.personality.style})
- Si le personnage a des red flags, montre-les subtilement
- Réagis de façon réaliste aux réponses
- Utilise du langage naturel, pas formel
- Maximum 2-3 phrases par message
- Ne casse JAMAIS le personnage`;

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        systemContext,
      });
      addXP?.(5, "Message envoyé en mode féminin");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case "facile": return "text-green-400 bg-green-400/10";
      case "moyen": return "text-yellow-400 bg-yellow-400/10";
      case "difficile": return "text-orange-400 bg-orange-400/10";
      case "expert": return "text-red-400 bg-red-400/10";
      default: return "text-muted-foreground bg-secondary";
    }
  };

  const getRiskColor = (level: number) => {
    if (level <= 20) return "bg-green-400";
    if (level <= 50) return "bg-yellow-400";
    if (level <= 75) return "bg-orange-400";
    return "bg-red-400";
  };

  // Character selection screen
  if (!selectedChar) {
    return (
      <AppLayout>
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
                onClick={() => startConversation(char)}
                className="w-full glass rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
              >
                <img
                  src={char.image}
                  alt={char.name}
                  className="h-14 w-14 rounded-xl object-cover shrink-0"
                  loading="lazy"
                  width={56}
                  height={56}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{char.name}, {char.age} ans</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getDifficultyColor(char.difficulty)}`}>
                      {char.difficulty}
                    </span>
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
      </AppLayout>
    );
  }

  // Chat screen
  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedChar(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={selectedChar.image} alt={selectedChar.name} className="h-9 w-9 rounded-full object-cover" />
          <div className="flex-1">
            <p className="font-bold text-sm text-foreground">{selectedChar.name}</p>
            <p className="text-[10px] text-muted-foreground">{selectedChar.description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowAnalysis(!showAnalysis)}>
            <BarChart3 className="h-5 w-5 text-primary" />
          </Button>
        </div>

        {/* Analysis panel */}
        <AnimatePresence>
          {showAnalysis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border/30"
            >
              <div className="px-4 py-3 space-y-3">
                <p className="text-xs font-bold text-foreground">📊 Analyse du profil</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{selectedChar.sincerityScore}%</p>
                    <p className="text-[10px] text-muted-foreground">Sincérité</p>
                    <div className="h-1.5 rounded-full bg-secondary mt-1">
                      <div className={`h-full rounded-full ${getRiskColor(100 - selectedChar.sincerityScore)}`} style={{ width: `${selectedChar.sincerityScore}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{selectedChar.interestLevel}%</p>
                    <p className="text-[10px] text-muted-foreground">Intérêt</p>
                    <div className="h-1.5 rounded-full bg-secondary mt-1">
                      <div className="h-full rounded-full bg-blue-400" style={{ width: `${selectedChar.interestLevel}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{selectedChar.riskLevel}%</p>
                    <p className="text-[10px] text-muted-foreground">Risque</p>
                    <div className="h-1.5 rounded-full bg-secondary mt-1">
                      <div className={`h-full rounded-full ${getRiskColor(selectedChar.riskLevel)}`} style={{ width: `${selectedChar.riskLevel}%` }} />
                    </div>
                  </div>
                </div>
                {selectedChar.personality.redFlags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedChar.personality.redFlags.map((f) => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-red-400/10 text-red-400">🚩 {f}</span>
                    ))}
                  </div>
                )}
                {selectedChar.personality.greenFlags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedChar.personality.greenFlags.map((f) => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-green-400/10 text-green-400">✅ {f}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <img src={selectedChar.image} alt={selectedChar.name} className="h-7 w-7 rounded-full object-cover shrink-0" />
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "glass rounded-bl-md"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
            </motion.div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2">
              <img src={selectedChar.image} alt="" className="h-7 w-7 rounded-full object-cover" />
              <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border/30">
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Réponds à son message..."
              className="glass border-border/50 rounded-2xl"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="gradient-primary rounded-2xl shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default FemaleTraining;
