import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

const Admin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [names, setNames] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newStyle, setNewStyle] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .then(({ data }) => {
        setIsAdmin(data && data.length > 0);
      });
  }, [user]);

  useEffect(() => {
    if (isAdmin) loadNames();
  }, [isAdmin]);

  const loadNames = async () => {
    const { data } = await supabase.from("names").select("*").order("id");
    if (data) setNames(data);
  };

  const addName = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("names").insert({
      name: newName.trim(),
      country: newCountry || "FR",
      style: newStyle || "direct",
      personality: { traits: [] },
    });
    if (error) {
      toast.error("Erreur");
      return;
    }
    toast.success("Profil ajouté !");
    setNewName("");
    setNewCountry("");
    setNewStyle("");
    loadNames();
  };

  const deleteName = async (id: number) => {
    await supabase.from("names").delete().eq("id", id);
    toast.success("Supprimé");
    loadNames();
  };

  if (isAdmin === null) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-accent" />
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Gérer la base de profils</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 space-y-3">
          <h3 className="font-heading font-bold text-foreground">Ajouter un profil</h3>
          <div className="space-y-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Prénom" className="glass border-border/50 rounded-xl" />
            <div className="flex gap-2">
              <Input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder="Pays" className="glass border-border/50 rounded-xl" />
              <Input value={newStyle} onChange={(e) => setNewStyle(e.target.value)} placeholder="Style" className="glass border-border/50 rounded-xl" />
            </div>
            <Button onClick={addName} className="w-full gradient-primary text-primary-foreground rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading font-bold text-foreground">Profils ({names.length})</h3>
          {names.map((n) => (
            <div key={n.id} className="glass rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{n.name}</p>
                <p className="text-xs text-muted-foreground">{n.country} • {n.style}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteName(n.id)} className="text-destructive h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Admin;
