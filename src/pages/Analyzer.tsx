import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Camera, BarChart3, MessageCircle, Smile, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalysisResult {
  interest_level: number;
  tone: string;
  emoji_ratio: number;
  response_time: string;
  tips: string[];
  summary: string;
}

const Analyzer = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-screenshot", {
        body: { image },
      });
      if (error) throw error;
      setResult(data as AnalysisResult);
    } catch (err: any) {
      toast.error(err.message || "Erreur d'analyse");
    } finally {
      setAnalyzing(false);
    }
  };

  const metrics = result
    ? [
        { icon: TrendingUp, label: "Intérêt", value: `${result.interest_level}/10`, color: "text-green-400" },
        { icon: MessageCircle, label: "Ton", value: result.tone, color: "text-blue-400" },
        { icon: Smile, label: "Emoji ratio", value: `${result.emoji_ratio}%`, color: "text-yellow-400" },
        { icon: Clock, label: "Temps de réponse", value: result.response_time, color: "text-purple-400" },
      ]
    : [];

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Analyseur de Conversation</h1>
          <p className="text-sm text-muted-foreground">Upload un screenshot et l'IA analyse la conversation</p>
        </div>

        {!image ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => fileRef.current?.click()}
            className="w-full glass rounded-2xl p-12 flex flex-col items-center gap-4 border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
              <Camera className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Upload un screenshot</p>
              <p className="text-xs text-muted-foreground">PNG, JPG (max 5MB)</p>
            </div>
          </motion.button>
        ) : (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-2 overflow-hidden">
              <img src={image} alt="Screenshot" className="w-full rounded-xl max-h-64 object-contain" />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={analyze}
                disabled={analyzing}
                className="flex-1 gradient-primary text-primary-foreground rounded-2xl"
              >
                {analyzing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analyser
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="glass border-border/50 rounded-2xl"
                onClick={() => {
                  setImage(null);
                  setResult(null);
                }}
              >
                Changer
              </Button>
            </div>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((m, i) => (
                <div key={i} className="glass rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <m.icon className={`h-4 w-4 ${m.color}`} />
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                  </div>
                  <p className="font-heading font-bold text-lg text-foreground">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-4 space-y-3">
              <h3 className="font-heading font-bold text-foreground">Résumé</h3>
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </div>

            {result.tips?.length > 0 && (
              <div className="glass rounded-2xl p-4 space-y-3">
                <h3 className="font-heading font-bold text-foreground">Conseils</h3>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">💡</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Analyzer;
