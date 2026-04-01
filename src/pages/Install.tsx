import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Share, CheckCircle, Smartphone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import charmLogo from "@/assets/charm-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-8">
      <button onClick={() => navigate(-1)} className="self-start text-muted-foreground mb-4">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <motion.img
        src={charmLogo}
        alt="CharmAI"
        className="w-28 h-28 rounded-2xl shadow-lg mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      />

      <h1 className="text-2xl font-bold text-foreground mb-2">Installer CharmAI</h1>
      <p className="text-muted-foreground text-center text-sm mb-8 max-w-xs">
        Accède à CharmAI directement depuis ton écran d'accueil, comme une vraie app.
      </p>

      {isInstalled ? (
        <motion.div
          className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-green-500/10 border border-green-500/20"
          initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        >
          <CheckCircle className="w-12 h-12 text-green-400" />
          <p className="text-green-400 font-semibold">App déjà installée !</p>
        </motion.div>
      ) : deferredPrompt ? (
        <Button onClick={handleInstall} size="lg" className="gap-2 rounded-full px-8 bg-primary hover:bg-primary/90">
          <Download className="w-5 h-5" /> Installer l'app
        </Button>
      ) : isIOS ? (
        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-muted/30 border border-border max-w-xs">
          <Share className="w-10 h-10 text-primary" />
          <p className="text-foreground text-center text-sm font-medium">Sur Safari :</p>
          <ol className="text-muted-foreground text-sm space-y-2 list-decimal list-inside">
            <li>Appuie sur <strong>Partager</strong> <Share className="inline w-4 h-4" /></li>
            <li>Choisis <strong>"Sur l'écran d'accueil"</strong></li>
            <li>Confirme avec <strong>"Ajouter"</strong></li>
          </ol>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-muted/30 border border-border max-w-xs">
          <Smartphone className="w-10 h-10 text-primary" />
          <p className="text-muted-foreground text-center text-sm">
            Ouvre cette page dans <strong>Chrome</strong> ou <strong>Safari</strong> sur ton téléphone pour installer l'app.
          </p>
        </div>
      )}
    </div>
  );
};

export default Install;
