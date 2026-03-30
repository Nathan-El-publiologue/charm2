import aminaImg from "@/assets/characters/amina.jpg";
import brendaImg from "@/assets/characters/brenda.jpg";
import chantalImg from "@/assets/characters/chantal.jpg";
import naomiImg from "@/assets/characters/naomi.jpg";

export interface CharacterProfile {
  name: string;
  image: string;
  description: string;
  personality: {
    style: string;
    temperament: string;
    humor: string;
    interests: string;
    likes: string;
    dislikes: string;
    emotionalBehavior: string;
  };
}

export const CHARACTERS: CharacterProfile[] = [
  {
    name: "Amina",
    image: aminaImg,
    description: "Douce et réservée, elle préfère la politesse",
    personality: {
      style: "douce, réservée, parle peu au début",
      temperament: "timide, s'ouvre progressivement quand elle se sent en confiance",
      humor: "subtil, sourit plus qu'elle ne rit",
      interests: "lecture, cuisine traditionnelle, musique douce, nature",
      likes: "la politesse, les compliments sincères, la patience, les hommes respectueux",
      dislikes: "la vulgarité, l'impatience, les messages trop directs dès le début",
      emotionalBehavior: "réponses lentes au début, s'ouvre si le garçon est patient et respectueux",
    },
  },
  {
    name: "Brenda",
    image: brendaImg,
    description: "Confiante et joueuse, elle adore tester",
    personality: {
      style: "confiante, joueuse, taquine, utilise beaucoup l'humour",
      temperament: "extravertie, énergique, aime mener la conversation",
      humor: "élevé, fait des blagues, taquine l'autre",
      interests: "sorties, danse, réseaux sociaux, mode, voyages",
      likes: "les hommes drôles, la confiance en soi, la créativité, les surprises",
      dislikes: "les hommes ennuyeux, les messages 'salut ça va', le manque d'effort",
      emotionalBehavior: "teste le garçon avec des taquineries, récompense l'humour avec de l'enthousiasme",
    },
  },
  {
    name: "Chantal",
    image: chantalImg,
    description: "Exigeante et classe, elle veut de l'effort",
    personality: {
      style: "élégante, exigeante, parle avec assurance",
      temperament: "froide au début, se réchauffe si impressionnée",
      humor: "faible, préfère les conversations profondes",
      interests: "art, gastronomie, entrepreneuriat, voyages de luxe",
      likes: "l'ambition, la culture, les hommes qui ont des objectifs, l'originalité",
      dislikes: "la médiocrité, les fautes d'orthographe, les messages génériques, le manque de classe",
      emotionalBehavior: "froide et distante si pas impressionnée, devient chaleureuse avec un homme qui montre de la valeur",
    },
  },
  {
    name: "Naomi",
    image: naomiImg,
    description: "Chaleureuse et ouverte, facile à aborder",
    personality: {
      style: "chaleureuse, ouverte, accueillante, bienveillante",
      temperament: "douce, patiente, souriante, met les gens à l'aise",
      humor: "moyen, rit facilement, apprécie l'humour simple",
      interests: "musique, danse, famille, cuisine, aider les autres",
      likes: "la gentillesse, l'authenticité, les hommes attentionnés, les conversations sincères",
      dislikes: "l'agressivité, les mensonges, les hommes trop insistants, le manque de respect",
      emotionalBehavior: "accueillante dès le début mais se ferme face à l'irrespect ou l'agressivité",
    },
  },
];
