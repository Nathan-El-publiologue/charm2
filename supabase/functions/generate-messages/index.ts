import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callLovableNonStream(messages: any[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash-lite", messages }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Lovable error ${response.status}: ${t}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{"messages":[]}';
}

async function callGeminiNonStream(messages: any[]) {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const systemMsg = messages.find((m: any) => m.role === "system");
  const userMsgs = messages.filter((m: any) => m.role !== "system").map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(systemMsg ? { system_instruction: { parts: [{ text: systemMsg.content }] } } : {}),
        contents: userMsgs,
      }),
    }
  );

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Gemini error ${response.status}: ${t}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '{"messages":[]}';
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, targetName, context } = await req.json();

    const categoryLabels: Record<string, string> = {
      icebreaker: "message d'accroche original et captivant",
      followup: "message de relance après un premier échange",
      antighost: "message de relance anti-ghosting (quand la personne ne répond plus)",
      compliment: "compliment sincère et original",
    };

    const categoryDesc = categoryLabels[category] || categoryLabels.icebreaker;

    const prompt = `Génère exactement 3 ${categoryDesc} en français.
${targetName ? `La personne s'appelle ${targetName}.` : ""}
${context ? `Contexte: ${context}` : ""}

RÈGLES:
- Messages courts et naturels (max 2 phrases)
- Ton respectueux et bienveillant
- Pas de clichés ni de messages génériques
- Adaptés à la culture francophone/africaine

Réponds UNIQUEMENT avec un JSON: {"messages": ["msg1", "msg2", "msg3"]}`;

    const messages = [
      { role: "system", content: "Tu es un expert en séduction respectueuse. Réponds uniquement en JSON valide." },
      { role: "user", content: prompt },
    ];

    let content: string;
    try {
      content = await callLovableNonStream(messages);
    } catch (e) {
      console.warn("Lovable failed, switching to Gemini:", e);
      content = await callGeminiNonStream(messages);
    }

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { messages: [content] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
