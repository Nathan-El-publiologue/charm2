import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callLovableVision(image: string, systemPrompt: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: [
          { type: "text", text: "Analyse cette conversation de dating:" },
          { type: "image_url", image_url: { url: image } },
        ]},
      ],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Lovable error ${response.status}: ${t}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "{}";
}

async function callOpenRouterVision(image: string, systemPrompt: string, model = "qwen/qwen3-next-80b-a3b-instruct:free") {
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
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: [
          { type: "text", text: "Analyse cette conversation de dating:" },
          { type: "image_url", image_url: { url: image } },
        ]},
      ],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${t}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "{}";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    if (!image) throw new Error("Image requise");

    const systemPrompt = `Tu es un expert en analyse de conversations de dating. Analyse le screenshot de conversation et retourne un JSON avec exactement cette structure:
{
  "interest_level": (nombre de 1 à 10),
  "tone": "(positif/neutre/froid/enthousiaste/distant)",
  "emoji_ratio": (pourcentage d'utilisation d'émojis),
  "response_time": "(rapide/moyen/lent/très lent)",
  "summary": "(résumé de l'analyse en 2-3 phrases)",
  "tips": ["conseil 1", "conseil 2", "conseil 3"]
}
Réponds UNIQUEMENT avec le JSON, sans markdown.`;

    let content: string;
    try {
      content = await callLovableVision(image, systemPrompt);
    } catch (e) {
      console.warn("Lovable failed, switching to OpenRouter:", e);
      try {
        content = await callOpenRouterVision(image, systemPrompt);
      } catch (e2) {
        console.warn("OpenRouter primary failed, using auto fallback:", e2);
        content = await callOpenRouterVision(image, systemPrompt, "openrouter/auto");
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        interest_level: 5, tone: "neutre", emoji_ratio: 0,
        response_time: "moyen", summary: content,
        tips: ["Analyse non structurée disponible dans le résumé"],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
