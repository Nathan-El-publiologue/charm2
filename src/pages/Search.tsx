import { useState } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon, MapPin, Star, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NameProfile {
  id: number;
  name: string;
  personality: any;
  style: string;
  country: string;
  age_range: string;
  success_rate: number;
  examples: string[];
}

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NameProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase
        .from("names")
        .select("*")
        .ilike("name", `%${query.trim()}%`)
        .limit(20);
      if (error) throw error;
      setResults((data as NameProfile[]) || []);
    } catch (err: any) {
      toast.error("Erreur de recherche");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Recherche de Profils</h1>
          <p className="text-sm text-muted-foreground">Trouve un prénom et découvre sa personnalité</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher un prénom..."
              className="pl-10 glass border-border/50 rounded-2xl"
            />
          </div>
        </form>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Aucun profil trouvé pour "{query}"
          </div>
        )}

        <div className="space-y-3">
          {results.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                    <Heart className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground">{profile.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {profile.country} • {profile.age_range}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-accent">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="text-xs font-bold">{profile.success_rate}%</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs text-primary font-medium">
                  {profile.style}
                </span>
                {profile.personality?.traits?.slice(0, 3).map((t: string, j: number) => (
                  <span key={j} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>

              {profile.examples?.length > 0 && (
                <div className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Exemple d'approche :</p>
                  <p className="text-sm text-foreground italic">"{profile.examples[0]}"</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Search;
