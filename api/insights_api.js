export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { context, dataSummary } = req.body || {};

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY no configurada en Vercel." });
  }

  const systemPrompt = `Sos un analizador de rendimiento personal para alguien que trackea su entrenamiento de fuerza y su alimentación. 
Tu tarea: encontrar patrones útiles y accionables en sus datos.
Respondé siempre en español, de forma directa y personal (tuteá).
Sé específico con números cuando los tenés. Evitá frases genéricas.
Si el usuario te dio instrucciones específicas, respetálas por encima de todo.`;

  const userPrompt = `${context ? `MIS INSTRUCCIONES PARA EL ANÁLISIS:\n${context}\n\n` : ""}RESUMEN DE MIS DATOS:\n${dataSummary}\n\nGenerá entre 2 y 5 insights accionables basados en mis datos y mis instrucciones. Cada insight en un párrafo corto, empezando con un emoji que refleje si es positivo 🟢, negativo 🔴, o neutral 💡. No repitas los datos crudos, interpretá y concluí.`;

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
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || "Error de la API" });

    const text = data.content?.[0]?.text || "No pude generar un análisis.";
    res.json({ analysis: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
