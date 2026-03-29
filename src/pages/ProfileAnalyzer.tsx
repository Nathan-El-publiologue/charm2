import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ArrowLeft, Star, ThumbsUp, AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface ProfileAnalysis {
  score_global: number;
  bio_score: number;
  photo_score: number;
  bio_analysis: string;
  photo_analysis: string;
  points_forts: string[];
  ameliorations: string[];
  bio_suggestion: string;
  tips: string[];
}

const ProfileAnalyzer = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ProfileAnalysis | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-profile", { body: { image } });
      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      toast.error(err.message || "Erreur d'analyse");
    } finally {
      setAnalyzing(false);
    }
  };

  const scoreColor = (score: number) => score >= 7 ? "text-green-400" : score >= 4 ? "text-yellow-400" : "text-red-400";

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Analyseur de Profil</h1>
            <p className="text-sm text-muted-foreground">Améliore ton profil Tinder/Bumble</p>
          </div>
        </div>

        {!result ? (
          <div className="space-y-4">
            <label className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer border-dashed border-2 border-border/50 hover:border-primary/50 transition-all">
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              {image ? (
                <img src={image} alt="Profil" className="w-full max-h-64 object-contain rounded-xl" />
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Capture d'écran de ton profil dating</p>
                </>
              )}
            </label>
            {image && (
              <Button onClick={analyze} disabled={analyzing} className="w-full gradient-primary text-primary-foreground rounded-2xl">
                {analyzing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : "Analyser mon profil ✨"}
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Scores */}
              <div className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score Global</span>
                  <span className={`text-2xl font-bold ${scoreColor(result.score_global)}`}>{result.score_global}/10</span>
                </div>
                <Progress value={result.score_global * 10} className="h-2" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Bio</p>
                    <p className={`text-lg font-bold ${scoreColor(result.bio_score)}`}>{result.bio_score}/10</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Photos</p>
                    <p className={`text-lg font-bold ${scoreColor(result.photo_score)}`}>{result.photo_score}/10</p>
                  </div>
                </div>
              </div>

              {/* Points forts */}
              {result.points_forts.length > 0 && (
                <div className="glass rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-green-400" /><p className="text-sm font-bold text-foreground">Points forts</p></div>
                  {result.points_forts.map((p, i) => <p key={i} className="text-sm text-muted-foreground">✅ {p}</p>)}
                </div>
              )}

              {/* Améliorations */}
              {result.ameliorations.length > 0 && (
                <div className="glass rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-400" /><p className="text-sm font-bold text-foreground">À améliorer</p></div>
                  {result.ameliorations.map((a, i) => <p key={i} className="text-sm text-muted-foreground">⚡ {a}</p>)}
                </div>
              )}

              {/* Bio suggestion */}
              {result.bio_suggestion && (
                <div className="glass rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-bold text-foreground">💡 Bio suggérée</p>
                  <p className="text-sm text-primary italic">"{result.bio_suggestion}"</p>
                </div>
              )}

              {/* Tips */}
              {result.tips.length > 0 && (
                <div className="glass rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-accent" /><p className="text-sm font-bold text-foreground">Conseils</p></div>
                  {result.tips.map((t, i) => <p key={i} className="text-sm text-muted-foreground">💡 {t}</p>)}
                </div>
              )}

              <Button variant="outline" onClick={() => { setResult(null); setImage(null); }} className="w-full glass border-border/50 rounded-2xl">
                Analyser un autre profil
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </AppLayout>
  );
};

export default ProfileAnalyzer;
