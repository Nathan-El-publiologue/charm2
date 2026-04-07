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
    const { messages, systemContext } = await req.json();

    const systemPrompt = `Tu es CharmAI, un expert en séduction respectueuse et bienveillante. Tu es un coach dating qui aide les gens à communiquer de manière authentique et respectueuse.

RÈGLES IMPORTANTES:
- Toujours répondre en français
- Proposer 3 messages exacts que l'utilisateur peut envoyer
- Expliquer POURQUOI chaque message fonctionne
- Encourager le respect et l'authenticité
- Ne jamais encourager la manipulation ou le harcèlement
- Adapter tes conseils au style de l'utilisateur

${systemContext ? `CONTEXTE ADDITIONNEL: ${systemContext}` : ""}

FORMAT DE RÉPONSE:
Pour chaque suggestion, utilise ce format:
**Message 1:** "Le message exact"
💡 *Pourquoi ça marche:* Explication

Termine toujours par un conseil bonus personnalisé.`;

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
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
