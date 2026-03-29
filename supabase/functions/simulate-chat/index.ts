import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, targetName, targetPersonality } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const traits = targetPersonality || {};
    const systemPrompt = `Tu es ${targetName || "une personne"} sur une application de dating. Tu joues le rôle de cette personne pour un entraînement de séduction.

PERSONNALITÉ:
- Style: ${traits.style || "décontracté"}
- Humeur: ${traits.humor || "moyen"}
- Intérêts: ${traits.interests || "variés"}
- Niveau d'intérêt initial: moyen (tu n'es ni trop facile ni trop difficile)

RÈGLES:
- Réponds COMME cette personne, pas comme un coach
- Utilise un langage naturel et décontracté, comme sur une vraie appli de dating
- Sois réaliste : parfois enthousiate, parfois un peu distant(e)
- Réponds en 1-3 phrases max (comme un vrai message dating)
- N'utilise PAS de markdown, écris en texte simple
- Adapte ton niveau d'intérêt selon la qualité des messages reçus
- Si le message est générique/ennuyeux → réponse courte et peu enthousiaste
- Si le message est créatif/drôle → réponse plus engagée
- Utilise des émojis avec modération (0-2 max par message)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans un moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
