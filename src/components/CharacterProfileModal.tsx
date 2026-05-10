import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Briefcase, Heart, Sparkles, MessageCircle, Grid3x3, Quote, Image as ImageIcon, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildSocialProfile, type AnyCharacter } from "@/lib/socialProfile";
import { useMemo, useState } from "react";

interface Props {
  character: AnyCharacter | null;
  kind: "female" | "male";
  onClose: () => void;
  onStartChat: () => void;
}

const StatusDot = ({ tone }: { tone: "online" | "typing" | "recent" | "offline" }) => {
  const cls =
    tone === "online" ? "bg-green-400 animate-pulse" :
    tone === "typing" ? "bg-blue-400 animate-pulse" :
    tone === "recent" ? "bg-yellow-400" : "bg-muted-foreground";
  return <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />;
};

export const CharacterProfileModal = ({ character, kind, onClose, onStartChat }: Props) => {
  const [tab, setTab] = useState<"posts" | "about">("posts");
  const profile = useMemo(
    () => (character ? buildSocialProfile(character, kind) : null),
    [character, kind],
  );

  return (
    <AnimatePresence>
      {character && profile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 24 }}
            className="min-h-full pb-24"
          >
            {/* Cover + close */}
            <div className="relative h-44 overflow-hidden">
              <img
                src={character.image}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover blur-xl scale-110 opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
              <button
                onClick={onClose}
                aria-label="Fermer le profil"
                className="absolute top-4 right-4 h-10 w-10 rounded-full glass flex items-center justify-center text-foreground hover:bg-secondary/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Header */}
            <div className="-mt-16 px-5">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <img
                    src={character.image}
                    alt={profile.fullName}
                    className="h-28 w-28 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                  <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-background flex items-center justify-center bg-background">
                    <StatusDot tone={profile.status.tone} />
                  </span>
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <h1 className="font-heading text-2xl font-bold text-foreground leading-tight truncate">
                    {profile.fullName}, {profile.age}
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <StatusDot tone={profile.status.tone} />
                    {profile.status.label}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mt-5 glass rounded-2xl p-3">
                <Stat label="Posts" value={profile.postCount} />
                <Stat label="Followers" value={profile.followers} />
                <Stat label="Following" value={profile.following} />
              </div>

              {/* Compatibility */}
              <div className="mt-5 glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Compatibilité</span>
                  </div>
                  <span className="text-lg font-heading font-bold text-primary">{profile.compatibility}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profile.compatibility}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full gradient-primary rounded-full"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="mt-5">
                <p className="text-sm text-foreground leading-relaxed italic">
                  « {profile.bio} »
                </p>
              </div>

              {/* Quick info */}
              <div className="mt-4 grid grid-cols-1 gap-2">
                <Info icon={<MapPin className="h-4 w-4" />} text={`${profile.city}, ${profile.country}`} />
                <Info icon={<Briefcase className="h-4 w-4" />} text={profile.profession} />
                <Info icon={<Heart className="h-4 w-4" />} text={profile.relationshipStatus} />
                <Info icon={<Sparkles className="h-4 w-4" />} text={`Type : ${profile.personalityType}`} />
              </div>

              {/* Traits */}
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Personnalité
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.traits.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-3 py-1.5 rounded-full glass border border-primary/20 text-foreground capitalize"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hobbies */}
              {profile.hobbies.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Centres d'intérêt
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.hobbies.map((h) => (
                      <span
                        key={h}
                        className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary capitalize"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="mt-6 flex gap-1 border-b border-border/40">
                <TabBtn active={tab === "posts"} onClick={() => setTab("posts")}>
                  <Grid3x3 className="h-4 w-4" /> Publications
                </TabBtn>
                <TabBtn active={tab === "about"} onClick={() => setTab("about")}>
                  <Quote className="h-4 w-4" /> À propos
                </TabBtn>
              </div>

              {/* Posts feed */}
              {tab === "posts" && (
                <div className="mt-4 space-y-3">
                  {profile.posts.map((post, i) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <img
                          src={character.image}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">{profile.fullName}</p>
                          <p className="text-[10px] text-muted-foreground">il y a {post.timeAgo}</p>
                        </div>
                        <PostBadge type={post.type} />
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        <span className="mr-1">{post.emoji}</span>
                        {post.text}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {post.comments}
                        </span>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}

              {tab === "about" && (
                <div className="mt-4 space-y-4 text-sm text-foreground">
                  <Section title="Bio">{profile.bio}</Section>
                  <Section title="Profession">{profile.profession}</Section>
                  <Section title="Localisation">{profile.city}, {profile.country}</Section>
                  <Section title="Statut amoureux">{profile.relationshipStatus}</Section>
                  <Section title="Type de personnalité">{profile.personalityType}</Section>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sticky CTA */}
          <div className="fixed bottom-0 inset-x-0 px-5 pb-5 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
            <Button
              onClick={onStartChat}
              className="w-full gradient-primary text-primary-foreground rounded-2xl h-12 text-base font-semibold gap-2 shadow-lg"
            >
              <MessageCircle className="h-5 w-5" />
              Démarrer la conversation
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="text-center">
    <p className="font-heading text-base font-bold text-foreground">
      {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
    </p>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
  </div>
);

const Info = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <span className="text-primary">{icon}</span>
    <span className="text-foreground">{text}</span>
  </div>
);

const TabBtn = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
      active
        ? "border-primary text-primary"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

const PostBadge = ({ type }: { type: "quote" | "mood" | "lifestyle" }) => {
  const map = {
    quote: { label: "Citation", icon: <Quote className="h-3 w-3" /> },
    mood: { label: "Mood", icon: <Sparkles className="h-3 w-3" /> },
    lifestyle: { label: "Lifestyle", icon: <ImageIcon className="h-3 w-3" /> },
  };
  const it = map[type];
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
      {it.icon} {it.label}
    </span>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="glass rounded-xl p-3">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
      {title}
    </p>
    <p className="text-foreground text-sm">{children}</p>
  </div>
);
