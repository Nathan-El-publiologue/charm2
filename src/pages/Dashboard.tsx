import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, MessageCircle, Heart, Calendar, TrendingUp, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({ messages_sent: 0, responses_received: 0, dates_obtained: 0 });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("success_metrics")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setMetrics(data);
      });
  }, [user]);

  const updateMetric = async (field: string, delta: number) => {
    if (!user) return;
    const newVal = Math.max(0, (metrics as any)[field] + delta);
    const { error } = await supabase
      .from("success_metrics")
      .update({ [field]: newVal })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Erreur");
      return;
    }
    setMetrics((prev) => ({ ...prev, [field]: newVal }));
  };

  const responseRate = metrics.messages_sent > 0
    ? Math.round((metrics.responses_received / metrics.messages_sent) * 100)
    : 0;

  const stats = [
    { icon: MessageCircle, label: "Messages envoyés", value: metrics.messages_sent, field: "messages_sent", color: "text-blue-400" },
    { icon: Heart, label: "Réponses reçues", value: metrics.responses_received, field: "responses_received", color: "text-pink-400" },
    { icon: Calendar, label: "Dates obtenus", value: metrics.dates_obtained, field: "dates_obtained", color: "text-green-400" },
  ];

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tableau de Bord</h1>
          <p className="text-sm text-muted-foreground">Suis tes progrès de séduction</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-6 text-center space-y-2"
        >
          <TrendingUp className="h-8 w-8 mx-auto text-accent" />
          <p className="text-4xl font-heading font-bold text-gradient">{responseRate}%</p>
          <p className="text-sm text-muted-foreground">Taux de réponse</p>
        </motion.div>

        <div className="space-y-3">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl"
                  onClick={() => updateMetric(stat.field, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl"
                  onClick={() => updateMetric(stat.field, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
