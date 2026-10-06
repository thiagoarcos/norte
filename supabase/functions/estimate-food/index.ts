// Vamo · Estimar calorías desde una foto del plato (Supabase Edge Function, Deno).
// La app manda la foto (JPEG en base64) y esta función le pregunta a Claude qué hay y cuántas
// kcal/macros tiene. La API key de Anthropic vive SOLO acá (secreto ANTHROPIC_API_KEY),
// nunca dentro de la app.
//
// Deploy:  npx supabase functions deploy estimate-food
//          npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Supabase verifica el JWT del usuario antes de ejecutar (solo usuarios logueados).
import Anthropic from "npm:@anthropic-ai/sdk";

const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nombre del alimento en español rioplatense" },
          portion: { type: "string", description: "Porción estimada, ej: '1 plato (250 g)'" },
          kcal: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
        },
        required: ["name", "portion", "kcal", "protein", "carbs", "fat"],
        additionalProperties: false,
      },
    },
    confidence: { type: "string", enum: ["alta", "media", "baja"] },
    note: { type: "string", description: "Aclaración corta para el usuario (máx. 1 oración)" },
  },
  required: ["items", "confidence", "note"],
  additionalProperties: false,
};

const PROMPT = `Sos el estimador de calorías de Vamo, una app de fitness argentina.
Mirá la foto y listá cada alimento visible con una porción realista (usá el plato y los cubiertos como referencia de tamaño) y sus kcal, proteína, carbohidratos y grasas en gramos.
Considerá el aceite o manteca de la cocción si se nota (frituras, salteados).
Si la foto no muestra comida, devolvé items vacío y explicalo en note.
Si el usuario agregó un comentario, usalo para afinar (ej: "era media porción").`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { image, mediaType = "image/jpeg", comment = "" } = await req.json();
    if (typeof image !== "string" || image.length < 100) {
      return Response.json({ error: "Falta la foto" }, { status: 400, headers: cors });
    }
    if (image.length > 7_000_000) {
      return Response.json({ error: "La foto es muy grande" }, { status: 413, headers: cors });
    }

    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low", // tarea de extracción simple: rápida y barata
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
          { type: "text", text: comment ? `${PROMPT}\n\nComentario del usuario: ${String(comment).slice(0, 300)}` : PROMPT },
        ],
      }],
    } as any);

    if (response.stop_reason === "refusal") {
      return Response.json({ error: "No pude analizar esa foto. Probá con otra o cargalo a mano." }, { status: 422, headers: cors });
    }
    const text = response.content.find((b: { type: string }) => b.type === "text") as { text: string } | undefined;
    if (!text) throw new Error("respuesta vacía");
    const data = JSON.parse(text.text);
    const total = data.items.reduce(
      (a: Record<string, number>, i: Record<string, number>) => ({
        kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
    for (const k of Object.keys(total)) total[k] = Math.round(total[k]);
    return Response.json({ ...data, total }, { headers: cors });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Muchas fotos seguidas, esperá un minuto." }, { status: 429, headers: cors });
    }
    if (e instanceof Anthropic.APIError) {
      return Response.json({ error: `Error del servicio de IA (${e.status})` }, { status: 502, headers: cors });
    }
    return Response.json({ error: String((e as Error)?.message ?? e) }, { status: 500, headers: cors });
  }
});
