import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, MessageSquare, Ghost, Heart, Flame, BookHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useGamification } from "@/hooks/useGamification";

const categories = [
  { id: "icebreaker", label: "Accroche", icon: Flame, emoji: "🔥" },
  { id: "followup", label: "Relance", icon: MessageSquare, emoji: "💬" },
  { id: "antighost", label: "Anti-ghost", icon: Ghost, emoji: "👻" },
  { id: "compliment", label: "Compliment", icon: Heart, emoji: "💕" },
];

const Generator = () => {
  const { user } = useAuth();
  const { addXP } = useGamification();
  const [category, setCategory] = useState("icebreaker");
  const [targetName, setTargetName] = useState("");
  const [context, setContext] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const generate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-messages", {
        body: { category, targetName, context },
      });
      if (error) throw error;
      setMessages(data?.messages || []);
      setSaved(new Set());
      addXP(15, "Messages générés !");
    } catch (err: any) {
      toast.error(err.message || "Erreur de génération");
    } finally {
      setGenerating(false);
    }
  };

  const copyMessage = (msg: string, index: number) => {
    navigator.clipboard.writeText(msg);
    setCopied(index);
    toast.success("Copié !");
    setTimeout(() => setCopied(null), 2000);
  };

  const saveFavorite = async (msg: string, index: number) => {
    if (!user || saved.has(index)) return;
    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      message: msg,
      category,
    });
    if (error) {
      toast.error("Erreur de sauvegarde");
      return;
    }
    setSaved((prev) => new Set(prev).add(index));
    toast.success("Ajouté aux favoris !");
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Générateur de Messages</h1>
          <p className="text-sm text-muted-foreground">L'IA crée des messages adaptés à ta situation</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`glass rounded-2xl p-3 flex items-center gap-2 transition-all ${
                category === cat.id ? "border-primary/50 ring-1 ring-primary/30" : "border-border/50"
              }`}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span className="text-sm font-medium text-foreground">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <Input value={targetName} onChange={(e) => setTargetName(e.target.value)}
            placeholder="Prénom de la personne (optionnel)" className="glass border-border/50 rounded-2xl" />
          <Input value={context} onChange={(e) => setContext(e.target.value)}
            placeholder="Contexte (ex: rencontré en soirée)" className="glass border-border/50 rounded-2xl" />
          <Button onClick={generate} disabled={generating} className="w-full gradient-primary text-primary-foreground rounded-2xl">
            {generating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (
              <><Sparkles className="mr-2 h-4 w-4" />Générer 3 messages</>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {messages.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-4 space-y-3">
                  <p className="text-sm text-foreground">{msg}</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => copyMessage(msg, i)}
                      className="text-xs text-muted-foreground hover:text-primary">
                      {copied === i ? <Check className="mr-1 h-3 w-3 text-green-400" /> : <Copy className="mr-1 h-3 w-3" />}
                      {copied === i ? "Copié" : "Copier"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => saveFavorite(msg, i)}
                      className={`text-xs ${saved.has(i) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
                      <BookHeart className={`mr-1 h-3 w-3 ${saved.has(i) ? "fill-primary" : ""}`} />
                      {saved.has(i) ? "Sauvegardé" : "Favoris"}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default Generator;
