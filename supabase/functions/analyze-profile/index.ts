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

async function callGeminiVision(image: string, systemPrompt: string) {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const match = image.match(/^data:(.*?);base64,(.*)$/);
  const parts: any[] = [{ text: "Analyse ce profil dating et donne-moi des conseils pour l'améliorer." }];
  
  if (match) {
    parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
  } else {
    parts.push({ text: `[Image URL: ${image}]` });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts }],
      }),
    }
  );

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Gemini error ${response.status}: ${t}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
      console.warn("Lovable failed, switching to Gemini:", e);
      content = await callGeminiVision(image, systemPrompt);
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
