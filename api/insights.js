export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { context, dataSummary, messages = [] } = req.body || {};

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY no configurada en Vercel." });
  }

  const systemPrompt = `Sos GymbAI, el asistente personal de entrenamiento y nutrición del usuario dentro de la app Gymbro.
Tenés acceso a todos sus datos de entrenamiento y alimentación.
Respondé siempre en español, tuteando, de forma directa y conversacional.
Sé específico con números cuando los tenés. Recordá el contexto de toda la conversación.
Si el usuario te da instrucciones específicas sobre qué analizar, respetálas por encima de todo.

DATOS DEL USUARIO:
${dataSummary || "Sin datos disponibles."}

${context ? "INSTRUCCIONES DEL USUARIO:\n" + context : ""}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || "Error de la API" });

    const text = data.content?.[0]?.text || "No pude generar una respuesta.";
    res.json({ analysis: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
