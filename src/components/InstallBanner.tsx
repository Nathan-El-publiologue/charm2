import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import charmLogo from "@/assets/charm-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const dismissed = localStorage.getItem("install-banner-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 3 * 24 * 60 * 60 * 1000) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // Show iOS instructions after 3s
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("install-banner-dismissed", Date.now().toString());
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed bottom-24 left-4 right-4 z-50 glass-strong rounded-2xl border border-primary/30 p-4 shadow-2xl shadow-primary/20"
        >
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <img src={charmLogo} alt="CharmAI" className="w-12 h-12 rounded-xl" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Installer CharmAI</p>
              <p className="text-xs text-muted-foreground truncate">
                {isIOS ? "Ajoute l'app à ton écran d'accueil" : "Accès rapide depuis ton écran d'accueil"}
              </p>
            </div>

            {isIOS ? (
              <div className="flex items-center gap-1 text-xs text-primary">
                <Share className="w-4 h-4" />
                <span className="font-medium">Partager</span>
              </div>
            ) : (
              <Button size="sm" onClick={handleInstall} className="rounded-full gap-1.5 bg-primary hover:bg-primary/90 text-xs px-4">
                <Download className="w-3.5 h-3.5" /> Installer
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
