// Deterministic social-profile generator for AI characters.
// Same name ⇒ always same bio, posts, city, etc.

import type { CharacterProfile } from "@/data/characters";
import type { MaleCharacter } from "@/data/maleCharacters";

export type AnyCharacter =
  | (CharacterProfile & { kind?: "female" })
  | (MaleCharacter & { kind?: "male" });

export interface SocialPost {
  id: string;
  type: "quote" | "mood" | "lifestyle";
  text: string;
  emoji: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

export interface OnlineStatus {
  label: string; // "En ligne", "En train d'écrire…", "Actif il y a 5 min"
  tone: "online" | "typing" | "recent" | "offline";
}

export interface SocialProfile {
  fullName: string;
  age: number;
  city: string;
  country: string;
  profession: string;
  relationshipStatus: string;
  personalityType: string; // e.g. "ENFP-T"
  hobbies: string[];
  bio: string;
  traits: string[];
  compatibility: number; // 0-100
  status: OnlineStatus;
  posts: SocialPost[];
  followers: number;
  following: number;
  postCount: number;
}

// --- Deterministic helpers ----------------------------------------------------

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

const pick = <T,>(arr: readonly T[], seed: number): T => arr[seed % arr.length];

const range = (seed: number, min: number, max: number) =>
  min + (seed % Math.max(1, max - min + 1));

// --- Pools --------------------------------------------------------------------

const CITIES_FEMALE: readonly (readonly [string, string])[] = [
  ["Douala", "Cameroun"], ["Yaoundé", "Cameroun"], ["Abidjan", "Côte d'Ivoire"],
  ["Dakar", "Sénégal"], ["Libreville", "Gabon"], ["Kinshasa", "RDC"],
  ["Paris", "France"], ["Lyon", "France"], ["Bruxelles", "Belgique"],
  ["Montréal", "Canada"], ["Cotonou", "Bénin"], ["Lomé", "Togo"],
] as const;

const CITIES_MALE: readonly (readonly [string, string])[] = [
  ["Douala", "Cameroun"], ["Abidjan", "Côte d'Ivoire"], ["Dakar", "Sénégal"],
  ["Paris", "France"], ["Marseille", "France"], ["Bruxelles", "Belgique"],
  ["Libreville", "Gabon"], ["Yaoundé", "Cameroun"], ["Brazzaville", "Congo"],
  ["Toronto", "Canada"], ["Lagos", "Nigeria"], ["Genève", "Suisse"],
] as const;

const MBTI = [
  "INFJ-A", "ENFP-T", "ISTP-A", "ENTJ-A", "INFP-T",
  "ESFJ-A", "ISFP-T", "ENFJ-A", "INTJ-A", "ESTP-T",
];

const RELATIONSHIP = [
  "Célibataire", "Célibataire ouverte", "C'est compliqué",
  "Célibataire — vraies vibes uniquement", "Pas pressée",
];

const RELATIONSHIP_M = [
  "Célibataire", "Pas en couple", "Disponible",
  "Célibataire mais sélectif", "Pas pressé",
];

const PROF_FEMALE = [
  "Étudiante en marketing", "Community manager", "Esthéticienne",
  "Coiffeuse-styliste", "Assistante RH", "Infirmière",
  "Entrepreneure mode", "Photographe", "Chargée de communication",
  "Comptable", "Designer freelance", "Influenceuse lifestyle",
];

const PROF_MALE = [
  "Ingénieur logiciel", "Entrepreneur", "Commercial",
  "Consultant", "Pharmacien", "Architecte",
  "Chef de projet", "Journaliste sportif", "Coach business",
  "Trader crypto", "Médecin", "Producteur musical",
];

const QUOTES = [
  "Les vibes ne mentent jamais. ✨",
  "Tu attires ce que tu es, pas ce que tu veux.",
  "Sois ta propre raison de sourire aujourd'hui. 🌸",
  "La paix intérieure > tout le reste.",
  "Si c'est pas un oui clair, c'est un non.",
  "On grandit ou on s'éteint. Pas d'entre-deux.",
  "Le calme est un super-pouvoir. 🧘🏾",
  "Choisis-toi, chaque jour.",
  "Less drama, more dreams.",
  "Soft life is the goal. 🤎",
];

const MOODS = [
  "Mood du jour : café + playlist + bonne énergie ☕🎶",
  "Une journée à la fois.",
  "Petite session ciné en solo ce soir 🍿",
  "Brunch entre amies ce matin 🥞",
  "Workout done. Tête vide, cœur léger 💪🏾",
  "Plein de gratitude ce matin 🙏🏾",
  "Plage, soleil, et zéro notif 🌊",
  "Cooking my favorite dish tonight 👩🏾‍🍳",
  "Nouveau projet en route, je bosse en silence 🤫",
  "On célèbre les petites victoires aussi 🎉",
];

const LIFESTYLE = [
  "Sunset à tomber ce soir 🌅",
  "Nouveau spot découvert, validé ✅",
  "Tenue du jour : simplicité + confiance 👗",
  "Petit week-end loin de tout 🌴",
  "Café préféré, livre préféré, paix totale 📖",
  "Soirée entre proches, rien de mieux 🍷",
  "On essaie cette nouvelle adresse 🍽️",
  "Petit road trip improvisé 🚗💨",
];

const TRAITS_FEMALE = [
  "respectueuse", "ambitieuse", "fidèle", "drôle", "exigeante",
  "sensible", "indépendante", "spirituelle", "réservée", "passionnée",
  "calme", "spontanée", "curieuse", "loyale", "intuitive",
];

const TRAITS_MALE_BASE = [
  "respectueux", "ambitieux", "drôle", "loyal", "direct",
  "stable", "généreux", "discret", "passionné", "indépendant",
];

// --- Trait inference ----------------------------------------------------------

function inferTraitsFemale(c: CharacterProfile, seed: number): string[] {
  const t: string[] = [];
  const p = `${c.personality.style} ${c.personality.temperament} ${c.personality.emotionalBehavior}`.toLowerCase();
  if (/(timide|réservée|introvertie)/.test(p)) t.push("timide");
  if (/(séduc|provoc|flirt)/.test(p)) t.push("flirteuse");
  if (/(froid|distante|exigeante|sélective)/.test(p)) t.push("sélective");
  if (/(romantique|émot|sensible)/.test(p)) t.push("romantique");
  if (/(joyeu|positif|optimiste|fun)/.test(p)) t.push("joyeuse");
  if (/(intellect|cult|réfléchie|analytique)/.test(p)) t.push("intellectuelle");
  if (/(rebelle|cash|provoc|impulsive)/.test(p)) t.push("rebelle");
  if (/(maternelle|douce|attentionnée)/.test(p)) t.push("douce");
  if (/(spiri|mystér|énigmat|bohème)/.test(p)) t.push("mystérieuse");
  // Fill up to 4
  while (t.length < 4) {
    const cand = pick(TRAITS_FEMALE, seed + t.length * 13);
    if (!t.includes(cand)) t.push(cand);
  }
  return t.slice(0, 5);
}

function inferTraitsMale(c: MaleCharacter, seed: number): string[] {
  const t: string[] = [];
  const p = `${c.personality.style} ${c.personality.temperament}`.toLowerCase();
  const flags = c.personality.redFlags.join(" ").toLowerCase();
  if (/(respect|gentle|patient|écoute)/.test(p)) t.push("respectueux");
  if (/(séduc|charm|flirt|player)/.test(p)) t.push("flirteur");
  if (/(manipul|jalou|possess|contrôl)/.test(flags + p)) t.push("manipulateur");
  if (/(timide|introverti|hésitant)/.test(p)) t.push("timide");
  if (/(distant|froid|détaché|absent)/.test(p + flags)) t.push("émotionnellement distant");
  if (/(sérieux|stable|mature|posé)/.test(p)) t.push("sérieux");
  if (/(blagueur|drôle|fun|joyeux)/.test(p)) t.push("drôle");
  if (/(ambit|déterminé|leader)/.test(p)) t.push("ambitieux");
  if (/(émot|sensible|romantique)/.test(p)) t.push("romantique");
  while (t.length < 4) {
    const cand = pick(TRAITS_MALE_BASE, seed + t.length * 17);
    if (!t.includes(cand)) t.push(cand);
  }
  return t.slice(0, 5);
}

// --- Bio synthesis ------------------------------------------------------------

function bioFemale(c: CharacterProfile, hobbies: string[]): string {
  const interests = hobbies.slice(0, 2).join(" & ");
  const templates = [
    `J'aime les conversations sincères, ${interests}, et les âmes calmes. Pas fan du drama.`,
    `Soft girl energy. Passionnée de ${interests}. Cherche du vrai, pas du jeu.`,
    `${c.description}. Mes journées : ${interests}, et beaucoup de gratitude.`,
    `Ici pour des connexions vraies. ${interests} prennent toute ma place.`,
  ];
  return pick(templates, hash(c.name));
}

function bioMale(c: MaleCharacter, hobbies: string[]): string {
  const interests = hobbies.slice(0, 2).join(" & ");
  const templates = [
    `${c.age} ans. ${interests}. Je sais ce que je cherche, et c'est pas un jeu.`,
    `Passionné de ${interests}. Je préfère la qualité à la quantité.`,
    `${c.description}. Sur mon temps libre : ${interests}.`,
    `Ici par curiosité. Si on matche, on discute IRL.`,
  ];
  return pick(templates, hash(c.name));
}

// --- Status -------------------------------------------------------------------

function buildStatus(seed: number): OnlineStatus {
  const r = seed % 10;
  if (r < 3) return { label: "En ligne", tone: "online" };
  if (r < 5) return { label: "En train d'écrire…", tone: "typing" };
  if (r < 8) {
    const min = 3 + (seed % 55);
    return { label: `Actif il y a ${min} min`, tone: "recent" };
  }
  const h = 1 + (seed % 6);
  return { label: `Vu il y a ${h}h`, tone: "offline" };
}

// --- Posts --------------------------------------------------------------------

function buildPosts(seed: number): SocialPost[] {
  const ago = ["2h", "1j", "3j", "1 sem"];
  return [
    {
      id: "p1",
      type: "quote",
      text: pick(QUOTES, seed),
      emoji: "💭",
      likes: range(seed + 1, 42, 380),
      comments: range(seed + 2, 3, 47),
      timeAgo: ago[0],
    },
    {
      id: "p2",
      type: "mood",
      text: pick(MOODS, seed + 7),
      emoji: "✨",
      likes: range(seed + 11, 28, 240),
      comments: range(seed + 12, 2, 30),
      timeAgo: ago[1],
    },
    {
      id: "p3",
      type: "lifestyle",
      text: pick(LIFESTYLE, seed + 13),
      emoji: "📷",
      likes: range(seed + 21, 60, 510),
      comments: range(seed + 22, 5, 60),
      timeAgo: ago[2],
    },
    {
      id: "p4",
      type: "quote",
      text: pick(QUOTES, seed + 19),
      emoji: "🎯",
      likes: range(seed + 31, 35, 290),
      comments: range(seed + 32, 1, 25),
      timeAgo: ago[3],
    },
  ];
}

// --- Main ---------------------------------------------------------------------

export function buildSocialProfile(
  character: AnyCharacter,
  kind: "female" | "male",
): SocialProfile {
  const seed = hash(character.name);
  const isMale = kind === "male";
  const cityList = isMale ? CITIES_MALE : CITIES_FEMALE;
  const [city, country] = pick(cityList, seed);

  const profession = pick(isMale ? PROF_MALE : PROF_FEMALE, seed >> 2);

  const hobbies: string[] = isMale
    ? (character as MaleCharacter).personality.interests.slice(0, 5)
    : ((character as CharacterProfile).personality.interests.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5));

  const traits = isMale
    ? inferTraitsMale(character as MaleCharacter, seed)
    : inferTraitsFemale(character as CharacterProfile, seed);

  // Compatibility tied to "sincerityScore" if available, else seed-based.
  const sincerity = (character as MaleCharacter).sincerityScore;
  const baseCompat = typeof sincerity === "number"
    ? Math.round(sincerity * 0.7 + (seed % 25))
    : 60 + (seed % 35);
  const compatibility = Math.max(45, Math.min(98, baseCompat));

  const age = (character as MaleCharacter).age ?? (22 + (seed % 14));

  const bio = isMale
    ? bioMale(character as MaleCharacter, hobbies)
    : bioFemale(character as CharacterProfile, hobbies);

  return {
    fullName: character.name,
    age,
    city,
    country,
    profession,
    relationshipStatus: pick(isMale ? RELATIONSHIP_M : RELATIONSHIP, seed >> 3),
    personalityType: pick(MBTI, seed >> 4),
    hobbies,
    bio,
    traits,
    compatibility,
    status: buildStatus(seed),
    posts: buildPosts(seed),
    followers: range(seed + 100, 420, 24800),
    following: range(seed + 200, 180, 1400),
    postCount: range(seed + 300, 24, 312),
  };
}
