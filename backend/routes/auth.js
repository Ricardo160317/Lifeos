import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { firmarToken } from "../middleware/auth.js";

const router = Router();

router.post("/registro", async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email y contraseña requeridos" });
  try {
    const existe = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (existe.rows.length > 0) return res.status(409).json({ error: "Ya existe una cuenta con ese email" });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email",
      [nombre || "", email, hash]
    );
    const usuario = result.rows[0];
    res.json({ token: firmarToken(usuario), usuario });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al registrar" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    const usuario = result.rows[0];
    if (!usuario) return res.status(401).json({ error: "Credenciales inválidas" });
    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });
    res.json({ token: firmarToken(usuario), usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

export default router;
