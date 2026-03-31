import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, ImagePlus, X, History, Clock, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CHARACTERS, type CharacterProfile } from "@/data/characters";
import type { Msg } from "@/lib/streamChat";
import type { Json } from "@/integrations/supabase/types";

type ConversationRow = {
  id: string;
  target_name: string | null;
  messages: Msg[];
  created_at: string;
};

const Training = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<CharacterProfile | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ConversationRow[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("id, target_name, messages, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setHistory(data as unknown as ConversationRow[]);
  }, [user]);

  useEffect(() => {
    if (showHistory) loadHistory();
  }, [showHistory, loadHistory]);

  const saveConversation = useCallback(async (msgs: Msg[]) => {
    if (!user || !selectedProfile || msgs.length === 0) return;
    const payload = {
      user_id: user.id,
      target_name: selectedProfile.name,
      target_personality: selectedProfile.personality as unknown as Json,
      messages: msgs as unknown as Json,
    };
    if (activeConvoId) {
      await supabase.from("conversations").update(payload).eq("id", activeConvoId);
    } else {
      const { data } = await supabase.from("conversations").insert([payload]).select("id").single();
      if (data) setActiveConvoId(data.id);
    }
  }, [user, selectedProfile, activeConvoId]);

  const reopenConversation = (convo: ConversationRow) => {
    const char = CHARACTERS.find((c) => c.name === convo.target_name);
    if (!char) return;
    setSelectedProfile(char);
    setMessages(convo.messages || []);
    setActiveConvoId(convo.id);
    setShowHistory(false);
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setHistory((prev) => prev.filter((c) => c.id !== id));
    toast.success("Conversation supprimée");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Seules les images et vidéos sont acceptées");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!imagePreview || !selectedProfile) return;
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-screenshot", {
        body: { image: imagePreview },
      });
      if (error) throw error;
      const analysisText = `📸 Analyse de la capture :\n\n${data.summary || "Voici mon analyse."}\n\n💡 ${data.tips?.[0] || "Continue comme ça !"}`;
      const newMsgs: Msg[] = [
        ...messages,
        { role: "user", content: "📷 [Image envoyée pour analyse]" },
        { role: "assistant", content: analysisText },
      ];
      setMessages(newMsgs);
      setImagePreview(null);
      saveConversation(newMsgs);
      toast.success("Image analysée !");
    } catch (e: any) {
      toast.error(e.message || "Erreur d'analyse");
    }
    setIsAnalyzing(false);
  };

  const send = async () => {
    if (!input.trim() || isLoading || !selectedProfile) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setInput("");
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simulate-chat`;
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          targetName: selectedProfile.name,
          targetPersonality: selectedProfile.personality,
        }),
      });

      if (resp.status === 429) throw new Error("Trop de requêtes. Réessayez dans un moment.");
      if (resp.status === 402) throw new Error("Crédits IA épuisés.");
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantSoFar = "";
      let finalMsgs = newMessages;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const c = JSON.parse(json).choices?.[0]?.delta?.content;
            if (c) {
              assistantSoFar += c;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  const updated = prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                  finalMsgs = updated;
                  return updated;
                }
                const updated = [...prev, { role: "assistant" as const, content: assistantSoFar }];
                finalMsgs = updated;
                return updated;
              });
            }
          } catch { /* partial */ }
        }
      }

      saveConversation(finalMsgs);
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    }
    setIsLoading(false);
  };

  const startNewChat = (char: CharacterProfile) => {
    setSelectedProfile(char);
    setMessages([]);
    setActiveConvoId(null);
    setImagePreview(null);
    setShowHistory(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Il y a quelques minutes";
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  const hoursLeft = (dateStr: string) => {
    const created = new Date(dateStr).getTime();
    const expiresAt = created + 48 * 3600000;
    const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 3600000));
    return left;
  };

  // Character selection / history screen
  if (!selectedProfile) {
    return (
      <AppLayout>
        <div className="px-5 py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-heading text-2xl font-bold text-foreground">Mode Entraînement</h1>
              <p className="text-sm text-muted-foreground mt-1">Choisis un personnage pour t'entraîner</p>
            </div>
            <Button
              variant={showHistory ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="rounded-xl gap-1.5"
            >
              <History className="h-4 w-4" />
              {showHistory ? "Profils" : "Historique"}
            </Button>
          </div>

          {/* Privacy notice */}
          <div className="glass rounded-xl px-4 py-3 flex items-start gap-3 text-xs text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <p>Tes conversations sont sauvegardées pendant <strong className="text-foreground">48 heures</strong> puis automatiquement supprimées pour ta confidentialité.</p>
          </div>

          <AnimatePresence mode="wait">
            {showHistory ? (
              <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Aucune conversation récente</p>
                  </div>
                ) : (
                  history.map((convo) => {
                    const char = CHARACTERS.find((c) => c.name === convo.target_name);
                    const remaining = hoursLeft(convo.created_at);
                    return (
                      <motion.div
                        key={convo.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl p-4 flex items-center gap-3"
                      >
                        <button onClick={() => reopenConversation(convo)} className="flex items-center gap-3 flex-1 text-left">
                          {char && (
                            <img src={char.image} alt={char.name} className="h-12 w-12 rounded-full object-cover border-2 border-primary/30" loading="lazy" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-sm">{convo.target_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {(convo.messages as Msg[])?.slice(-1)[0]?.content || "Conversation vide"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeAgo(convo.created_at)} · Expire dans {remaining}h
                            </p>
                          </div>
                        </button>
                        <Button variant="ghost" size="icon" onClick={() => deleteConversation(convo.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            ) : (
              <motion.div key="profiles" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                {(["facile", "moyen", "difficile", "expert"] as const).map((diff) => {
                  const chars = CHARACTERS.filter((c) => c.difficulty === diff);
                  if (chars.length === 0) return null;
                  const diffColors = { facile: "text-green-400 bg-green-400/10", moyen: "text-yellow-400 bg-yellow-400/10", difficile: "text-orange-400 bg-orange-400/10", expert: "text-red-400 bg-red-400/10" };
                  const diffEmojis = { facile: "🟢", moyen: "🟡", difficile: "🟠", expert: "🔴" };
                  return (
                    <div key={diff}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${diffColors[diff]}`}>
                          {diffEmojis[diff]} {diff}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{chars.length} personnages</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {chars.map((char) => (
                          <motion.button
                            key={char.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => startNewChat(char)}
                            className="glass rounded-2xl p-3 flex flex-col items-center gap-2 text-center hover:border-primary/50 transition-all"
                          >
                            <img src={char.image} alt={char.name} className="h-16 w-16 rounded-full object-cover border-2 border-primary/30" loading="lazy" width={64} height={64} />
                            <div>
                              <p className="font-bold text-foreground text-sm">{char.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{char.description}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
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
          <Button variant="ghost" size="icon" onClick={() => { setSelectedProfile(null); setMessages([]); setImagePreview(null); setActiveConvoId(null); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={selectedProfile.image} alt={selectedProfile.name} className="h-9 w-9 rounded-full object-cover border-2 border-primary/30" />
          <div>
            <h1 className="font-heading text-base font-bold text-foreground">{selectedProfile.name}</h1>
            <p className="text-[10px] text-muted-foreground">{selectedProfile.description}</p>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] glass px-2 py-1 rounded-full text-primary">🎭 Simulation</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
              <img src={selectedProfile.image} alt={selectedProfile.name} className="h-20 w-20 rounded-full object-cover border-2 border-primary/20" />
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Envoie ton premier message à {selectedProfile.name} ! 💬
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <img src={selectedProfile.image} alt={selectedProfile.name} className="h-7 w-7 rounded-full object-cover shrink-0 border border-primary/20" />
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "gradient-primary text-primary-foreground rounded-br-md" : "glass rounded-bl-md text-foreground"}`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2">
              <img src={selectedProfile.image} alt={selectedProfile.name} className="h-7 w-7 rounded-full object-cover border border-primary/20" />
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

        {/* Image preview */}
        {imagePreview && (
          <div className="px-4 py-2 border-t border-border/30">
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 rounded-xl object-cover border border-border/50" />
              <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                <X className="h-3 w-3" />
              </button>
            </div>
            <Button onClick={analyzeImage} disabled={isAnalyzing} size="sm" className="ml-3 gradient-primary text-primary-foreground rounded-xl text-xs">
              {isAnalyzing ? "Analyse..." : "📸 Analyser"}
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-border/30">
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 items-center">
            <input type="file" ref={fileRef} accept="image/*,video/*" onChange={handleImageUpload} className="hidden" />
            <Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()} className="shrink-0 text-muted-foreground hover:text-primary">
              <ImagePlus className="h-5 w-5" />
            </Button>
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message à ${selectedProfile.name}...`}
              className="glass border-border/50 rounded-2xl" disabled={isLoading} />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="gradient-primary rounded-2xl shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default Training;
