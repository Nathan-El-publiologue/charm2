import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Copy, Check, Trash2, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Favorite {
  id: string;
  message: string;
  category: string | null;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  icebreaker: "🔥 Accroche",
  followup: "💬 Relance",
  antighost: "👻 Anti-ghost",
  compliment: "💕 Compliment",
};

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchFavs = async () => {
      const { data } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setFavorites(data);
    };
    fetchFavs();
  }, [user]);

  const deleteFav = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    toast.success("Supprimé !");
  };

  const copyMsg = (msg: string, id: string) => {
    navigator.clipboard.writeText(msg);
    setCopied(id);
    toast.success("Copié !");
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = favorites
    .filter((f) => !filter || f.category === filter)
    .filter((f) => !search || f.message.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Mes Favoris</h1>
            <p className="text-sm text-muted-foreground">{favorites.length} messages sauvegardés</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
            className="glass border-border/50 rounded-2xl pl-10" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setFilter(null)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-all ${!filter ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
            Tous
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-all ${filter === key ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
              <Heart className="h-12 w-12 text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                {favorites.length === 0 ? "Aucun favori pour l'instant" : "Aucun résultat"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((fav) => (
                <motion.div key={fav.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }} layout className="glass rounded-2xl p-4 space-y-3">
                  {fav.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {categoryLabels[fav.category] || fav.category}
                    </span>
                  )}
                  <p className="text-sm text-foreground">{fav.message}</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => copyMsg(fav.message, fav.id)}
                      className="text-xs text-muted-foreground hover:text-primary">
                      {copied === fav.id ? <Check className="mr-1 h-3 w-3 text-green-400" /> : <Copy className="mr-1 h-3 w-3" />}
                      {copied === fav.id ? "Copié" : "Copier"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteFav(fav.id)}
                      className="text-xs text-muted-foreground hover:text-destructive">
                      <Trash2 className="mr-1 h-3 w-3" /> Supprimer
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default Favorites;
