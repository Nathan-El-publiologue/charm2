import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, User, Dumbbell, ArrowLeft, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { Msg } from "@/lib/streamChat";

const PROFILES = [
  { name: "Amina", personality: { style: "mystérieuse", humor: "subtil", interests: "voyages, musique" }, emoji: "💃" },
  { name: "Sarah", personality: { style: "pétillante", humor: "élevé", interests: "sport, cuisine" }, emoji: "🌟" },
  { name: "Léa", personality: { style: "intellectuelle", humor: "moyen", interests: "livres, cinéma" }, emoji: "📚" },
  { name: "Fatou", personality: { style: "directe", humor: "élevé", interests: "danse, mode" }, emoji: "✨" },
  { name: "Clara", personality: { style: "réservée", humor: "faible", interests: "nature, art" }, emoji: "🎨" },
];

const Training = () => {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState<typeof PROFILES[0] | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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

      const analysisText = `📸 *Analyse de la capture :*\n\n${data.summary || "Voici mon analyse de cette conversation."}\n\n💡 ${data.tips?.[0] || "Continue comme ça !"}`;
      
      setMessages((prev) => [
        ...prev,
        { role: "user", content: "📷 [Image envoyée pour analyse]" },
        { role: "assistant", content: analysisText },
      ]);
      setImagePreview(null);
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
    setMessages((prev) => [...prev, userMsg]);
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
          messages: [...messages, userMsg],
          targetName: selectedProfile.name,
          targetPersonality: selectedProfile.personality,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantSoFar = "";

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
                if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    }
    setIsLoading(false);
  };

  if (!selectedProfile) {
    return (
      <AppLayout>
        <div className="px-5 py-8 space-y-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Mode Entraînement</h1>
              <p className="text-sm text-muted-foreground mt-1">Choisis un profil pour t'entraîner</p>
            </div>
          </div>
          <div className="space-y-4">
            {PROFILES.map((p) => (
              <motion.button
                key={p.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedProfile(p)}
                className="w-full glass rounded-2xl p-5 flex items-center gap-4 text-left hover:border-primary/50 transition-all"
              >
                <span className="text-4xl">{p.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-base">{p.name}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">{p.personality.style} · {p.personality.interests}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedProfile(null); setMessages([]); setImagePreview(null); }}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedProfile.emoji}</span>
            <div>
              <h1 className="font-heading text-base font-bold text-foreground">{selectedProfile.name}</h1>
              <p className="text-[10px] text-muted-foreground capitalize">{selectedProfile.personality.style}</p>
            </div>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] glass px-2 py-1 rounded-full text-primary">🎭 Simulation</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
              <Dumbbell className="h-12 w-12 text-primary" />
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Envoie ton premier message à {selectedProfile.name} ou upload une capture d'écran pour qu'elle l'analyse ! 💬📸
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm">{selectedProfile.emoji}</div>}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "gradient-primary text-primary-foreground rounded-br-md" : "glass rounded-bl-md text-foreground"}`}>
                {msg.content}
              </div>
              {msg.role === "user" && <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary"><User className="h-3.5 w-3.5 text-foreground" /></div>}
            </motion.div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-sm">{selectedProfile.emoji}</div>
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
