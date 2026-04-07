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
          { type: "text", text: "Analyse ce profil dating et donne-moi des conseils pour l'améliorer." },
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
  return data.choices?.[0]?.message?.content || "";
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
          { type: "text", text: "Analyse ce profil dating et donne-moi des conseils pour l'améliorer." },
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
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "Image requise" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Tu es un expert en profils de dating (Tinder, Bumble, Hinge, etc.). Analyse cette capture d'écran de profil et donne des conseils détaillés.

RETOURNE UN JSON avec cette structure exacte:
{
  "score_global": number (1-10),
  "bio_score": number (1-10),
  "photo_score": number (1-10),
  "bio_analysis": "analyse détaillée de la bio",
  "photo_analysis": "analyse détaillée des photos visibles",
  "points_forts": ["point fort 1", "point fort 2"],
  "ameliorations": ["amélioration 1", "amélioration 2", "amélioration 3"],
  "bio_suggestion": "suggestion de bio améliorée",
  "tips": ["conseil 1", "conseil 2", "conseil 3"]
}

Sois constructif, précis et bienveillant. Donne des conseils actionnables.`;

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

    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const analysis = JSON.parse(cleaned);
      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ 
        score_global: 5, bio_score: 5, photo_score: 5,
        bio_analysis: content, photo_analysis: "",
        points_forts: [], ameliorations: [], bio_suggestion: "", tips: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("analyze-profile error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
