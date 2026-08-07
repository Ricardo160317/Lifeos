import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

const SYSTEM_PROMPT = `Eres un coach que ayuda a una persona a construir su "LifeOS", un sistema de planificación de vida con pilares (ej: Salud, Empresa, Finanzas, Desarrollo Personal, Familia, Espiritualidad — o los que la persona use).

Tu trabajo:
1. A partir de lo que la persona te cuenta, identifica en qué pilares cae.
2. Haz UNA pregunta corta y concreta a la vez para afinar el plan (valor actual, meta, plazo, obstáculo, frecuencia). Nunca varias preguntas en el mismo turno.
3. Siempre que aplique, da entre 3 y 5 opciones cortas de respuesta (rangos, frecuencias, plazos) pensadas para un botón. Si la pregunta necesita respuesta abierta única, usa "opciones":[].
4. No más de 2-3 preguntas por pilar mencionado. En cuanto tengas suficiente, genera el plan.
5. Responde SIEMPRE con un único JSON válido (sin markdown, sin texto fuera del JSON):

Pregunta: {"tipo":"pregunta","texto":"...","opciones":["...","...","..."]}
Plan final: {"tipo":"plan","vision":"...","pilares":[{"nombre":"...","objetivos":[{"nombre":"...","motivo":"...","valorActual":"...","valorMeta":"...","fechaObjetivo":"YYYY-MM-DD o vacío","prioridad":"alta|media|baja"}],"habitos":[{"nombre":"...","frecuencia":"diario|semanal"}],"kpis":[{"nombre":"...","valorActual":0,"valorMeta":0,"unidad":"..."}]}]}

6. Opciones cortas (2-4 palabras). Sé cálido pero breve.`;

// Proxy: el frontend nunca ve la API key, solo pasa el historial de mensajes
router.post("/chat", requireAuth, async (req, res) => {
  const { mensajes } = req.body;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...mensajes,
        ],
      }),
    });
    const data = await response.json();
    const texto = data.choices?.[0]?.message?.content ?? "";
    let limpio = texto.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    let parsed;
    try { parsed = JSON.parse(limpio); } catch { parsed = { tipo: "pregunta", texto, opciones: [] }; }
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error consultando la IA" });
  }
});

// Guarda el plan generado: crea el plan de vida + pilares + objetivos + hábitos + KPIs
router.post("/finalizar", requireAuth, async (req, res) => {
  const plan = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const planResult = await client.query(
      "INSERT INTO planes_vida (usuario_id, vision_texto) VALUES ($1, $2) RETURNING id",
      [req.usuarioId, plan.vision || ""]
    );
    const planId = planResult.rows[0].id;

    for (const [i, p] of (plan.pilares || []).entries()) {
      const pilarResult = await client.query(
        "INSERT INTO pilares (plan_vida_id, nombre, orden) VALUES ($1, $2, $3) RETURNING id",
        [planId, p.nombre, i]
      );
      const pilarId = pilarResult.rows[0].id;

      for (const o of p.objetivos || []) {
        await client.query(
          `INSERT INTO objetivos (pilar_id, nombre, motivo, valor_actual, valor_meta, fecha_objetivo, prioridad)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [pilarId, o.nombre, o.motivo || "", o.valorActual || "", o.valorMeta || "", o.fechaObjetivo || null, o.prioridad || "media"]
        );
      }
      for (const h of p.habitos || []) {
        await client.query("INSERT INTO habitos (pilar_id, nombre, frecuencia) VALUES ($1,$2,$3)", [pilarId, h.nombre, h.frecuencia || "diario"]);
      }
      for (const k of p.kpis || []) {
        await client.query(
          "INSERT INTO kpis (pilar_id, nombre, valor_actual, valor_meta, unidad) VALUES ($1,$2,$3,$4,$5)",
          [pilarId, k.nombre, Number(k.valorActual) || 0, Number(k.valorMeta) || 0, k.unidad || ""]
        );
      }
    }
    await client.query("COMMIT");
    res.json({ planId });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Error guardando el plan" });
  } finally {
    client.release();
  }
});

export default router;
