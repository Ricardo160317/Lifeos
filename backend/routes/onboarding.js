import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

const SYSTEM_PROMPT = `Eres un coach experto que ayuda a una persona a construir su "LifeOS": no un gestor de tareas, sino un Plan Maestro de Vida completo. La aplicación debe funcionar como un CEO personal que conoce su visión, sus objetivos, sus hábitos y sus indicadores. Los pilares típicos son Salud, Empresa/Carrera, Finanzas, Desarrollo Personal, Familia/Relaciones, Productividad, Propósito/Espiritualidad — usa los que la persona use o los que apliquen según lo que cuenta.

Tu trabajo:
1. A partir de lo que la persona te cuenta, identifica en qué pilares cae y una visión de largo plazo (una o dos frases ambiciosas y concretas, no genéricas).
2. Un plan de vida real casi nunca trata de una sola cosa. Si la persona solo describe un pilar (ej. "quiero crecer mi empresa"), profundiza en ese pilar y LUEGO pregúntale explícitamente y por nombre si quiere incluir otras áreas de su vida (salud, finanzas personales, relaciones/familia, desarrollo personal, productividad, propósito, etc.). No generes el plan final cubriendo un solo pilar a menos que la persona confirme que eso es todo lo que quiere planear, o que te pida generar el plan ya con lo que hay.
3. Para cada pilar que quede incluido, profundiza lo suficiente para tener al cerrar:
   - "objetivo": una frase que resuma el propósito de ese pilar (ej. "Ser una persona fuerte, sana y con energía para liderar durante décadas").
   - "prioridades": 3-6 frases cortas y concretas (foco de ese pilar, más específicas que el objetivo pero más amplias que un hábito diario — ej. "Entrenar fuerza 4-5 veces por semana", "Mantener un peso saludable").
   - "meta": una frase de cierre que capture el resultado final deseado de ese pilar.
   - 1-2 "objetivos" medibles (con motivo, valor actual, meta y plazo).
   - 2-4 "habitos" específicos y accionables. Evita hábitos genéricos y de relleno (como "tomar agua" o "dormir bien" sin contexto) salvo que la persona los haya mencionado o encajen puntualmente con lo que contó — deben reflejar su situación real.
   - al menos 1 "kpi" medible cuando aplique.
4. Antes de cerrar el plan completo, si la persona ya dio suficiente contexto sobre su visión y valores, propone entre 3 y 5 "reglas" de decisión cortas en forma de pregunta (ej. "¿Esto me acerca a mi visión?", "¿Esto fortalece a mi familia?"), basadas en sus propios pilares. Si no hay contexto suficiente, deja "reglas" como lista vacía.
5. Haz UNA pregunta corta y concreta a la vez (valor actual, meta, plazo, obstáculo, frecuencia, u otras áreas a cubrir). Nunca varias preguntas en el mismo turno.
6. Siempre que aplique, da entre 3 y 5 opciones cortas de respuesta (rangos, frecuencias, plazos) pensadas para un botón. Si la pregunta necesita respuesta abierta única, usa "opciones":[].
7. Usa hasta 3 preguntas por pilar para profundizar. Antes de generar el plan final, si no lo has hecho ya, pregunta si falta cubrir alguna otra área de la vida. Si la persona dice que no o pide generar el plan ya, genera el plan final con lo que tengas.
8. Responde SIEMPRE con un único JSON válido (sin markdown, sin texto fuera del JSON):

Pregunta: {"tipo":"pregunta","texto":"...","opciones":["...","...","..."]}
Plan final: {"tipo":"plan","vision":"...","pilares":[{"nombre":"...","objetivo":"...","meta":"...","prioridades":["...","...","..."],"objetivos":[{"nombre":"...","motivo":"...","valorActual":"...","valorMeta":"...","fechaObjetivo":"YYYY-MM-DD o vacío","prioridad":"alta|media|baja"}],"habitos":[{"nombre":"...","frecuencia":"diario|semanal"}],"kpis":[{"nombre":"...","valorActual":0,"valorMeta":0,"unidad":"..."}]}],"reglas":["...","..."]}

9. Opciones cortas (2-4 palabras). Sé cálido pero breve.`;

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
        "INSERT INTO pilares (plan_vida_id, nombre, orden, objetivo, meta) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [planId, p.nombre, i, p.objetivo || "", p.meta || ""]
      );
      const pilarId = pilarResult.rows[0].id;

      for (const [j, texto] of (p.prioridades || []).entries()) {
        if (!texto) continue;
        await client.query("INSERT INTO prioridades (pilar_id, texto, orden) VALUES ($1,$2,$3)", [pilarId, texto, j]);
      }
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
    for (const [i, texto] of (plan.reglas || []).entries()) {
      if (!texto) continue;
      await client.query("INSERT INTO reglas_decision (usuario_id, texto, orden) VALUES ($1,$2,$3)", [req.usuarioId, texto, i]);
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
