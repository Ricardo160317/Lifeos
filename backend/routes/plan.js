import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { pool } from "../db/pool.js";

const router = Router();
router.use(requireAuth);

// ---------- Obtener todo el plan del usuario (pilares + objetivos + hábitos + kpis) ----------
router.get("/completo", async (req, res) => {
  try {
    const plan = await pool.query(
      "SELECT * FROM planes_vida WHERE usuario_id = $1 AND activo = true ORDER BY creado_en DESC LIMIT 1",
      [req.usuarioId]
    );
    if (plan.rows.length === 0) return res.json(null);
    const planVida = plan.rows[0];

    const pilares = await pool.query("SELECT * FROM pilares WHERE plan_vida_id = $1 ORDER BY orden", [planVida.id]);
    const pilarIds = pilares.rows.map((p) => p.id);
    if (pilarIds.length === 0) {
      const reglasVacio = await pool.query("SELECT * FROM reglas_decision WHERE usuario_id = $1 ORDER BY orden", [req.usuarioId]);
      return res.json({ ...planVida, pilares: [], objetivos: [], habitos: [], kpis: [], prioridades: [], reglas: reglasVacio.rows, registros: [] });
    }

    const objetivos = await pool.query("SELECT * FROM objetivos WHERE pilar_id = ANY($1)", [pilarIds]);
    const habitos = await pool.query("SELECT * FROM habitos WHERE pilar_id = ANY($1)", [pilarIds]);
    const kpis = await pool.query("SELECT * FROM kpis WHERE pilar_id = ANY($1)", [pilarIds]);
    const prioridades = await pool.query("SELECT * FROM prioridades WHERE pilar_id = ANY($1) ORDER BY orden", [pilarIds]);
    const reglas = await pool.query("SELECT * FROM reglas_decision WHERE usuario_id = $1 ORDER BY orden", [req.usuarioId]);
    const habitoIds = habitos.rows.map((h) => h.id);
    const registros = habitoIds.length
      ? await pool.query("SELECT * FROM habito_registros WHERE habito_id = ANY($1) ORDER BY fecha DESC LIMIT 1000", [habitoIds])
      : { rows: [] };

    res.json({
      ...planVida,
      pilares: pilares.rows,
      objetivos: objetivos.rows,
      habitos: habitos.rows,
      kpis: kpis.rows,
      prioridades: prioridades.rows,
      reglas: reglas.rows,
      registros: registros.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo el plan" });
  }
});

// ---------- Objetivos ----------
router.post("/objetivos", async (req, res) => {
  const { pilarId, nombre, motivo, valorActual, valorMeta, fechaObjetivo, prioridad } = req.body;
  const r = await pool.query(
    `INSERT INTO objetivos (pilar_id, nombre, motivo, valor_actual, valor_meta, fecha_objetivo, prioridad)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [pilarId, nombre, motivo || "", valorActual || "", valorMeta || "", fechaObjetivo || null, prioridad || "media"]
  );
  res.json(r.rows[0]);
});
router.patch("/objetivos/:id/estado", async (req, res) => {
  const { estado } = req.body;
  const r = await pool.query("UPDATE objetivos SET estado = $1 WHERE id = $2 RETURNING *", [estado, req.params.id]);
  res.json(r.rows[0]);
});

// ---------- Hábitos ----------
router.post("/habitos", async (req, res) => {
  const { pilarId, nombre, frecuencia } = req.body;
  const r = await pool.query("INSERT INTO habitos (pilar_id, nombre, frecuencia) VALUES ($1,$2,$3) RETURNING *", [pilarId, nombre, frecuencia || "diario"]);
  res.json(r.rows[0]);
});
router.post("/habitos/:id/marcar", async (req, res) => {
  const fecha = new Date().toISOString().slice(0, 10);
  const existente = await pool.query("SELECT * FROM habito_registros WHERE habito_id = $1 AND fecha = $2", [req.params.id, fecha]);
  if (existente.rows.length > 0) {
    const r = await pool.query("UPDATE habito_registros SET cumplido = NOT cumplido WHERE id = $1 RETURNING *", [existente.rows[0].id]);
    return res.json(r.rows[0]);
  }
  const r = await pool.query("INSERT INTO habito_registros (habito_id, fecha, cumplido) VALUES ($1,$2,true) RETURNING *", [req.params.id, fecha]);
  res.json(r.rows[0]);
});

// ---------- Prioridades ----------
router.post("/prioridades", async (req, res) => {
  const { pilarId, texto } = req.body;
  const r = await pool.query("INSERT INTO prioridades (pilar_id, texto) VALUES ($1,$2) RETURNING *", [pilarId, texto]);
  res.json(r.rows[0]);
});
router.delete("/prioridades/:id", async (req, res) => {
  await pool.query("DELETE FROM prioridades WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
});

// ---------- Mis reglas de decisión ----------
router.get("/reglas", async (req, res) => {
  const r = await pool.query("SELECT * FROM reglas_decision WHERE usuario_id = $1 ORDER BY orden", [req.usuarioId]);
  res.json(r.rows);
});
router.post("/reglas", async (req, res) => {
  const { texto } = req.body;
  const r = await pool.query("INSERT INTO reglas_decision (usuario_id, texto) VALUES ($1,$2) RETURNING *", [req.usuarioId, texto]);
  res.json(r.rows[0]);
});
router.delete("/reglas/:id", async (req, res) => {
  await pool.query("DELETE FROM reglas_decision WHERE id = $1 AND usuario_id = $2", [req.params.id, req.usuarioId]);
  res.json({ ok: true });
});

// ---------- KPIs ----------
router.post("/kpis", async (req, res) => {
  const { pilarId, nombre, valorActual, valorMeta, unidad } = req.body;
  const r = await pool.query(
    "INSERT INTO kpis (pilar_id, nombre, valor_actual, valor_meta, unidad) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [pilarId, nombre, valorActual || 0, valorMeta || 0, unidad || ""]
  );
  res.json(r.rows[0]);
});
router.patch("/kpis/:id", async (req, res) => {
  const { valorActual } = req.body;
  const r = await pool.query("UPDATE kpis SET valor_actual = $1 WHERE id = $2 RETURNING *", [valorActual, req.params.id]);
  res.json(r.rows[0]);
});

// ---------- Revisiones ----------
router.get("/revisiones", async (req, res) => {
  const r = await pool.query("SELECT * FROM revisiones WHERE usuario_id = $1 ORDER BY fecha DESC", [req.usuarioId]);
  res.json(r.rows);
});
router.post("/revisiones", async (req, res) => {
  const { tipo, logre, fallo, aprendi, prioridadSiguiente } = req.body;
  const r = await pool.query(
    `INSERT INTO revisiones (usuario_id, tipo, logre, fallo, aprendi, prioridad_siguiente)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.usuarioId, tipo || "semanal", logre || "", fallo || "", aprendi || "", prioridadSiguiente || ""]
  );
  res.json(r.rows[0]);
});

export default router;
