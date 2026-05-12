import type { Msg } from "@/lib/streamChat";

export type ConversationScore = {
  communication: number;
  confidence: number;
  sincerity: number;
  overall: number;
  strengths: string[];
  improvements: string[];
  tip: string;
  exampleMessages: string[];
};

const QUESTION_RE = /\?/;
const HEDGE_WORDS = ["peut-être", "désolé", "je sais pas", "je sais pas trop", "j'sais pas", "euh", "bah", "genre"];
const COMPLIMENTS = ["beau", "belle", "magnifique", "joli", "intéressant", "incroyable", "génial", "j'aime", "j'adore"];
const OPEN_ENDED = [/qu'est-ce que/i, /comment/i, /pourquoi/i, /raconte/i, /parle.moi/i, /qu'est ce/i];

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export function scoreConversation(messages: Msg[]): ConversationScore {
  const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content || "");
  const total = userMsgs.length;

  if (total === 0) {
    return {
      communication: 0, confidence: 0, sincerity: 0, overall: 0,
      strengths: [], improvements: ["Envoie au moins quelques messages pour obtenir un retour"],
      tip: "Lance la conversation avec une question ouverte ou une observation sincère.",
      exampleMessages: [
        "Salut ! J'ai vu ton profil et ta passion pour [voyage/musique/sport] m'a intrigué — c'est quoi ton meilleur souvenir lié à ça ?",
        "Hey, question random : si tu pouvais reprendre un dîner avec n'importe qui demain soir, ce serait avec qui et pourquoi ?",
      ],
    };
  }

  const text = userMsgs.join(" \n ").toLowerCase();
  const avgLen = userMsgs.reduce((s, m) => s + m.length, 0) / total;
  const questionCount = userMsgs.filter((m) => QUESTION_RE.test(m)).length;
  const openCount = userMsgs.filter((m) => OPEN_ENDED.some((re) => re.test(m))).length;
  const hedgeCount = HEDGE_WORDS.reduce((c, w) => c + (text.split(w).length - 1), 0);
  const complimentCount = COMPLIMENTS.reduce((c, w) => c + (text.split(w).length - 1), 0);
  const exclamCount = (text.match(/!/g) || []).length;
  const emojiCount = (text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
  const personalRefs = (text.match(/\b(je|moi|mon|ma|mes)\b/g) || []).length;

  let communication = 50
    + Math.min(20, (questionCount / total) * 60)
    + Math.min(15, (openCount / total) * 40)
    + (avgLen > 25 && avgLen < 220 ? 10 : avgLen >= 220 ? -5 : -10)
    + Math.min(8, emojiCount * 2);

  let confidence = 65
    - Math.min(35, hedgeCount * 6)
    + (avgLen > 40 ? 10 : -5)
    - (questionCount / total > 0.7 ? 12 : 0)
    + Math.min(10, exclamCount * 2);

  let sincerity = 55
    + Math.min(20, complimentCount * 5)
    + Math.min(20, (personalRefs / total) * 8)
    - (emojiCount > total * 3 ? 15 : 0)
    + (avgLen > 30 ? 8 : 0);

  communication = clamp(communication);
  confidence = clamp(confidence);
  sincerity = clamp(sincerity);
  const overall = clamp((communication + confidence + sincerity) / 3);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (questionCount / total >= 0.3) strengths.push("Tu poses de bonnes questions pour faire parler l'autre");
  if (complimentCount >= 2) strengths.push("Tu sais glisser des compliments sincères");
  if (avgLen > 30 && avgLen < 180) strengths.push("Tes messages ont une bonne longueur, ni trop courts ni trop lourds");
  if (hedgeCount === 0) strengths.push("Ton ton est assuré, sans hésitations");
  if (openCount >= 2) strengths.push("Tes questions ouvertes relancent vraiment l'échange");

  if (hedgeCount >= 3) improvements.push("Évite les « peut-être », « désolé », « je sais pas » qui affaiblissent ton message");
  if (questionCount === 0) improvements.push("Pose au moins une question pour montrer ton intérêt");
  if (avgLen < 20) improvements.push("Tes messages sont très courts — développe un peu plus tes idées");
  if (avgLen > 220) improvements.push("Raccourcis tes messages, ils sont trop longs et difficiles à lire");
  if (complimentCount === 0) improvements.push("Glisse un compliment précis et sincère sur quelque chose de spécifique");
  if (emojiCount > total * 3) improvements.push("Limite les emojis, ils diluent ton message");

  const axes = [
    { key: "communication", value: communication },
    { key: "confidence", value: confidence },
    { key: "sincerity", value: sincerity },
  ].sort((a, b) => a.value - b.value);
  const weakest = axes[0].key;

  let tip = "";
  let exampleMessages: string[] = [];

  if (weakest === "communication") {
    tip = "Ta priorité : relancer avec des questions ouvertes qui invitent à raconter une histoire. Évite les « ça va ? » et préfère des questions qui demandent une vraie réponse.";
  } else if (weakest === "confidence") {
    tip = "Ta priorité : assume ce que tu dis. Supprime les « peut-être », « désolé », « je sais pas » et remplace-les par des affirmations claires suivies d'une question.";
  } else {
    tip = "Ta priorité : montre une attention sincère. Reprends un détail précis qu'on t'a dit et glisse un compliment spécifique plutôt que générique.";
  }
  exampleMessages = generateExamples(weakest as Axis, 0);

  return {
    communication, confidence, sincerity, overall,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    tip,
    exampleMessages,
  };
}
