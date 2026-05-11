import { motion } from "framer-motion";
import { usePresence } from "@/hooks/usePresence";

interface Props {
  name: string;
  isTyping?: boolean;
  className?: string;
}

/**
 * Compact realistic presence indicator: pulsing dot + status label.
 * Used in chat headers and character cards.
 */
export const PresenceIndicator = ({ name, isTyping, className = "" }: Props) => {
  const presence = usePresence(name, isTyping);
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <motion.span
        key={presence.tone}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`h-2 w-2 rounded-full ${presence.dotClass}`}
      />
      <span className="text-[10px] text-muted-foreground truncate">{presence.label}</span>
    </div>
  );
};
