import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";
import { MALE_CHARACTERS } from "@/data/maleCharacters";

interface NotificationData {
  id: number;
  character: (typeof MALE_CHARACTERS)[0];
  message: string;
}

const NOTIFICATION_MESSAGES = [
  (name: string) => `${name} t'a envoyé un message 💬`,
  (name: string) => `${name} attend ta réponse...`,
  (name: string) => `${name} est en ligne maintenant 🟢`,
  (name: string) => `Nouveau message de ${name} 📩`,
  (name: string) => `${name} a regardé ton profil 👀`,
];

export const CharacterNotification = ({
  onOpenChat,
}: {
  onOpenChat?: (charName: string) => void;
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = useCallback(() => {
    const char = MALE_CHARACTERS[Math.floor(Math.random() * MALE_CHARACTERS.length)];
    const msgFn = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
    const notif: NotificationData = {
      id: Date.now(),
      character: char,
      message: msgFn(char.name),
    };
    setNotifications((prev) => [...prev.slice(-2), notif]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    }, 6000);
  }, []);

  useEffect(() => {
    // First notification after 30s of inactivity
    const initial = setTimeout(showNotification, 30000);
    // Then every 45-90s
    const interval = setInterval(() => {
      if (Math.random() > 0.4) showNotification();
    }, 45000 + Math.random() * 45000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [showNotification]);

  const dismiss = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed top-14 right-2 left-2 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="glass-strong rounded-2xl p-3 flex items-center gap-3 pointer-events-auto shadow-lg border border-border/30 cursor-pointer"
            onClick={() => {
              onOpenChat?.(notif.character.name);
              dismiss(notif.id);
            }}
          >
            <img
              src={notif.character.image}
              alt={notif.character.name}
              className="h-10 w-10 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">{notif.character.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{notif.message}</p>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4 text-primary" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss(notif.id);
                }}
                className="p-1 rounded-full hover:bg-secondary/50"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
