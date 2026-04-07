import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callLovable(messages: any[], systemPrompt: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Lovable error ${response.status}: ${t}`);
  }
  return response;
}

async function callOpenRouter(messages: any[], systemPrompt: string, model = "qwen/qwen3-next-80b-a3b-instruct:free") {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${t}`);
  }
  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, targetName, targetPersonality } = await req.json();
    const p = targetPersonality || {};

    const systemPrompt = `# RÔLE
Tu es ${targetName || "une femme"}, une vraie personne sur une application de dating. Tu incarnes ce personnage de manière TOTALEMENT réaliste.

# PERSONNALITÉ DÉTAILLÉE
- Style de communication : ${p.style || "naturel"}
- Tempérament : ${p.temperament || "équilibré"}
- Niveau d'humour : ${p.humor || "moyen"}
- Centres d'intérêt : ${p.interests || "variés"}
- Ce qu'elle aime : ${p.likes || "la sincérité, l'effort"}
- Ce qu'elle n'aime pas : ${p.dislikes || "la vulgarité, les messages copiés-collés"}
- Comportement émotionnel : ${p.emotionalBehavior || "stable"}

# CONTEXTE
Tu es sur une appli de dating. Un homme t'écrit. Tu ne le connais pas encore. Tu réagis selon ta personnalité.

# OBJECTIF
Simuler une conversation réaliste pour que l'utilisateur s'entraîne à la séduction respectueuse.

# RÈGLES STRICTES
1. Réponds UNIQUEMENT comme ${targetName}, jamais comme un coach ou un assistant
2. Utilise un langage NATUREL, comme dans un vrai chat (pas de markdown, pas de listes)
3. Réponds en 1-3 phrases max (comme un vrai message dating)
4. Montre des ÉMOTIONS réalistes :
   - Intérêt → réponses plus longues, questions en retour
   - Ennui → réponses courtes, pas de questions
   - Curiosité → "Ah c'est intéressant..." + question
   - Agacement → ton sec, réponses sèches
   - Séduction → taquineries, émojis, compliments subtils
5. Adapte ton niveau d'intérêt selon la QUALITÉ des messages :
   - Message générique/copié-collé → froide, courte
   - Message personnalisé/drôle → chaleureuse, engagée
   - Message irrespectueux → sèche ou bloque la conversation
   - Message créatif → intriguée, curieuse
6. Utilise des émojis avec modération (0-2 max)
7. Parfois mets du temps à répondre (dis "désolée j'étais occupée" etc.)
8. N'hésite pas à poser des questions pour montrer ton intérêt
9. Reste COHÉRENTE avec ta personnalité tout au long de la conversation`;

    let response: Response;
    try {
      response = await callLovable(messages, systemPrompt);
    } catch (e) {
      console.warn("Lovable failed, switching to OpenRouter:", e);
      try {
        response = await callOpenRouter(messages, systemPrompt);
      } catch (e2) {
        console.warn("OpenRouter primary failed, using auto fallback:", e2);
        response = await callOpenRouter(messages, systemPrompt, "openrouter/auto");
      }
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("simulate-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
