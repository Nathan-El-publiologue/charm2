import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, BarChart3, MessageSquareWarning, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type MaleCharacter } from "@/data/maleCharacters";
import { streamChat, type Msg } from "@/lib/streamChat";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useGamification } from "@/hooks/useGamification";
import { useMessageLimit } from "@/hooks/useMessageLimit";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { Check, CheckCheck } from "lucide-react";

interface Props {
  character: MaleCharacter;
  onBack: () => void;
}

export const FemaleChat = ({ character, onBack }: Props) => {
  const { addXP } = useGamification();
  const { remaining, isLimitReached, isNearLimit, incrementCount, openWhatsApp, dailyLimit } = useMessageLimit();
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: character.openingMessage }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading || isLimitReached) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    incrementCount();

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

    const systemContext = `MODE FÉMININ - Tu joues le rôle de ${character.name}, un homme africain de ${character.age} ans.
PERSONNALITÉ: ${JSON.stringify(character.personality)}
DESCRIPTION: ${character.description}
RÈGLES:
- Tu ES ${character.name}, reste 100% dans le personnage
- Parle comme un vrai homme africain de ton profil
- Adapte ton ton à ta personnalité (${character.personality.style})
- Si le personnage a des red flags, montre-les subtilement
- Réagis de façon réaliste aux réponses
- Utilise du langage naturel, pas formel
- Maximum 2-3 phrases par message
- Ne casse JAMAIS le personnage`;

    try {
      await streamChat({ messages: [...messages, userMsg], onDelta: upsertAssistant, onDone: () => setIsLoading(false), systemContext });
      addXP?.(5, "Message envoyé en mode féminin");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: number) => {
    if (level <= 20) return "bg-green-400";
    if (level <= 50) return "bg-yellow-400";
    if (level <= 75) return "bg-orange-400";
    return "bg-red-400";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative">
          <img src={character.image} alt={character.name} className="h-9 w-9 rounded-full object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{character.name}</p>
          <PresenceIndicator name={character.name} isTyping={isLoading} />
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${remaining <= 10 ? "bg-red-400/20 text-red-400" : "bg-primary/20 text-primary"}`}>
            {remaining}/{dailyLimit}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setShowAnalysis(!showAnalysis)}>
            <BarChart3 className="h-5 w-5 text-primary" />
          </Button>
        </div>
      </div>

      {/* Near limit warning */}
      {isNearLimit && (
        <div className="px-4 py-2 bg-yellow-400/10 border-b border-yellow-400/20 flex items-center gap-2">
          <MessageSquareWarning className="h-4 w-4 text-yellow-400 shrink-0" />
          <p className="text-[11px] text-yellow-400">Plus que {remaining} messages aujourd'hui !</p>
        </div>
      )}

      {/* Analysis panel */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-border/30">
            <div className="px-4 py-3 space-y-3">
              <p className="text-xs font-bold text-foreground">📊 Analyse du profil</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Sincérité", value: character.sincerityScore, color: getRiskColor(100 - character.sincerityScore) },
                  { label: "Intérêt", value: character.interestLevel, color: "bg-blue-400" },
                  { label: "Risque", value: character.riskLevel, color: getRiskColor(character.riskLevel) },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-lg font-bold text-foreground">{s.value}%</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    <div className="h-1.5 rounded-full bg-secondary mt-1">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {character.personality.redFlags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {character.personality.redFlags.map((f) => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-red-400/10 text-red-400">🚩 {f}</span>
                  ))}
                </div>
              )}
              {character.personality.greenFlags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {character.personality.greenFlags.map((f) => (
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
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && <img src={character.image} alt={character.name} className="h-7 w-7 rounded-full object-cover shrink-0" />}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "gradient-primary text-primary-foreground rounded-br-md" : "glass rounded-bl-md"}`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
              ) : msg.content}
            </div>
          </motion.div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2">
            <img src={character.image} alt="" className="h-7 w-7 rounded-full object-cover" />
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

      {/* Input or Limit */}
      <div className="px-4 py-3 border-t border-border/30">
        {isLimitReached ? (
          <div className="text-center space-y-3 py-2">
            <p className="text-sm text-foreground">⚠️ Tu as atteint ta limite de {dailyLimit} messages aujourd'hui.</p>
            <p className="text-xs text-muted-foreground">Reviens demain pour continuer gratuitement.</p>
            <Button onClick={openWhatsApp} className="gradient-primary rounded-2xl gap-2">
              <ExternalLink className="h-4 w-4" />
              Obtenir plus de messages
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Réponds à son message..." className="glass border-border/50 rounded-2xl" disabled={isLoading} />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="gradient-primary rounded-2xl shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
